export interface User {
  id: number
  name: string
  email?: string
  avatar?: string
}

export interface Team {
  id: number
  name: string
  teamLeadId: number
  members: User[]
}

export interface Todo {
  id: number
  title: string
  description?: string
  assignedToId: number | null
  teamId: number
  statusId: number
  priorityId: number
  createdAt: string
  createdBy: number
}

export interface Status {
  id: number
  name: string
}

export interface Priority {
  id: number
  name: string
}
