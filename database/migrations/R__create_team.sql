DROP PROCEDURE IF EXISTS create_team;

CREATE PROCEDURE create_team(
  IN name VARCHAR(255),
  IN team_lead_id INT,
  IN members JSON DEFAULT '[]'
)
LANGUAGE plpgsql
AS $$
DECLARE
  new_team_id INT;
  member_id INT;
BEGIN
  INSERT INTO teams (name, team_lead_id)
  VALUES (name, team_lead_id)
  RETURNING id INTO new_team_id;

  IF members IS NOT NULL THEN
    FOR member_id IN
      SELECT json_array_elements_text(members)::INT
    LOOP
      INSERT INTO team_members (user_id, team_id)
      VALUES (member_id, new_team_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;
