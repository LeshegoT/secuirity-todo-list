"use client"

import type React from "react"

import { useState } from "react"
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Avatar,
} from "@mui/material"
import { CheckCircle, CalendarToday, Flag, MoreVert, PersonAdd,PersonRemove, Edit } from "@mui/icons-material"
import type { Todo, Team, User, Status, Priority } from "../types"

interface TaskCardProps {
  todo: Todo
  teams: Team[]
  currentUser: User
  statuses: Status[]
  priorities: Priority[]
  onAssignToSelf: (todoId: number) => void
  onUnassignSelf: (todoId: number) => void
  onMarkComplete: (todoId: number) => void
  onEditTask ?: () => void
}

export default function TaskCard({
  todo,
  teams,
  currentUser,
  statuses,
  priorities,
  onAssignToSelf,
  onUnassignSelf,
  onMarkComplete,
  onEditTask,
}: TaskCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)


  const team = teams.find((t) => t.id === todo.teamId)
  const isTeamLead = team?.teamLeadUuid === currentUser.uuid
  const isAssignedToMe = todo.assignedToId === currentUser.uuid
  const status = statuses.find((s) => s.id === todo.statusId)
  const priority = priorities.find((p) => p.id === todo.priorityId)

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "default"
      case 2:
        return "primary"
      case 3:
        return "success"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priorityId: number) => {
    switch (priorityId) {
      case 1:
        return "error"
      case 2:
        return "warning"
      case 3:
        return "success"
      default:
        return "default"
    }
  }

  const getUserName = (uuid: string | null) => {
    if (!uuid) return "Unassigned"
    const allUsers = teams.flatMap((team) => team.members)
    const user = allUsers.find((u) => u.uuid === uuid)
    return user?.name || "Unknown User"
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h6" component="h3">
                {todo.title}
              </Typography>
              <Chip
                icon={<Flag fontSize="small" />}
                label={priority?.name}
                size="small"
                color={getPriorityColor(todo.priorityId) as any}
                variant="outlined"
              />
              <Chip label={status?.name} size="small" color={getStatusColor(todo.statusId) as any} />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {todo.description}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary", fontSize: "0.875rem" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarToday fontSize="small" />
                <Typography variant="body2">{todo.createdAt}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2">Assigned to:</Typography>
                {todo.assignedToId ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 0.5 }} alt={getUserName(todo.assignedToId)}>
                      {getUserName(todo.assignedToId).charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {getUserName(todo.assignedToId)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" fontWeight="medium">
                    Unassigned
                  </Typography>
                )}
              </Box>

              <Typography variant="body2">
                Team:{" "}
                <Box component="span" fontWeight="medium">
                  {team?.name}
                </Box>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", ml: 2 }}>
    
            {isTeamLead && (
              <>
                <IconButton size="small"onClick={onEditTask}>
                  <Edit fontSize="small" />
                </IconButton>
              </>
            )}

    
            {!isAssignedToMe && todo.assignedToId === null && (
              <Button variant="outlined" size="small" startIcon={<PersonAdd />} onClick={() => onAssignToSelf(todo.id)}>
                Assign to Me
              </Button>
            )}

            {isAssignedToMe && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonRemove />}
                onClick={() => onUnassignSelf(todo.id)}
              >
                Unassign
              </Button>
            )}

            {isAssignedToMe && todo.statusId !== 3 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => onMarkComplete(todo.id)}
              >
                Complete
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
