
import { pool } from "../config/dbconfig.js";
import { Status } from "../models/model.js";

export async function getStatuses(): Promise<Status[]> {
  const response = await pool.query<Status>(
    `
    SELECT id,name FROM todo_statuses
    `
  );
  return response.rows;
}

