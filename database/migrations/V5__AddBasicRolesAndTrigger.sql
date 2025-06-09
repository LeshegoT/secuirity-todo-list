INSERT INTO roles (name) VALUES 
  ('team_member'),
  ('team_lead'), 
  ('admin')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
DECLARE
    team_member_role_id INT;
BEGIN
    SELECT id INTO team_member_role_id 
    FROM roles 
    WHERE name = 'team_member';
    
    IF team_member_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (NEW.id, team_member_role_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_default_role
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_role();

-- Comments for documentation
COMMENT ON FUNCTION assign_default_role() IS 'Automatically assigns team_member role to newly created users';
COMMENT ON TRIGGER trigger_assign_default_role ON users IS 'Triggers assignment of default team_member role on user creation';

-- Role descriptions for clarity
UPDATE roles SET name = 'team_member' WHERE name = 'team_member';
UPDATE roles SET name = 'team_lead' WHERE name = 'team_lead';  
UPDATE roles SET name = 'admin' WHERE name = 'admin';
