ALTER TABLE todos
ADD COLUMN last_modified_at DATE;

ALTER TABLE todos
ADD COLUMN last_modified_by INT;

ALTER TABLE todos
ADD CONSTRAINT fk_todos_last_modified_by
    FOREIGN KEY (last_modified_by) REFERENCES users(id)
    ON DELETE RESTRICT;