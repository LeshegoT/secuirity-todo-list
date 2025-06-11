import type React from "react"
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Avatar,
  Tooltip,
  CircularProgress,
} from "@mui/material"
import { CalendarToday, Person } from "@mui/icons-material"
import type { Todo } from "../types"

interface TodosTableProps {
  title: string
  todos: Todo[]
  loading: boolean
  groupBy?: "priority" | "status"
  groupName?: string
}

const TodosTable: React.FC<TodosTableProps> = ({ title, todos, loading, groupBy, groupName }) => {
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  if (todos.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
          No tasks available
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
        {groupBy && groupName && (
          <Chip
            label={groupName}
            size="small"
            color={groupBy === "priority" ? getPriorityColor(todos[0].priorityId) : getStatusColor(todos[0].statusId)}
            sx={{ ml: 1 }}
          />
        )}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              {!groupBy || groupBy === "status" ? <TableCell>Priority</TableCell> : null}
              {!groupBy || groupBy === "priority" ? <TableCell>Status</TableCell> : null}
              <TableCell>Assigned To</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {todos.map((todo) => (
              <TableRow key={todo.id} hover>
                <TableCell>
                  <Tooltip title={todo.description || "No description"}>
                    <Typography variant="body2">{todo.title}</Typography>
                  </Tooltip>
                </TableCell>

                {(!groupBy || groupBy === "status") && (
                  <TableCell>
                    <Chip
                      label={todo.priorityId === 1 ? "High" : todo.priorityId === 2 ? "Medium" : "Low"}
                      size="small"
                      color={getPriorityColor(todo.priorityId)}
                      variant="outlined"
                    />
                  </TableCell>
                )}

                {(!groupBy || groupBy === "priority") && (
                  <TableCell>
                    <Chip
                      label={todo.statusId === 1 ? "To Do" : todo.statusId === 2 ? "In Progress" : "Done"}
                      size="small"
                      color={getStatusColor(todo.statusId)}
                    />
                  </TableCell>
                )}

                <TableCell>
                  {todo.assignedToId ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Typography variant="body2">Assigned</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CalendarToday fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                    <Typography variant="body2">{formatDate(todo.createdAt)}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default TodosTable
