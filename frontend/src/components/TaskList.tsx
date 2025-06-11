"use client";

import { useState } from "react";
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import { Add, RadioButtonUnchecked } from "@mui/icons-material";
import TaskCard from "./TaskCard";
import CreateTaskDialog from "./CreateTaskDialog";
import type { Todo, Team, User, Status, Priority } from "../types";
interface TaskListProps {
  todos: Todo[];
  teams: Team[];
  currentUser: User;
  selectedTeam: number | null;
  statuses: Status[];
  priorities: Priority[];
}

export default function TaskList({
  todos,
  teams,
  currentUser,
  selectedTeam,
  statuses,
  priorities,
}: TaskListProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const filteredTodos = selectedTeam
    ? todos.filter((todo) => todo.teamId === selectedTeam)
    : todos.filter((todo) =>
        teams.some(
          (team) =>
            team.members.some((member) => member.uuid === currentUser.uuid) &&
            team.id === todo.teamId
        )
      );

  const handleAssignToSelf = (todoId: number) => {
    console.log(`Assigning task ${todoId} to self`);
    // Implement API call to assign task
  };

  const handleUnassignSelf = (todoId: number) => {
    console.log(`Unassigning self from task ${todoId}`);
    // Implement API call to unassign task
  };

  const handleMarkComplete = (todoId: number) => {
    console.log(`Marking task ${todoId} as complete`);
    // Implement API call to mark task complete
  };

  const handleDeleteTask = (todoId: number) => {
    console.log(`Deleting task ${todoId}`);
    // Implement API call to delete task
  };

  const handleAssignToUser = (todoId: number, uuid: string) => {
    console.log(`Assigning task ${todoId} to user ${uuid}`);
    // Implement API call to assign task to user
  };

  const handleEditTask = (todoId: number) => {
    console.log(`Editing task ${todoId}`);
    // Implement API call to edit task or open edit dialog
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          {selectedTeam
            ? teams.find((t) => t.id === selectedTeam)?.name + " Tasks"
            : "All My Tasks"}
        </Typography>
        <Button variant="contained" onClick={() => setIsCreateTaskOpen(true)}>
          <Add />
        </Button>
      </Box>

      <Stack spacing={2}>
        {filteredTodos.map((todo) => (
          <TaskCard
            key={todo.id}
            todo={todo}
            teams={teams}
            currentUser={currentUser}
            statuses={statuses}
            priorities={priorities}
            onAssignToSelf={handleAssignToSelf}
            onUnassignSelf={handleUnassignSelf}
            onMarkComplete={handleMarkComplete}
            onDeleteTask={handleDeleteTask}
            onAssignToUser={handleAssignToUser}
            onEditTask={handleEditTask}
          />
        ))}

        {filteredTodos.length === 0 && (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <RadioButtonUnchecked
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No tasks found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTeam
                  ? "This team doesn't have any tasks yet."
                  : "You don't have any tasks assigned yet."}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        teams={teams}
        currentUser={currentUser}
        priorities={priorities}
        statuses={statuses}
      />
    </Box>
  );
}
