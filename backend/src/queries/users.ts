import { pool } from "../config/dbconfig.js";
import { UserWithRoles, Role } from "../types/types.js";

export async function getUserId(uuid: string): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE uuid = $1`,
    [uuid]
  );

  return result.rows[0]?.id ?? null;
}

// Get all users with their roles
export async function getAllUsers(): Promise<UserWithRoles[]> {
  const result = await pool.query<{
    id: number;
    email: string;
    name: string;
    created_at: Date;
    is_verified: boolean;
    uuid: string;
    roles: string;
  }>(`
    SELECT 
      u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid,
      COALESCE(
        STRING_AGG(r.name, ','), 
        ''
      ) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid
    ORDER BY u.created_at DESC
  `);

  return result.rows.map(row => ({
    ...row,
    roles: row.roles ? row.roles.split(',') : []
  }));
}

// Get user by ID with roles
export async function getUserById(id: number): Promise<UserWithRoles | null> {
  const result = await pool.query<{
    id: number;
    email: string;
    name: string;
    created_at: Date;
    is_verified: boolean;
    uuid: string;
    roles: string;
  }>(`
    SELECT 
      u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid,
      COALESCE(
        STRING_AGG(r.name, ','), 
        ''
      ) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = $1
    GROUP BY u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid
  `, [id]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    ...row,
    roles: row.roles ? row.roles.split(',') : []
  };
}

// Get user by UUID with roles
export async function getUserByUuid(uuid: string): Promise<UserWithRoles | null> {
  const result = await pool.query<{
    id: number;
    email: string;
    name: string;
    created_at: Date;
    is_verified: boolean;
    uuid: string;
    roles: string;
  }>(`
    SELECT 
      u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid,
      COALESCE(
        STRING_AGG(r.name, ','), 
        ''
      ) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.uuid = $1
    GROUP BY u.id, u.email, u.name, u.created_at, u.is_verified, u.uuid
  `, [uuid]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    ...row,
    roles: row.roles ? row.roles.split(',') : []
  };
}

export async function userHasRole(userId: number, roleName: string): Promise<boolean> {
  const result = await pool.query<{ count: string }>(`
    SELECT COUNT(*) as count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 AND r.name = $2
  `, [userId, roleName]);

  return parseInt(result.rows[0]?.count || '0') > 0;
}

export async function getAllRoles(): Promise<Role[]> {
  const result = await pool.query<Role>(`
    SELECT id, name FROM roles ORDER BY name
  `);

  return result.rows;
}

export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, role_id) DO NOTHING
  `, [userId, roleId]);
}

export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  await pool.query(`
    DELETE FROM user_roles 
    WHERE user_id = $1 AND role_id = $2
  `, [userId, roleId]);
}

export async function lockUserAccount(userId: number): Promise<void> {
  await pool.query(`
    UPDATE users 
    SET is_verified = false 
    WHERE id = $1
  `, [userId]);
}

export async function unlockUserAccount(userId: number): Promise<void> {
  await pool.query(`
    UPDATE users 
    SET is_verified = true 
    WHERE id = $1
  `, [userId]);
}

export async function softDeleteUser(userId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    
    await client.query('DELETE FROM team_members WHERE user_id = $1', [userId]);
    
    await client.query('UPDATE teams SET team_lead_id = NULL WHERE team_lead_id = $1', [userId]);
    
    await client.query(`
      UPDATE users 
      SET is_verified = false, 
          email = CONCAT('deleted_', id, '@deleted.local'),
          name = CONCAT('deleted_user_', id)
      WHERE id = $1
    `, [userId]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function generatePasswordResetToken(userId: number): Promise<string> {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  await pool.query(`
    UPDATE users 
    SET secret = $1 
    WHERE id = $2
  `, [token, userId]);
  
  return token;
}

export async function validatePasswordResetToken(userId: number, token: string): Promise<boolean> {
  const result = await pool.query<{ secret: string }>(`
    SELECT secret FROM users WHERE id = $1
  `, [userId]);
  
  return result.rows[0]?.secret === token;
}

export async function clearPasswordResetToken(userId: number): Promise<void> {
  await pool.query(`
    UPDATE users 
    SET secret = NULL 
    WHERE id = $1
  `, [userId]);
}