CREATE OR REPLACE FUNCTION track_todo_changes(
    p_todo_id INT,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    "auditLogId" INT,
    "auditedTimestamp" TIMESTAMP,
    "auditModifiedBy" INT,
    "auditModifiedEmail" VARCHAR,
    "auditModifiedName" VARCHAR,
    "auditModifiedUuid" UUID,
    "auditActionId" INT,
    "auditActionName" CHAR(6),
    "todoId" INT,
    title VARCHAR,
    "assignedToId" INT,
    "assignedToEmail" VARCHAR,
    "assignedToName" VARCHAR,
    "assignedToUuid" UUID,
    "teamId" INT,
    "teamName" VARCHAR,
    "teamLeadId" INT,
    "teamLeadEmail" VARCHAR,
    "teamLeadName" VARCHAR,
    "teamLeadUuid" UUID,
    "statusId" INT,
    "statusName" VARCHAR,
    "priorityId" INT,
    "priorityName" VARCHAR,
    "description" VARCHAR,
    "isActive" BOOLEAN,
    "createdAt" TIMESTAMP,
    "createdBy" INT,
    "createdByEmail" VARCHAR,
    "createdByName" VARCHAR,
    "createdByUuid" UUID,
    "changesMade" VARCHAR
)
AS $$
BEGIN
RETURN QUERY
    WITH audited_changes AS (
            SELECT
                tal.id AS audit_log_id,
                tal.audit_modified_at AS audited_timestamp,
                tal.audit_modified_by,
                tal.audit_action_id,
                tal.todo_id,
                tal.title,
                tal.assigned_to_id,
                tal.team_id,
                tal.status_id,
                tal.priority_id,
                tal.description,
                tal.is_active,
                tal.created_at,
                tal.created_by,
                LAG(tal.title) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_title,
                LAG(tal.assigned_to_id) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_assigned_to_id,
                LAG(tal.team_id) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_team_id,
                LAG(tal.status_id) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_status_id,
                LAG(tal.priority_id) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_priority_id,
                LAG(tal.description) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_description,
                LAG(tal.is_active) OVER (PARTITION BY tal.todo_id ORDER BY tal.audit_modified_at) AS prev_is_active
            FROM
                todo_audit_logs tal
            WHERE
                tal.todo_id = p_todo_id
                AND (p_start_date IS NULL OR tal.audit_modified_at::TIMESTAMP >= p_start_date)
                AND (p_end_date IS NULL OR tal.audit_modified_at::TIMESTAMP <= p_end_date)
        )
SELECT
    ac.audit_log_id AS "auditLogId",
    ac.audited_timestamp AS "auditedTimestamp",

    ac.audit_modified_by AS "auditModifiedBy",
    u_audit.email AS "auditModifiedEmail",
    u_audit.name AS "auditModifiedName",
    u_audit.uuid AS "auditModifiedUuid",

    ac.audit_action_id AS "auditActionId",
    aa.action_name AS "auditActionName",

    ac.todo_id AS "todoId",
    ac.title,

    ac.assigned_to_id AS "assignedToId",
    u_assigned.email AS "assignedToEmail",
    u_assigned.name AS "assignedToName",
    u_assigned.uuid AS "assignedToUuid",

    ac.team_id AS "teamId",
    tm.name AS "teamName",

    tm.team_lead_id AS "teamLeadId",
    u_team_lead.email AS "teamLeadEmail",
    u_team_lead.name AS "teamLeadName",
    u_team_lead.uuid AS "teamLeadUuid",

    ac.status_id AS "statusId",
    ts.name AS "statusName",

    ac.priority_id AS "priorityId",
    tp.name AS "priorityName",

    ac.description,

    ac.is_active AS "isActive",

    ac.created_at AS "createdAt",

    ac.created_by AS "createdBy",
    u_created_by.email AS "createdByEmail",
    u_created_by.name AS "createdByName",
    u_created_by.uuid AS "createdByUuid",

    (CASE
         WHEN aa.action_name = 'INSERT' THEN 'TODO created.'
         WHEN aa.action_name = 'DELETE' THEN 'TODO deleted.'
         ELSE
             TRIM(BOTH FROM CONCAT_WS(E'\n',
                  CASE WHEN ac.title IS DISTINCT FROM ac.prev_title THEN
                      'Title: ' || COALESCE(ac.prev_title, '[NULL]') || ' -> ' || COALESCE(ac.title, '[NULL]')
                  ELSE NULL END,
                  CASE WHEN ac.assigned_to_id IS DISTINCT FROM ac.prev_assigned_to_id THEN
                      'Assigned To: ' || COALESCE(u_prev_assigned.name, '[Unassigned]') || ' -> ' || COALESCE(u_assigned.name, '[Unassigned]')
                  ELSE NULL END,
                  CASE WHEN ac.team_id IS DISTINCT FROM ac.prev_team_id THEN
                      'Team: ' || COALESCE(tm_prev.name, '[No Team]') || ' -> ' || COALESCE(tm.name, '[No Team]')
                  ELSE NULL END,
                  CASE WHEN ac.status_id IS DISTINCT FROM ac.prev_status_id THEN
                      'Status: ' || COALESCE(ts_prev.name, '[NULL]') || ' -> ' || COALESCE(ts.name, '[NULL]')
                  ELSE NULL END,
                  CASE WHEN ac.priority_id IS DISTINCT FROM ac.prev_priority_id THEN
                      'Priority: ' || COALESCE(tp_prev.name, '[NULL]') || ' -> ' || COALESCE(tp.name, '[NULL]')
                  ELSE NULL END,
                  CASE WHEN ac.description IS DISTINCT FROM ac.prev_description THEN
                      'Description: ' || COALESCE(ac.prev_description, '[NULL]') || ' -> ' || COALESCE(ac.description, '[NULL]')
                  ELSE NULL END,
                  CASE WHEN ac.is_active IS DISTINCT FROM ac.prev_is_active THEN
                      'Is Active: ' || COALESCE(ac.prev_is_active::VARCHAR, '[NULL]') || ' -> ' || COALESCE(ac.is_active::VARCHAR, '[NULL]')
                  ELSE NULL END
        ))
        END)::VARCHAR AS "changesMade"
FROM
    audited_changes ac
        JOIN
    audit_actions aa ON ac.audit_action_id = aa.id
        LEFT JOIN
    users u_audit ON ac.audit_modified_by = u_audit.id
        LEFT JOIN
    users u_assigned ON ac.assigned_to_id = u_assigned.id
        LEFT JOIN
    todo_statuses ts ON ac.status_id = ts.id
        LEFT JOIN
    todo_priorities tp ON ac.priority_id = tp.id
        LEFT JOIN
    teams tm ON ac.team_id = tm.id
        LEFT JOIN
    users u_team_lead ON tm.team_lead_id = u_team_lead.id
        LEFT JOIN
    users u_prev_assigned ON ac.prev_assigned_to_id = u_prev_assigned.id
        LEFT JOIN
    todo_statuses ts_prev ON ac.prev_status_id = ts_prev.id
        LEFT JOIN
    todo_priorities tp_prev ON ac.prev_priority_id = tp_prev.id
        LEFT JOIN
    teams tm_prev ON ac.prev_team_id = tm_prev.id
        LEFT JOIN
    users u_created_by ON ac.created_by = u_created_by.id
ORDER BY
    ac.audited_timestamp ASC;
END;
$$ LANGUAGE plpgsql;
