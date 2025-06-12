import { NewTeam, Team } from "../models/teams";
import { pool } from "../config/dbconfig.js";
import { PoolClient } from "pg";

export async function getTeamsForUser(userId: number): Promise<Team[]> {
  const response = await pool.query<Team>(
    `
    SELECT v.*
    FROM user_team_with_todos v
    JOIN teams t ON t.name = v.name
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = $1
    `,
    [userId]
  );
  return response.rows;
}

export async function createTeam(
  teamLeadUUid: string,
  newTeam: NewTeam
): Promise<NewTeam> {
  const membersJson = JSON.stringify(
    newTeam.members?.map((member) => member.uuid) || []
  );

  const query = `
    CALL create_team($1, $2, $3);
  `;

  await pool.query<{ team_id: number }>(query, [
    newTeam.name,
    teamLeadUUid,
    membersJson,
  ]);

  return {
    name: newTeam.name,
    members: newTeam.members || [],
  };
}

export async function getTeamByTeamId(teamId: number): Promise<Team | null> {
  const response = await pool.query(
    `
    SELECT *
    FROM teams
    WHERE id = $1
    `,
    [teamId]
  );
  return response.rows[0];
}

interface UpdateTeamPayload {
  name?: string;
  membersToAdd?: string[];
  membersToRemove?: string[];
}

export async function getTeamLeadUuid(teamId: number): Promise<string | null> {
  const result = await pool.query(
    `SELECT u.uuid
     FROM teams t
     JOIN users u ON t.team_lead_id = u.id
     WHERE t.id = $1`,
    [teamId]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].uuid;
}

interface UpdateTeamPayload {
  membersToAdd?: string[];
  membersToRemove?: string[];
}

export async function updateTeam(
  teamId: number,
  payload: UpdateTeamPayload
): Promise<Team | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (payload.membersToRemove?.length) {
      const removeIds = await getUserIdsByUuids(
        payload.membersToRemove,
        client
      );
      if (removeIds.length > 0) {
        await client.query(
          `DELETE FROM team_members WHERE team_id = $1 AND user_id = ANY($2::int[])`,
          [teamId, removeIds]
        );
      }
    }

    if (payload.membersToAdd?.length) {
      const addIds = await getUserIdsByUuids(payload.membersToAdd, client);
      if (addIds.length > 0) {
        const membersJson = JSON.stringify(
          addIds.map((userId) => ({
            team_id: teamId,
            user_id: userId,
          }))
        );

        await client.query(
          `
          INSERT INTO team_members (team_id, user_id)
          SELECT team_id, user_id
          FROM jsonb_to_recordset($1::jsonb)
          AS x(team_id INT, user_id INT)
          ON CONFLICT DO NOTHING
          `,
          [membersJson]
        );
      }
    }

    await client.query("COMMIT");

    const updatedTeam = await getTeamByTeamId(teamId);
    return updatedTeam || null;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to update team:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function getUserIdsByUuids(
  uuids: string[],
  client: PoolClient
): Promise<number[]> {
  const result = await client.query(
    `SELECT id FROM users WHERE uuid::text = ANY($1)`,
    [uuids]
  );
  return result.rows.map((row) => row.id);
}
