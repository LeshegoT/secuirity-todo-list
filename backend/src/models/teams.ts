import { Todo } from "./todo";
import { User } from "./users";
export interface Team {
  id : number;
  name: string;
  todos: Todo[];
}

export interface NewTeam {
  name: string;
  teamLeadId: number;
  members?: User[]
}
