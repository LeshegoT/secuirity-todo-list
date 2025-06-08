import {pool} from "../config/dbconfig";
import {TodoResponse} from "./models/todo-response";
import {CreateTodoPayload} from "./models/create-todo-payload";
import {UpdateTodoPayload} from "./models/update-todo-payload";

export async function getTodos(
  filters: {
    id?: number | undefined | null;
    teamId?: number | undefined | null;
    assignedToId?: number | undefined | null;
    statusId?: number | undefined | null;
    priorityId?: number | undefined | null }
): Promise<TodoResponse[]> {
  let sqlQuery = `
    SELECT
      t.id,
      t.title,
      t.assigned_to_id,
      t.team_id,
      t.status_id,
      t.priority_id,
      t.created_at,
      t.created_by,
      t.description,
      us.name AS assigned_to_name,
      ts.name AS status_name,
      tp.name AS priority_name,
      uc.name AS created_by_name
    FROM
        todos AS t
            LEFT JOIN
        users AS us ON t.assigned_to_id = us.id
            LEFT JOIN
        todo_statuses AS ts ON t.status_id = ts.id
            LEFT JOIN
        todo_priorities AS tp ON t.priority_id = tp.id
            LEFT JOIN
        users AS uc ON t.created_by = uc.id
  `;

  const params: (number)[] = [];
  const whereSqlQuery = [];
  let paramIndex = 1;

  if (filters?.id) {
    whereSqlQuery.push(`t.id = $${paramIndex}`);
    params.push(filters.id);
    paramIndex++;
  }
  if (filters?.teamId) {
    whereSqlQuery.push(`t.team_id = $${paramIndex}`);
    params.push(filters.teamId);
    paramIndex++;
  }
  if (filters?.assignedToId) {
    whereSqlQuery.push(`t.assigned_to_id = $${paramIndex}`);
    params.push(filters.assignedToId);
    paramIndex++;
  }
  if (filters?.statusId) {
    whereSqlQuery.push(`t.status_id = $${paramIndex}`);
    params.push(filters.statusId);
    paramIndex++;
  }
  if (filters?.priorityId) {
    whereSqlQuery.push(`t.priority_id = $${paramIndex}`);
    params.push(filters.priorityId);
    paramIndex++;
  }

  if (whereSqlQuery.length > 0) {
    sqlQuery += ` WHERE ${whereSqlQuery.join(" AND ")}`;
  } else {
    sqlQuery += ';';
  }
  console.log('sqlQuery', sqlQuery);
  console.log('params', params);
  const result = await pool.query(sqlQuery, params);
  console.log('result', result);
  return result.rows as TodoResponse[];
}

export async function createTodo(createTodoPayload: CreateTodoPayload): Promise<TodoResponse> {
  const sqlQuery = `
    INSERT INTO todos (
      title,
      assigned_to_id,
      team_id,
      status_id,
      priority_id,
      created_at,
      created_by,
      description,
      isActive
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      Date.Now(),
      $6,
      $7,
      true
   )
    RETURNING
      id,
      title,
      assigned_to_id,
      team_id,
      status_id,
      priority_id,
      created_at,
      created_by,
      description,
      isActive;
    `;

  const params = [
      createTodoPayload.title,
      createTodoPayload.assignedToId,
      createTodoPayload.teamId,
      createTodoPayload.statusId,
      createTodoPayload.priorityId,
      createTodoPayload.createdBy,
      createTodoPayload.description
  ];

  const result = await pool.query(sqlQuery, params);
  return result.rows[0] as TodoResponse;
}

export async function updateTodo(id: number, updateTodoPayload: UpdateTodoPayload): Promise<TodoResponse> {
  const sqlQuery = `
    UPDATE todos
    SET
      title = COALESCE($2, title),
      assigned_to_id = COALESCE($3, assigned_to_id),
      team_id = COALESCE($4, team_id),
      status_id = COALESCE($5, status_id),
      priority_id = COALESCE($6, priority_id),
      description = COALESCE($7, description),
      isActive = COALESCE($8, isActive)
    WHERE
        id = $1
    RETURNING
      id,
      title,
      assigned_to_id,
      team_id,
      status_id,
      priority_id,
      created_at,
      created_by,
      description,
      isActive;
  `;

  const params = [
    id,
    updateTodoPayload.title,
    updateTodoPayload.assignedToId,
    updateTodoPayload.teamId,
    updateTodoPayload.statusId,
    updateTodoPayload.priorityId,
    updateTodoPayload.description,
    updateTodoPayload.isActive
  ];

  const result = await pool.query(sqlQuery, params);
  return result.rows[0] as TodoResponse;
}