export interface User {
  uuid: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Team {
  id: number;
  name: string;
  teamLeadUuid: string;
  teamLeadName: string;
  members: User[];
  todos: Todo[];
}

export interface Todo {
  id: number;
  title: string;
  teamId: number;
  statusId: number;
  createdAt: string;
  createdBy: number | null;
  priorityId: number;
  assignedToId: string | null;
  description?: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface Priority {
  id: number;
  name: string;
}

export interface TodoCountByPriority {
  priority: Priority
  todoCount: number
}

export interface TodoCountByStatus {
  status: Status
  todoCount: number
}

export interface TodosByPriority {
  priority: Priority
  todos: Todo[]
}

export interface TodosByStatus {
  status: Status
  todos: Todo[]
}

export interface TodoAuditLog {
  auditLogId: number
  auditedTimestamp: string
  auditModifiedByUser: User
  auditAction: {
    id: number
    name: string
  }
  todo: Todo
  changesMade: string
}
