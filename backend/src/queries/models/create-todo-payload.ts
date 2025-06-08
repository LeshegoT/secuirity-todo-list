export interface CreateTodoPayload {
  title: string;
  assignedToId: number | null;
  teamId: number;
  statusId: number;
  priorityId: number;
  createdBy: number;
  description: string;
}