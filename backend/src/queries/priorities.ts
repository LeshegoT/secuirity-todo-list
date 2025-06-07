
import { pool } from "../config/dbconfig.js";
import { Priority } from "../models/model.js";

export async function getPriorities(): Promise<Priority[]> {
  const response = await pool.query<Priority>(
    `
    SELECT * FROM todo_priorities
    `
  );
  return response.rows;
}

