import {User} from "../../types/types";
import {Team} from "../../models/teams";
import {Todo} from "../../models/todo";
import {TodoStatus} from "../../models/todo-status";
import {TodoPriority} from "../../models/todo-priority";

export interface TodoResponse extends Todo {
    assignedTo?: User | null;
    team?: Team;
    status?: TodoStatus;
    priority?: TodoPriority;
    createdByUser?: User;
}