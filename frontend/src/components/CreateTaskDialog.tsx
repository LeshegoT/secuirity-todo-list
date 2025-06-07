"use client"

import { useState } from "react"
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
} from "@mui/material"
import type { Team, User, Priority } from "../types"

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  teams: Team[]
  currentUser: User
  priorities: Priority[]
}

export default function CreateTaskDialog({ open, onClose, teams, currentUser, priorities }: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [teamId, setTeamId] = useState("")
  const [priorityId, setPriorityId] = useState("")
  const [assigneeId, setAssigneeId] = useState("")

  const handleCreateTask = () => {
    // Implement API call to create task
    console.log({
      title,
      description,
      teamId: Number(teamId),
      priorityId: Number(priorityId),
      assigneeId: assigneeId === "unassigned" ? null : Number(assigneeId),
      createdBy: currentUser.id,
    })

    // Reset form and close dialog
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setTeamId("")
    setPriorityId("")
    setAssigneeId("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const selectedTeamMembers = teamId ? teams.find((t) => t.id === Number(teamId))?.members || [] : []

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
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
                .filter((team) => team.members.some((member) => member.id === currentUser.id))
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
              <MenuItem value="unassigned">Unassigned</MenuItem>
              {teamId &&
                selectedTeamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id.toString()}>
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
        <Button onClick={handleCreateTask} variant="contained" disabled={!title || !teamId || !priorityId}>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  )
}
