export interface TodoAuditLog {
    id: number;
    userId: number;
    name: string;
    auditActionId: number;
    todoId: number;
    title: string;
    assignedToId: number;
    teamId: number;
    statusId: number;
    priorityId: number;
    createdAt: Date;
    createdBy: number;
    description: string;
}