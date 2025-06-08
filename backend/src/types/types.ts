import type { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: JWTPayload;
  userId?: number; // Added for admin middleware
  validatedUserId?: number; // Added for validation middleware
}

export interface User {
  id: string;
  uuid: string; 
  name: string;
  email: string;
  password: string;
  secret: string; 
  is_verified: boolean; 
  created_at: Date;
}

// Extended user interface with roles for admin operations
export interface UserWithRoles {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  is_verified: boolean;
  uuid: string;
  roles: string[];
}

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  user_id: number;
  role_id: number;
  role_name: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  uuid: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totpToken?: string;
}

export interface LoginResponse {
  token?: string;
  user?: UserResponse;
  requiresTwoFactor?: boolean;
  message: string;
}

export interface RegisterResponse {
  uuid: string;
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

export interface VerifyRequest {
  uuid: string;
  token: string;
}

export interface ValidateRequest {
  token: string;
}

export interface JWTPayload {
  uuid: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
}

// Admin operation request types
export interface RoleAssignmentRequest {
  action: 'assign' | 'remove';
  roleIds: number[];
}

export interface AccountLockRequest {
  action: 'lock' | 'unlock';
}