ALTER TABLE todo_audit_logs
DROP COLUMN user_id;

ALTER TABLE todo_audit_logs
ADD COLUMN audit_modified_at DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE todo_audit_logs
ADD COLUMN audit_modified_by INT NOT NULL;

ALTER TABLE todo_audit_logs
ADD CONSTRAINT fk_todo_audit_logs_audit_modified_by
    FOREIGN KEY (audit_modified_by) REFERENCES users(id)
    ON DELETE RESTRICT;

ALTER TABLE todo_audit_logs
ADD COLUMN last_modified_at DATE;

ALTER TABLE todo_audit_logs
ADD COLUMN last_modified_by INT;

ALTER TABLE todo_audit_logs
ADD CONSTRAINT fk_todos_last_modified_by
    FOREIGN KEY (last_modified_by) REFERENCES users(id)
    ON DELETE RESTRICT;