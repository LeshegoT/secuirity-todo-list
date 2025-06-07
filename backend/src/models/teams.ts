import { Todo } from "./todo";
import { User } from "./users";
export interface Team {
  id : number;
  name: string;
  todos: Todo[];
  members : User[]
}

export interface NewTeam {
  name: string;
  teamLeadId: number;
  members?: User[]
}
