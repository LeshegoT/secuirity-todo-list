export interface CreateTodoPayload {
  title: string;
  assignedToUuid: string | null;
  teamId: number;
  statusId: number;
  priorityId: number;
  createdBy: number;
  description: string;
}