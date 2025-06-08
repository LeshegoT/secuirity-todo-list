DROP VIEW IF EXISTS user_team_with_todos;

CREATE VIEW user_team_with_todos AS
SELECT
  t.id,
  t.name,
  tl.uuid AS "teamLeadUuid",
  tl.name AS "teamLeadName",
  
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'uuid', m.uuid,   
        'name', m.name
      )
    ) FILTER (WHERE m.id IS NOT NULL),
    '[]'::json
  ) AS members,
  
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', td.id,
        'title', td.title,
        'description', td.description,
        'assignedToId', au.uuid,
        'teamId', td.team_id,
        'statusId', td.status_id,
        'priorityId', td.priority_id,
        'createdAt', td.created_at,
        'createdBy', td.created_by
      )
    ) FILTER (WHERE td.id IS NOT NULL),
    '[]'::json
  ) AS todos
FROM teams t
LEFT JOIN users tl ON t.team_lead_id = tl.id       
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users m ON tm.user_id = m.id
LEFT JOIN todos td ON td.team_id = t.id
LEFT JOIN users au ON td.assigned_to_id = au.id   
GROUP BY t.id, t.name, tl.uuid, tl.name;
