ALTER TABLE todos ALTER COLUMN created_at TYPE TIMESTAMP;

ALTER TABLE todos
ADD COLUMN last_modified_at TIMESTAMP;

ALTER TABLE todos
ADD COLUMN last_modified_by INT;

ALTER TABLE todos
ADD CONSTRAINT fk_todos_last_modified_by
    FOREIGN KEY (last_modified_by) REFERENCES users(id)
    ON DELETE RESTRICT;