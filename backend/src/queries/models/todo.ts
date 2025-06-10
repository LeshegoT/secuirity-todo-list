import {Todo} from "../../models/todo";
import {TodoStatus} from "../../models/todo-status";
import {TodoPriority} from "../../models/todo-priority";

export interface RawTodo {
    id: number;
    title: string;
    assignedToId: number;
    teamId: number;
    statusId: number;
    priorityId: number;
    createdAt: Date;
    createdBy: number;
    description: string;
    isActive: boolean;
    lastModifiedAt: Date;
    lastModifiedBy: number;
    assignedToName: string;
    assignedToEmail: string;
    teamName: string;
    statusName: string;
    priorityName: string;
    createdByName: string;
    createdByEmail: string;
}
export interface TodoResponse extends Todo {
    assignedToUser?: UserInTodoResponse | null;
    team?: TeamInTodoResponse;
    status?: TodoStatus;
    priority?: TodoPriority;
    createdByUser?: UserInTodoResponse;
}

export interface UserInTodoResponse  {
    id: number;
    name: string;
    email: string;
}

export interface TeamInTodoResponse  {
    id: number;
    name: string;
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