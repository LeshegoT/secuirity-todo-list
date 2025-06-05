DROP VIEW IF EXISTS user_team_with_todos;

CREATE VIEW user_team_with_todos AS
SELECT
  t.id,
  t.name,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', m.id,
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
        'status', ts.name,
        'priority', tp.name,
        'createdAt', td.created_at,
        'assignedTo', au.name
      )
    ) FILTER (WHERE td.id IS NOT NULL),
    '[]'::json
  ) AS todos
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users m ON tm.user_id = m.id
LEFT JOIN todos td ON td.team_id = t.id
LEFT JOIN todo_statuses ts ON td.status_id = ts.id
LEFT JOIN todo_priorities tp ON td.priority_id = tp.id
LEFT JOIN users au ON td.assigned_to_id = au.id
GROUP BY t.id, t.name;
