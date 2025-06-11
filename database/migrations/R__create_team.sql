DROP PROCEDURE IF EXISTS create_team;

CREATE PROCEDURE create_team(
  IN name VARCHAR(255),
  IN team_lead_uuid UUID,
  IN members JSON DEFAULT '[]'
)
LANGUAGE plpgsql
AS $$
DECLARE
  new_team_id INT;
  member_uuid UUID;
  member_id INT;
  team_lead_id INT;
BEGIN
  SELECT id INTO team_lead_id FROM users WHERE uuid = team_lead_uuid;

  IF team_lead_id IS NULL THEN
    RAISE EXCEPTION 'Team lead UUID % not found in users table', team_lead_uuid;
  END IF;

  INSERT INTO teams (name, team_lead_id)
  VALUES (name, team_lead_id)
  RETURNING id INTO new_team_id;

  INSERT INTO team_members (user_id, team_id)
  VALUES (team_lead_id, new_team_id)
  ON CONFLICT DO NOTHING;

  IF members IS NOT NULL THEN
    FOR member_uuid IN
      SELECT json_array_elements_text(members)::UUID
    LOOP
      SELECT id INTO member_id FROM users WHERE uuid = member_uuid;

      IF member_id IS NULL THEN
        RAISE EXCEPTION 'User UUID % not found in users table', member_uuid;
      END IF;

      IF member_id != team_lead_id THEN
        INSERT INTO team_members (user_id, team_id)
        VALUES (member_id, new_team_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$;
