import { pool } from "../config/dbconfig.js";
import { UserResponse } from "./models/user-response";

export async function getUserId(uuid: string): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE uuid = $1`,
    [uuid]
  );

  return result.rows[0]?.id ?? null;
}

export async function getUser(uuid: string): Promise<UserResponse | null> {
  const sqlQuery = `
    SELECT
       u.id,
       u.email,
       u.name,
       u.created_at AS "createdAt",
       u.is_verified AS "isVerified",
       u.uuid,
       ARRAY_AGG(r.name) AS "userRoles"
    FROM
       users AS u
       LEFT JOIN
            user_roles AS ur ON u.id = ur.user_id
       LEFT JOIN
          roles AS r ON ur.role_id = r.id
    WHERE uuid = $1
    GROUP BY
       u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid;`;

  const params = [uuid];

  const result = await pool.query(sqlQuery, params);

  return result.rows[0] as UserResponse;
}

export async function getAllActiveUsers(): Promise<UserResponse[]> {
  const sqlQuery = `
    SELECT
       u.id,
       u.email,
       u.name,
       u.created_at AS "createdAt",
       u.is_verified AS "isVerified",
       u.uuid,
       u.is_active AS "isActive",
       u.deleted_at AS "deletedAt",
       COALESCE(
         ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
         ARRAY[]::text[]
       ) AS "userRoles"
    FROM
       users AS u
       LEFT JOIN user_roles AS ur ON u.id = ur.user_id
       LEFT JOIN roles AS r ON ur.role_id = r.id
    WHERE u.is_active = true AND u.deleted_at IS NULL
    GROUP BY
       u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid, u.is_active, u.deleted_at
    ORDER BY u.created_at DESC;`;

  const result = await pool.query(sqlQuery);
  return result.rows as UserResponse[];
}

export async function getUserByUUID(
  uuid: string
): Promise<UserResponse | null> {
  const sqlQuery = `
    SELECT
       u.id,
       u.email,
       u.name,
       u.created_at AS "createdAt",
       u.is_verified AS "isVerified",
       u.uuid,
       u.is_active AS "isActive",
       u.deleted_at AS "deletedAt",
       COALESCE(
         ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
         ARRAY[]::text[]
       ) AS "userRoles"
    FROM
       users AS u
       LEFT JOIN user_roles AS ur ON u.id = ur.user_id
       LEFT JOIN roles AS r ON ur.role_id = r.id
    WHERE u.uuid = $1 AND u.is_active = true AND u.deleted_at IS NULL
    GROUP BY
       u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid, u.is_active, u.deleted_at;`;

  const result = await pool.query(sqlQuery, [uuid]);
  return (result.rows[0] as UserResponse) || null;
}

export async function getUserTeamIds(userUUID: string): Promise<number[]> {
  const query = `
    SELECT DISTINCT t.id
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users u ON (tm.user_id = u.id OR t.team_lead_id = u.id)
    WHERE u.uuid = $1 AND u.deleted_at IS NULL
  `;

  const result = await pool.query(query, [userUUID]);
  return result.rows.map((row) => row.id);
}

export async function isUserTeamLead(
  userUUID: string,
  teamId?: number
): Promise<boolean> {
  let query = `
    SELECT 1 FROM teams t
    JOIN users u ON t.team_lead_id = u.id
    WHERE u.uuid = $1 AND u.deleted_at IS NULL
  `;

  const params = [userUUID];

  if (teamId) {
    query += ` AND t.id = $2`;
    params.push(teamId.toString());
  }

  const result = await pool.query(query, params);
  return (result.rowCount ?? 0) > 0;
}

export async function getUsersInTeamLedBy(
  teamLeadUUID: string
): Promise<UserResponse[]> {
  const sqlQuery = `
    SELECT DISTINCT
       u.id,
       u.email,
       u.name,
       u.created_at AS "createdAt",
       u.is_verified AS "isVerified",
       u.uuid,
       u.is_active AS "isActive",
       u.deleted_at AS "deletedAt",
       COALESCE(
         ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
         ARRAY[]::text[]
       ) AS "userRoles"
    FROM users AS u
    LEFT JOIN user_roles AS ur ON u.id = ur.user_id
    LEFT JOIN roles AS r ON ur.role_id = r.id
    JOIN team_members tm ON u.id = tm.user_id
    JOIN teams t ON tm.team_id = t.id
    JOIN users tl ON t.team_lead_id = tl.id
    WHERE tl.uuid = $1 
      AND u.is_active = true 
      AND u.deleted_at IS NULL
      AND tl.deleted_at IS NULL
    GROUP BY u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid, u.is_active, u.deleted_at
    ORDER BY u.created_at DESC
  `;

  const result = await pool.query(sqlQuery, [teamLeadUUID]);
  return result.rows as UserResponse[];
}

export async function canUserModifyTarget(
  actorUUID: string,
  targetUUID: string
): Promise<boolean> {
  const actor = await getUserByUUID(actorUUID);
  if (!actor) return false;

  if (actor.userRoles.includes("admin")) {
    return true;
  }

  if (actor.userRoles.includes("team_lead")) {
    const teamLeadTeams = await getUserTeamIds(actorUUID);
    const targetTeams = await getUserTeamIds(targetUUID);

    return teamLeadTeams.some((teamId) => targetTeams.includes(teamId));
  }

  return false;
}

export async function modifyUserRoles(
  userUUID: string,
  roleNames: string[],
  operation: "add" | "remove" | "replace" = "replace"
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userId = await getUserId(userUUID);
    if (!userId) {
      throw new Error("User not found");
    }

    let roleIds: number[] = [];
    if (roleNames.length > 0) {
      const roleQuery = `SELECT id, name FROM roles WHERE name = ANY($1::text[])`;
      const roleResult = await client.query(roleQuery, [roleNames]);
      roleIds = roleResult.rows.map((row) => row.id);

      if (roleIds.length !== roleNames.length) {
        const existingRoleNames = roleResult.rows.map((row) => row.name);
        const missingRoles = roleNames.filter(
          (name) => !existingRoleNames.includes(name)
        );
        throw new Error(`Roles not found: ${missingRoles.join(", ")}`);
      }
    }

    if (operation === "replace") {
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);

      if (roleIds.length > 0) {
        const roleValues = roleIds
          .map((roleId, index) => `($1, $${index + 2})`)
          .join(", ");
        const roleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES ${roleValues}`;
        await client.query(roleQuery, [userId, ...roleIds]);
      }
    } else if (operation === "add") {
      const existingRolesQuery = `SELECT role_id FROM user_roles WHERE user_id = $1`;
      const existingRolesResult = await client.query(existingRolesQuery, [
        userId,
      ]);
      const existingRoleIds = existingRolesResult.rows.map(
        (row) => row.role_id
      );

      const newRoleIds = roleIds.filter((id) => !existingRoleIds.includes(id));

      if (newRoleIds.length > 0) {
        const roleValues = newRoleIds
          .map((roleId, index) => `($1, $${index + 2})`)
          .join(", ");
        const roleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES ${roleValues}`;
        await client.query(roleQuery, [userId, ...newRoleIds]);
      }
    } else if (operation === "remove") {
      if (roleIds.length > 0) {
        const roleQuery = `DELETE FROM user_roles WHERE user_id = $1 AND role_id = ANY($2::int[])`;
        await client.query(roleQuery, [userId, roleIds]);
      }
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserRoles(
  userUUID: string,
  roleNames: string[]
): Promise<boolean> {
  return modifyUserRoles(userUUID, roleNames, "replace");
}

export async function toggleUserLock(
  userUUID: string,
  isActive: boolean
): Promise<boolean> {
  const query = `
    UPDATE users 
    SET is_active = $1
    WHERE uuid = $2 AND deleted_at IS NULL
    RETURNING id
  `;

  const result = await pool.query(query, [isActive, userUUID]);
  return (result.rowCount ?? 0) > 0;
}

export async function softDeleteUser(userUUID: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userId = await getUserId(userUUID);
    if (!userId) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("DELETE FROM team_members WHERE user_id = $1", [userId]);

    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);

    await client.query(
      "UPDATE teams SET team_lead_id = NULL WHERE team_lead_id = $1",
      [userId]
    );

    const deleteQuery = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, is_active = false
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await client.query(deleteQuery, [userId]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function verifyUserExists(userUUID: string): Promise<boolean> {
  const query = "SELECT 1 FROM users WHERE uuid = $1 AND deleted_at IS NULL";
  const result = await pool.query(query, [userUUID]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAllRoles(): Promise<{ id: number; name: string }[]> {
  const query = "SELECT id, name FROM roles ORDER BY name";
  const result = await pool.query(query);
  return result.rows;
}

export async function getUserTeams(
  userUUID: string
): Promise<{ id: number; name: string; is_lead: boolean }[]> {
  const query = `
    SELECT DISTINCT
      t.id,
      t.name,
      CASE WHEN t.team_lead_id = u.id THEN true ELSE false END as is_lead
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users u ON (tm.user_id = u.id OR t.team_lead_id = u.id)
    WHERE u.uuid = $1 AND u.deleted_at IS NULL
    ORDER BY t.name
  `;

  const result = await pool.query(query, [userUUID]);
  return result.rows;
}
