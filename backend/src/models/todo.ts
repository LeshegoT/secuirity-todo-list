export interface Todo {
  id: number;
  title: string;
  assignedToId: number | null;
  teamId: number;
  statusId: number;
  priorityId: number;
  createdAt: Date;
  createdBy: number;
  description: string;
  isActive: boolean;
  lastModifiedAt: Date;
  lastModifiedBy: number;
}