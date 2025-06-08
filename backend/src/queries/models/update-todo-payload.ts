export interface UpdateTodoPayload {
  title?: string;
  assignedToId?: number | null;
  teamId?: number;
  statusId?: number;
  priorityId?: number;
  description?: string;
  isActive?: boolean;
}