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
  tl.id AS "teamLeadId",
  tl.name AS "teamLeadName"
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users m ON tm.user_id = m.id
LEFT JOIN users tl ON t.team_lead_id = tl.id
GROUP BY t.id, t.name, tl.id, tl.name;