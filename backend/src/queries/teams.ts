import { NewTeam, Team } from "../models/teams";
import { pool } from "../config/dbconfig";

export async function getTeamsForUser(userId: number): Promise<Team[]> {
  const response = await pool.query<Team>(
    `
    SELECT v.*
    FROM user_team_with_todos v
    JOIN teams t ON t.name = v.name
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = $1
    `,
    [userId]
  );
  return response.rows;
}

export async function createTeam(newTeam: NewTeam): Promise<NewTeam> {
  const membersJson = JSON.stringify(
    newTeam.members?.map((member) => member.id) || []
  );

  const query = `
    CALL create_team($1, $2, $3);
  `;

  await pool.query<{ team_id: number }>(query, [
    newTeam.name,
    newTeam.teamLeadId,
    membersJson,
  ]);

  return {
    name: newTeam.name,
    teamLeadId: newTeam.teamLeadId,
    members: newTeam.members || [],
  };
}
