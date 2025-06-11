CREATE OR REPLACE VIEW todos_by_status_view AS
SELECT
    t.status_id AS "statusId",
    ts.name AS "statusName",

    t.id,
    t.title,

    t.assigned_to_id AS "assignedToId",
    u_assigned.email AS "assignedToEmail",
    u_assigned.name AS "assignedToName",
    u_assigned.uuid AS "assignedToUuid",

    t.team_id AS "teamId",
    tm.name AS "teamName",

    tm.team_lead_id AS "teamLeadId",
    u_team_lead.email AS "teamLeadEmail",
    u_team_lead.name AS "teamLeadName",
    u_team_lead.uuid AS "teamLeadUuid",

    t.priority_id AS "priorityId",
    tp.name AS "priorityName",

    t.created_at AS "createdAt",

    t.created_by AS "createdBy",
    u_created.email AS "createdByEmail",
    u_created.name AS "createdByName",
    u_created.uuid AS "createdByUuid",

    description
FROM
    todos t
    JOIN
        todo_statuses ts ON t.status_id = ts.id
    LEFT JOIN
        users u_assigned ON t.assigned_to_id = u_assigned.id
    LEFT JOIN
        users u_created ON t.created_by = u_created.id
    LEFT JOIN
        teams tm ON t.team_id = tm.id
    LEFT JOIN
        users u_team_lead ON tm.team_lead_id = u_team_lead.id
    LEFT JOIN
        todo_priorities tp ON t.priority_id = tp.id
ORDER BY
    t.status_id ASC,
    t.created_at DESC;

