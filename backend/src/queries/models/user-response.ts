export interface UserResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  password: string;
  secret: string;
  is_verified: boolean;
  created_at: Date;
  userRoles: string[];
}