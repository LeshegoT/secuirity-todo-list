import { pool } from "../config/dbconfig.js";
import {UserResponse} from "./models/user-response";

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
       u.created_at,
       u.is_verified,
       u.uuid,
       ARRAY_AGG(r.name) AS userRoles
    FROM
       users AS u
       LEFT JOIN
            user_roles AS ur ON u.id = ur.user_id
       LEFT JOIN
          roles AS r ON ur.role_id = r.id
    GROUP BY
       u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid
    WHERE uuid = $1;`;

  const params = [
    uuid
  ];

  const result = await pool.query(sqlQuery, params);

  return result.rows[0] as UserResponse;
}
