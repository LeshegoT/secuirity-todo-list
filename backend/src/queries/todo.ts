import {pool} from "../config/dbconfig.js";
import {
  RawTodo,
  TeamInTodoResponse,
  TodoResponse,
  UserInTodoResponse,
  CreateTodoPayload,
  UpdateTodoPayload,
  TodoCountByPriorityResponse, TodoCountByStatusResponse, TodoByPriorityResponse, TodoByStatusResponse
} from "./models/todo.js";
import {getUserId} from "./users.js";
import {NotFoundError} from "../routes/errors/customError.js";
import {Todo} from "../models/todo.js";
import {TodoStatus} from "../models/todo-status.js";
import {TodoPriority} from "../models/todo-priority.js";
import {AuditAction, TodoAuditLogResponse} from "./models/todo-audit-log.js";

function transformRawTodoToTodoResponse(rawTodo: RawTodo): TodoResponse {

  const baseTodo: Todo = {
    id: rawTodo.id,
    title: rawTodo.title,
    teamId: rawTodo.teamId,
    statusId: rawTodo.statusId,
    priorityId: rawTodo.priorityId,
    createdAt: rawTodo.createdAt,
    description: rawTodo.description,
    isActive: rawTodo.isActive,
    lastModifiedAt: rawTodo.lastModifiedAt
  };

  const assignedToUser: UserInTodoResponse | null = rawTodo.assignedToUuid ? {
    uuid: rawTodo.assignedToUuid,
    name: rawTodo.assignedToName,
    email: rawTodo.assignedToEmail
  } : null;

  const teamLeadUser: UserInTodoResponse = {
    uuid: rawTodo.teamLeadUuid,
    name: rawTodo.teamLeadName,
    email: rawTodo.teamLeadEmail
  };

  const team: TeamInTodoResponse = {
    id: rawTodo.teamId,
    name: rawTodo.teamName,
    teamLead: teamLeadUser
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
    uuid: rawTodo.createdByUuid,
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
      t.team_id AS "teamId",
      t.status_id AS "statusId",
      t.priority_id AS "priorityId",
      t.created_at AS "createdAt",
      t.description,
      t.is_active AS "isActive",
      t.last_modified_at AS "lastModifiedAt",
      ulm.uuid AS "lastModifiedByUuid",
      ulm.name AS "lastModifiedByName",
      ulm.email AS "lastModifiedByEmail",
      us.uuid AS "assignedToUuid",
      us.name AS "assignedToName",
      us.email AS "assignedToEmail",
      ts.name AS "statusName",
      tp.name AS "priorityName",
      uc.uuid AS "createdByUuid",
      uc.name AS "createdByName",
      uc.email AS "createdByEmail",
      teams.name AS "teamName",
      utl.uuid AS "teamLeadUuid",
      utl.name AS "teamLeadName",
      utl.email AS "teamLeadEmail"
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
        LEFT JOIN
            users AS utl ON teams.team_lead_id = utl.id
        LEFT JOIN
            users AS ulm ON t.last_modified_by = ulm.id
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
      is_active,
      last_modified_at,
      last_modified_by
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
      true,
      CURRENT_TIMESTAMP,
      $6
   )
    RETURNING
      id;
    `;

  let assignedToId : number | null = null;
  if (createTodoPayload.assignedToUuid) {
    assignedToId = await getUserId(createTodoPayload.assignedToUuid);

    if (!assignedToId) {
      throw new NotFoundError("Assign To user does not exist");
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
  const params: (number | string | boolean)[] = [id, updateTodoPayload.lastModifiedBy];
  const setSqlQuery = [`last_modified_by = $${2}`, `last_modified_at = NOW()`];
  let paramIndex = 3;

  if (updateTodoPayload.title) {
    setSqlQuery.push(`title = $${paramIndex}`);
    params.push(updateTodoPayload.title);
    paramIndex++;
  }
  if (updateTodoPayload.assignedToUuid) {
    let assignedToId : number | null;
    assignedToId = await getUserId(updateTodoPayload.assignedToUuid);

    if (!assignedToId) {
      throw new NotFoundError("Assign To user does not exist");
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
  if (updateTodoPayload.isActive !== null && updateTodoPayload.isActive !== undefined) {
    setSqlQuery.push(`is_active = $${paramIndex}`);
    params.push(updateTodoPayload.isActive as boolean);
    paramIndex++;
  }

  if (setSqlQuery.length <= 2) {
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

export async function getTodoCountsByPriorityByTeamId(teamId: number): Promise<TodoCountByPriorityResponse[]> {
  try {
    const result = await pool.query('SELECT * FROM get_todos_priority_counts_by_team($1)', [teamId]);

    const response : TodoCountByPriorityResponse[] = [];

    for (const row of result.rows) {
      const priority: TodoPriority = {
        id: row.priorityId,
        name: row.priorityName,
      };

      response.push({
        priority: priority,
        todoCount: row.todoCount
      });
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getTodoCountsByStatusByTeamId(teamId: number): Promise<TodoCountByStatusResponse[]> {
  try {
    const result = await pool.query('SELECT * FROM get_todos_status_counts_by_team($1)', [teamId]);

    const response : TodoCountByStatusResponse[] = [];

    for (const row of result.rows) {
      const status: TodoStatus = {
        id: row.statusId,
        name: row.statusName,
      };

      response.push({
        status: status,
        todoCount: row.todoCount
      });
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getTodosByPriority(teamId: number): Promise<TodoByPriorityResponse[]> {
  try {
    let sqlQuery = `
      SELECT
          "priorityId",
          "priorityName",
          id,
          title,
          "assignedToUuid",
          "assignedToEmail",
          "assignedToName",
          "teamId",
          "teamName",
          "teamLeadUuid",
          "teamLeadEmail",
          "teamLeadName",
          "statusId",
          "statusName",
          "createdAt",
          "createdByUuid",
          "createdByEmail",
          "createdByName",
          description
      FROM todos_by_priority_view
      WHERE "teamId" = $${1}
      ORDER BY "priorityId" ASC, "createdAt" DESC
      `;

    const params = [teamId];

    const result = await pool.query(sqlQuery, params);


    const groupedTodos = new Map();

    result.rows.forEach(row => {
      const priorityKey = row.priorityName;
      if (!groupedTodos.has(priorityKey)) {
        const priority: TodoPriority = {
          id: row.priorityId,
          name: row.priorityName,
        };
        groupedTodos.set(priorityKey, {
          priority: priority,
          todos: []
        });
      }

      const { priorityId, priorityName, ...restOfTodo } = row;
      groupedTodos.get(priorityKey).todos.push(transformRawTodoToTodoResponse(restOfTodo as RawTodo));
    });


    return Array.from(groupedTodos.values());
  } catch (error) {
    throw error;
  }
}

export async function getTodosByStatus(teamId: number): Promise<TodoByStatusResponse[]> {
  try {
    let sqlQuery = `
      SELECT
          "statusId",
          "statusName",
          id,
          title,
          "assignedToUuid",
          "assignedToEmail",
          "assignedToName",
          "teamId",
          "teamName",
          "teamLeadUuid",
          "teamLeadEmail",
          "teamLeadName",
          "priorityId",
          "priorityName",
          "createdAt",
          "createdByUuid",
          "createdByEmail",
          "createdByName",
          description
      FROM todos_by_status_view
      WHERE "teamId" = $${1}
      ORDER BY "statusId" ASC, "createdAt" DESC
      `;

    const params = [teamId];

    const result = await pool.query(sqlQuery, params);


    const groupedTodos = new Map();

    result.rows.forEach(row => {
      const statusKey = row.statusName;
      if (!groupedTodos.has(statusKey)) {
        const status: TodoStatus = {
          id: row.statusId,
          name: row.statusName,
        };
        groupedTodos.set(statusKey, {
          status: status,
          todos: []
        });
      }

      const { statusId, statusName, ...restOfTodo } = row;
      groupedTodos.get(statusKey).todos.push(transformRawTodoToTodoResponse(restOfTodo as RawTodo));
    });


    return Array.from(groupedTodos.values());
  } catch (error) {
    throw error;
  }
}

export async function trackTodoChanges(todoId: number, startDate: string | null = null, endDate: string | null = null): Promise<TodoAuditLogResponse[]> {
  try {
    const result = await pool.query('SELECT * FROM track_todo_changes($1, $2, $3)', [
      todoId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
    ]);

    const response : TodoAuditLogResponse[] = [];

    for (const row of result.rows) {
      const {
        auditLogId,
        auditedTimestamp,
        auditModifiedUuid,
        auditModifiedEmail,
        auditModifiedName,
        auditActionId,
        auditActionName,
        changesMade,
        ...todo
      } = row;

      response.push({
        auditLogId: auditLogId,
        auditedTimestamp: auditedTimestamp,
        auditModifiedByUser: {
          uuid: auditModifiedUuid,
          email: auditModifiedEmail,
          name: auditModifiedName
        },
        auditAction: {
          id: auditActionId,
          name: auditActionId
        },
        todo: transformRawTodoToTodoResponse(todo as RawTodo),
        changesMade: changesMade
      });
    }

    return response;
  } catch (error) {
    throw error;
  }
}