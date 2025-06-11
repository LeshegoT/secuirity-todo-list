CREATE OR REPLACE FUNCTION todo_audit_logs_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO todo_audit_logs (
        audit_modified_at,
        audit_modified_by,
        audit_action_id,
        todo_id,
        title,
        assigned_to_id,
        team_id,
        status_id,
        priority_id,
        created_at,
        created_by,
        description,
        is_active,
        last_modified_at,
        last_modified_by
    ) VALUES (
        NOW(),
        NEW.last_modified_by,
        (SELECT id FROM audit_actions WHERE action_name = 'INSERT'),
        NEW.id,
        NEW.title,
        NEW.assigned_to_id,
        NEW.team_id,
        NEW.status_id,
        NEW.priority_id,
        NEW.created_at,
        NEW.created_by,
        NEW.description,
        NEW.is_active,
        NEW.last_modified_at,
        NEW.last_modified_by
     );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_todo_audit_logs_insert
    AFTER INSERT ON todos
    FOR EACH ROW
    EXECUTE FUNCTION todo_audit_logs_insert();


CREATE OR REPLACE FUNCTION todo_audit_logs_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO todo_audit_logs (
        audit_modified_at,
        audit_modified_by,
        audit_action_id,
        todo_id,
        title,
        assigned_to_id,
        team_id,
        status_id,
        priority_id,
        created_at,
        created_by,
        description,
        is_active,
        last_modified_at,
        last_modified_by
    ) VALUES (
        NOW(),
        NEW.last_modified_by,
        (SELECT id FROM audit_actions WHERE action_name = 'UPDATE'),
        NEW.id,
        NEW.title,
        NEW.assigned_to_id,
        NEW.team_id,
        NEW.status_id,
        NEW.priority_id,
        NEW.created_at,
        NEW.created_by,
        NEW.description,
        NEW.is_active,
        NEW.last_modified_at,
        NEW.last_modified_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_todo_audit_logs_update
    AFTER UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION todo_audit_logs_update();


CREATE OR REPLACE FUNCTION todo_audit_logs_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO todo_audit_logs (
        audit_modified_at,
        audit_modified_by,
        audit_action_id,
        todo_id,
        title,
        assigned_to_id,
        team_id,
        status_id,
        priority_id,
        created_at,
        created_by,
        description,
        is_active,
        last_modified_at,
        last_modified_by
    ) VALUES (
        NOW(),
        NEW.last_modified_by,
        (SELECT id FROM audit_actions WHERE action_name = 'DELETE'),
        OLD.id,
        OLD.title,
        OLD.assigned_to_id,
        OLD.team_id,
        OLD.status_id,
        OLD.priority_id,
        OLD.created_at,
        OLD.created_by,
        OLD.description,
        OLD.is_active,
        OLD.last_modified_at,
        OLD.last_modified_by
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER trigger_todo_audit_logs_delete
    AFTER DELETE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION todo_audit_logs_delete();
