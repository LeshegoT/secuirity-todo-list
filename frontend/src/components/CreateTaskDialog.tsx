"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
} from "@mui/material";
import type { Team, User, Priority, Status } from "../types";
import { apiService } from "../services/apiService";
import { toast } from "react-toastify";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  currentUser: User;
  priorities: Priority[];
  statuses: Status[];
}

export default function CreateTaskDialog({
  open,
  onClose,
  teams,
  currentUser,
  priorities,
  statuses,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusId, setStatusId] = useState("");

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    try {
      setIsLoading(true);
      setTitleError(null);
      const response = await apiService.createTask(
        title,
        assigneeId,
        Number(teamId),
        Number(statusId),
        Number(priorityId),
        description
      );
      resetForm();
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("An error occurred while creating the task");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTeamId("");
    setPriorityId("");
    setStatusId("");
    setAssigneeId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedTeamMembers = teamId
    ? teams.find((t) => t.id === Number(teamId))?.members || []
    : [];

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Title"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            margin="dense"
            id="description"
            label="Description"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl fullWidth required>
            <InputLabel id="team-label">Team</InputLabel>
            <Select
              labelId="team-label"
              id="team"
              value={teamId}
              label="Team"
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams
                .filter((team) =>
                  team.members.some(
                    (member) => member.uuid === currentUser.uuid
                  )
                )
                .map((team) => (
                  <MenuItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              id="priority"
              value={priorityId}
              label="Priority"
              onChange={(e) => setPriorityId(e.target.value)}
            >
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="priority"
              value={statusId}
              label="Status"
              onChange={(e) => setStatusId(e.target.value)}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.id} value={priority.id.toString()}>
                  {priority.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="assignee-label">Assign To</InputLabel>
            <Select
              labelId="assignee-label"
              id="assignee"
              value={assigneeId}
              label="Assign To"
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <MenuItem value={undefined}>Unassigned</MenuItem>
              {teamId &&
                selectedTeamMembers.map((member) => (
                  <MenuItem key={member.uuid} value={member.uuid.toString()}>
                    {member.name}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText>Optional</FormHelperText>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCreateTask}
          variant="contained"
          disabled={!title || !teamId || !priorityId}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
