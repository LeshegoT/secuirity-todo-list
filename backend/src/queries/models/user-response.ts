export interface UserResponse {
  id: number
  email: string
  name: string
  createdAt: Date
  isVerified: boolean
  uuid: string
  userRoles: string[]
  isActive?: boolean
  deletedAt?: Date | null
}