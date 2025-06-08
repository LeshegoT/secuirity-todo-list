export interface UserResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  userRoles: string[];
}