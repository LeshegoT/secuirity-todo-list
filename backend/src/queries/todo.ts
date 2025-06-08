import {pool} from "../config/dbconfig";
import {RawTodo, TeamInTodoResponse, TodoResponse, UserInTodoResponse, CreateTodoPayload, UpdateTodoPayload} from "./models/todo";
import {getUserId} from "./users";
import {NotFoundError} from "../routes/errors/customError";
import {Todo} from "../models/todo";
import {TodoStatus} from "../models/todo-status";
import {TodoPriority} from "../models/todo-priority";

function transformRawTodoToTodoResponse(rawTodo: RawTodo): TodoResponse {

  const baseTodo: Todo = {
    id: rawTodo.id,
    title: rawTodo.title,
    assignedToId: rawTodo.assignedToId,
    teamId: rawTodo.teamId,
    statusId: rawTodo.statusId,
    priorityId: rawTodo.priorityId,
    createdAt: rawTodo.createdAt,
    createdBy: rawTodo.createdBy,
    description: rawTodo.description,
    isActive: rawTodo.isActive
  };

  const assignedToUser: UserInTodoResponse | null = rawTodo.assignedToId ? {
    id: rawTodo.assignedToId,
    name: rawTodo.assignedToName,
    email: rawTodo.assignedToEmail
  } : null;

  const team: TeamInTodoResponse = {
    id: rawTodo.teamId,
    name: rawTodo.teamName
  };

  const status: TodoStatus = {
    id: rawTodo.statusId,
    name: rawTodo.statusName
  };

  const priority: TodoPriority = {
    id: rawTodo.priorityId,
    name: rawTodo.priorityName,
  };

  const createdByUser: UserInTodoResponse = {
    id: rawTodo.createdBy,
    name: rawTodo.createdByName,
    email: rawTodo.createdByEmail
  };

  return {
    ...baseTodo,
    assignedToUser: assignedToUser,
    team: team,
    status: status,
    priority: priority,
    createdByUser: createdByUser,
  };
}

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
      t.assigned_to_id AS "assignedToId",
      t.team_id AS "teamId",
      t.status_id AS "statusId",
      t.priority_id AS "priorityId",
      t.created_at AS "createdAt",
      t.created_by AS "createdBy",
      t.description,
      t.is_active AS "isActive",
      us.name AS "assignedToName",
      us.email AS "assignedToEmail",
      ts.name AS "statusName",
      tp.name AS "priorityName",
      uc.name AS "createdByName",
      uc.email AS "createdByEmail",
      teams.name AS "teamName"
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
            LEFT JOIN
        teams AS teams ON teams.id = t.team_id
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

  const result = await pool.query(sqlQuery, params);

  const response : TodoResponse[] = [];


  for (const row of result.rows) {
    response.push(transformRawTodoToTodoResponse(row as RawTodo));
  }

  return response;
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
      is_active
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      CURRENT_TIMESTAMP,
      $6,
      $7,
      true
   )
    RETURNING
      id;
    `;

  let assignedToId : number | null = null;
  if (createTodoPayload.assignedToUuid) {
    assignedToId = await getUserId(createTodoPayload.assignedToUuid);

    if (!assignedToId) {
      throw new NotFoundError("AssignToUserNotFound", "Assign To user does not exist");
    }
  }

  const params = [
      createTodoPayload.title,
      assignedToId,
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
  const params: (number | string | boolean)[] = [id];
  const setSqlQuery = [];
  let paramIndex = 2;

  if (updateTodoPayload.title) {
    setSqlQuery.push(`title = $${paramIndex}`);
    params.push(updateTodoPayload.title);
    paramIndex++;
  }
  if (updateTodoPayload.assignedToUuid) {
    let assignedToId : number | null;
    assignedToId = await getUserId(updateTodoPayload.assignedToUuid);

    if (!assignedToId) {
      throw new NotFoundError("AssignToUserNotFound", "Assign To user does not exist");
    }

    setSqlQuery.push(`assigned_to_id = $${paramIndex}`);
    params.push(assignedToId);
    paramIndex++;
  }
  if (updateTodoPayload.teamId) {
    setSqlQuery.push(`team_id = $${paramIndex}`);
    params.push(updateTodoPayload.teamId);
    paramIndex++;
  }
  if (updateTodoPayload.statusId) {
    setSqlQuery.push(`status_id = $${paramIndex}`);
    params.push(updateTodoPayload.statusId);
    paramIndex++;
  }
  if (updateTodoPayload.priorityId) {
    setSqlQuery.push(`priority_id = $${paramIndex}`);
    params.push(updateTodoPayload.priorityId);
    paramIndex++;
  }
  if (updateTodoPayload.description) {
    setSqlQuery.push(`description = $${paramIndex}`);
    params.push(updateTodoPayload.description);
    paramIndex++;
  }
  if (updateTodoPayload.isActive !== null || updateTodoPayload.isActive !== undefined) {
    setSqlQuery.push(`is_active = $${paramIndex}`);
    params.push(updateTodoPayload.isActive as boolean);
    paramIndex++;
  }

  if (setSqlQuery.length === 0) {
    throw new Error("Cannot update todos if you're not changing any values");
  }



  const sqlQuery = `
    UPDATE todos
    SET 
      ${setSqlQuery.join(", ")}
    WHERE
        id = $1
    RETURNING
      id;
  `;

  const result = await pool.query(sqlQuery, params);
  return result.rows[0] as TodoResponse;
}