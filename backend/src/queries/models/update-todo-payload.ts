export interface UpdateTodoPayload {
  title?: string;
  assignedToUuid?: string | null;
  teamId?: number;
  statusId?: number;
  priorityId?: number;
  description?: string;
  isActive?: boolean;
}