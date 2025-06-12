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
import EditTaskDialog from "./EditTaskDialog";
import { apiService } from "../services/apiService";
import { toast } from "react-toastify";
interface TaskListProps {
  todos: Todo[];
  teams: Team[];
  currentUser: User;
  selectedTeam: number | null;
  statuses: Status[];
  priorities: Priority[];
  onTaskUpdate: (task: Todo) => void;
  onTaskDelete: (task: Todo) => void;
}

export default function TaskList({
  todos,
  teams,
  currentUser,
  selectedTeam,
  statuses,
  priorities,
  onTaskUpdate,
}: TaskListProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Todo | null>(null);

  const filteredTodos = selectedTeam
    ? todos.filter((todo) => todo.teamId === selectedTeam)
    : todos.filter((todo) =>
        teams.some(
          (team) =>
            team.members.some((member) => member.uuid === currentUser.uuid) &&
            team.id === todo.teamId
        )
      );

  const handleAssignToSelf = async (todoId: number) => {
    console.log(todoId);
    try {
      await apiService.updateTask(todoId, {
        assignedToUuid: currentUser.uuid,
        lastModifiedBy: currentUser.uuid,
      });
      toast.success("Task assigned successfully");
    } catch (error) {
      toast.error("Failed to assign task");
    }
  };

  const handleUnassignSelf = async (todoId: number) => {
    try {
      await apiService.updateTask(todoId, {
        assignedToUuid: null,
        lastModifiedBy: currentUser.uuid,
      });
      toast.success("Task unassigned successfully");
    } catch (error) {
      toast.error("Failed to unassign task");
    }
  };

  const handleMarkComplete = async (todoId: number) => {
    const status = statuses.find(
      (status) => status.name.toLowerCase() === "completed"
    );
    if (status) {
      try {
        const previouslyAssigned = filteredTodos.filter(
          (todo) => todo.id === todoId
        );
        await apiService.updateTask(todoId, {
          statusId: status.id,
          lastModifiedBy: currentUser.uuid,
          assignedToUuid: previouslyAssigned[0].assignedToId,
        });
        toast.success("Task unassigned successfully");
      } catch (error) {
        toast.error("Failed to unassign task");
      }
    }
  };

  const handleEditTask = (task: Todo): void => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
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
            onEditTask={() => handleEditTask(todo)}
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
      <EditTaskDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setTaskToEdit(null);
        }}
        task={taskToEdit}
        teams={teams}
        allUsers={[]}
        currentUser={currentUser}
        onTaskUpdate={() => onTaskUpdate}
        statuses={statuses}
        priorities={priorities}
      />
    </Box>
  );
}
