CREATE TABLE audit_actions (
    id SERIAL PRIMARY KEY,
    action_name CHAR(6) UNIQUE NOT NULL
);

INSERT INTO audit_actions (action_name) VALUES
    ('INSERT'),
    ('UPDATE'),
    ('DELETE');

ALTER TABLE todo_audit_logs
DROP COLUMN action;

ALTER TABLE todo_audit_logs
    ADD COLUMN audit_action_id INTEGER;

ALTER TABLE todo_audit_logs
    ADD CONSTRAINT fk_todo_audit_actions
        FOREIGN KEY (audit_action_id) REFERENCES audit_actions(id);
