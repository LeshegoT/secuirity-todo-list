import {TodoResponse, UserInTodoResponse} from "./todo.js";

export interface AuditAction {
    id: number;
    name: string;
}

export interface TodoAuditLogResponse {
    auditLogId: number;
    auditedTimestamp: Date;
    auditModifiedByUser: UserInTodoResponse;
    auditAction: AuditAction;
    todo: TodoResponse;
    changesMade: string
}