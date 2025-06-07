import { pool } from "../config/dbconfig.js";

export async function getUserId(uuid: string): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE uuid = $1`,
    [uuid]
  );

  return result.rows[0]?.id ?? null;
}
