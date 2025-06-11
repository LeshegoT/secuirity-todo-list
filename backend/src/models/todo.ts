export interface Todo {
  id: number;
  title: string;
  teamId: number;
  statusId: number;
  priorityId: number;
  createdAt: Date;
  description: string;
  isActive: boolean;
  lastModifiedAt: Date;
}