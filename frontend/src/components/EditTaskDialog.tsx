"use client"

import { useState, useEffect } from "react"
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
  Autocomplete,
  Box,
  Typography,
  Chip,
  Avatar,
} from "@mui/material"
import type { Todo, User, Team, Status, Priority } from "../types"
import { apiService } from "../services/apiService"

interface UpdateTodoPayload {
  title?: string
  description?: string
  assignedToUuid?: string | null
  statusId?: number
  priorityId?: number
  isActive?: boolean
  lastModifiedBy: string
}

interface EditTaskDialogProps {
  open: boolean
  onClose: () => void
  task: Todo | null
  teams: Team[]
  allUsers: User[]
  currentUser: User
  onTaskUpdate: (taskId: number, payload: UpdateTodoPayload) => void
  statuses: Status[]
  priorities: Priority[]
}

export default function EditTaskDialog({
  open,
  onClose,
  task,
  teams,
  allUsers,
  currentUser,
  onTaskUpdate,
  statuses,
  priorities,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [status, setStatus] = useState<number>(0)
  const [priority, setPriority] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)

  const [originalValues, setOriginalValues] = useState<{
    title: string
    description: string
    teamId: number | null
    assignedToId: string | null
    statusId: number
    priorityId: number
    isActive: boolean
  } | null>(null)

  useEffect(() => {
    if (task && open) {
      setTitle(task.title)
      setDescription(task.description || "")
      setSelectedTeam(task.teamId)

      const assignedUser = task.assignedToId ? allUsers.find((user) => user.uuid === task.assignedToId) || null : null
      setSelectedUser(assignedUser)

      setStatus(task.statusId)
      setPriority(task.priorityId)
      setIsActive(true) 

      setOriginalValues({
        title: task.title,
        description: task.description || "",
        teamId: task.teamId,
        assignedToId: task.assignedToId,
        statusId: task.statusId,
        priorityId: task.priorityId,
        isActive: true,
      })
    }
  }, [task, open, allUsers])

  const handleClose = () => {
    onClose()
    setTitle("")
    setDescription("")
    setSelectedTeam(null)
    setSelectedUser(null)
    setStatus(0)
    setPriority(0)
    setIsActive(true)
    setOriginalValues(null)
  }

  const handleSave = async () => {
    if (!task || !originalValues) return

    const payload: UpdateTodoPayload = {
      lastModifiedBy: currentUser.uuid,
    }

    if (title !== originalValues.title) {
      payload.title = title
    }

    if (description !== originalValues.description) {
      payload.description = description
    }

    if (selectedUser?.uuid !== originalValues.assignedToId) {
      payload.assignedToUuid = selectedUser?.email || undefined
    }

    if (status !== originalValues.statusId) {
      payload.statusId = status
    }

    if (priority !== originalValues.priorityId) {
      payload.priorityId = priority
    }

    if (isActive !== originalValues.isActive) {
      payload.isActive = isActive
    }

    const hasChanges = Object.keys(payload).length > 1 
    if (hasChanges) {
       try {
          await apiService.updateTask(task.id,{...payload,assignedToUuid: payload.assignedToUuid || task.assignedToId})
          onTaskUpdate(task.id, payload)
            } catch (error) {
            } finally {
            }
      onTaskUpdate(task.id, payload)

    }

    handleClose()
  }

  const getAvailableUsers = () => {
    if (!selectedTeam) return allUsers
    const team = teams.find((t) => t.id === selectedTeam)
    return team ? team.members : allUsers
  }

  if (!task) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <Autocomplete
            options={getAvailableUsers()}
            getOptionLabel={(option) => option.name}
            value={selectedUser || originalValues?.assignedToId ? allUsers.find((user) => user.uuid === originalValues?.assignedToId) || null : null}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => <TextField {...params} label="Assign To" placeholder="Select a user" />}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar src={option.avatar} sx={{ width: 24, height: 24 }}>
                  {option.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value as number)} label="Status">
                {statuses.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as number)} label="Priority">
                {priorities.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {}
          {originalValues && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Changes to be saved:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {title !== originalValues.title && <Chip label="Title" size="small" color="primary" />}
                {description !== originalValues.description && (
                  <Chip label="Description" size="small" color="primary" />
                )}
                {selectedTeam !== originalValues.teamId && <Chip label="Team" size="small" color="primary" />}
                {selectedUser?.uuid !== originalValues.assignedToId && (
                  <Chip label="Assigned To" size="small" color="primary" />
                )}
                {status !== originalValues.statusId && <Chip label="Status" size="small" color="primary" />}
                {priority !== originalValues.priorityId && <Chip label="Priority" size="small" color="primary" />}
                {Object.keys({
                  title: title !== originalValues.title,
                  description: description !== originalValues.description,
                  team: selectedTeam !== originalValues.teamId,
                  assignedTo: selectedUser?.uuid !== originalValues.assignedToId,
                  status: status !== originalValues.statusId,
                  priority: priority !== originalValues.priorityId,
                }).filter(
                  (key) =>
                    Object.values({
                      title: title !== originalValues.title,
                      description: description !== originalValues.description,
                      team: selectedTeam !== originalValues.teamId,
                      assignedTo: selectedUser?.uuid !== originalValues.assignedToId,
                      status: status !== originalValues.statusId,
                      priority: priority !== originalValues.priorityId,
                    })[
                      Object.keys({
                        title: title !== originalValues.title,
                        description: description !== originalValues.description,
                        team: selectedTeam !== originalValues.teamId,
                        assignedTo: selectedUser?.uuid !== originalValues.assignedToId,
                        status: status !== originalValues.statusId,
                        priority: priority !== originalValues.priorityId,
                      }).indexOf(key)
                    ],
                ).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No changes detected
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!title.trim()}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
