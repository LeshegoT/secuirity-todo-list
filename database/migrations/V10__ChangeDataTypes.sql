DROP FUNCTION IF EXISTS get_todos_priority_counts_by_team;
DROP VIEW IF EXISTS todos_by_priority_view;
DROP FUNCTION IF EXISTS get_todos_status_counts_by_team;
DROP VIEW IF EXISTS todos_by_status_view;
DROP FUNCTION IF EXISTS track_todo_changes;
DROP VIEW IF EXISTS user_team_with_todos;

ALTER TABLE teams ALTER COLUMN name TYPE VARCHAR(50);
ALTER TABLE todos ALTER COLUMN description TYPE VARCHAR(255);
ALTER TABLE todo_audit_logs ALTER COLUMN description TYPE VARCHAR(255);
