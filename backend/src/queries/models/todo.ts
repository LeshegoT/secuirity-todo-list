import {Todo} from "../../models/todo";
import {TodoStatus} from "../../models/todo-status";
import {TodoPriority} from "../../models/todo-priority";

export interface RawTodo {
    id: number;
    title: string;
    teamId: number;
    statusId: number;
    priorityId: number;
    createdAt: Date;
    createdByUuid: string;
    createdByName: string;
    createdByEmail: string;
    description: string;
    isActive: boolean;
    lastModifiedAt: Date;
    lastModifiedByUuid: string;
    lastModifiedByName: string;
    lastModifiedByEmail: string;
    assignedToUuid: string;
    assignedToName: string;
    assignedToEmail: string;
    teamName: string;
    teamLeadUuid: string;
    teamLeadName: string;
    teamLeadEmail: string;
    statusName: string;
    priorityName: string;
}
export interface TodoResponse extends Todo {
    assignedToUser?: UserInTodoResponse | null;
    team?: TeamInTodoResponse;
    status?: TodoStatus;
    priority?: TodoPriority;
    createdByUser?: UserInTodoResponse;
}

export interface UserInTodoResponse  {
    uuid: string;
    name: string;
    email: string;
}

export interface TeamInTodoResponse  {
    id: number;
    name: string;
    teamLead: UserInTodoResponse
}

export interface UpdateTodoPayload {
    title?: string;
    assignedToUuid?: string | null;
    teamId?: number;
    statusId?: number;
    priorityId?: number;
    description?: string;
    isActive?: boolean;
    lastModifiedBy: number;
}

export interface UserResponse {
    id: number;
    uuid: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: Date;
    userRoles: string[];
}

export interface CreateTodoPayload {
    title: string;
    assignedToUuid: string | null;
    teamId: number;
    statusId: number;
    priorityId: number;
    createdBy: number;
    description: string;
}

export interface TodoCountByPriorityResponse {
    priority : TodoPriority;
    todoCount : number;
}

export interface TodoCountByStatusResponse {
    status : TodoStatus;
    todoCount : number;
}

export interface TodoByPriorityResponse {
    priority : TodoPriority;
    todos : TodoResponse[];
}

export interface TodoByStatusResponse {
    status : TodoStatus;
    todos : TodoResponse[];
}
