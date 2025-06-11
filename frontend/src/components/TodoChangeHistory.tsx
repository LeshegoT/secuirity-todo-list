"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  TextField,
  Button,
  Grid,
  Alert,
} from "@mui/material"
import { History, CalendarToday, Person } from "@mui/icons-material"
import { apiService } from "../services/apiService"
import type { TodoAuditLog } from "../types"

interface TodoChangeHistoryProps {
  todoId: number
}

const TodoChangeHistory: React.FC<TodoChangeHistoryProps> = ({ todoId }) => {
  const [changes, setChanges] = useState<TodoAuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const fetchChanges = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.getTodoChanges(todoId, startDate || undefined, endDate || undefined)
      setChanges(response)
    } catch (err: any) {
      setError(err.message || "Failed to load change history")
      console.error("Error fetching todo changes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChanges()
  }, [todoId])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return dateString
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "success"
      case "UPDATE":
        return "primary"
      case "DELETE":
        return "error"
      default:
        return "default"
    }
  }

  const handleFilter = () => {
    fetchChanges()
  }

  const handleClearFilter = () => {
    setStartDate("")
    setEndDate("")
    setTimeout(() => fetchChanges(), 0)
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <History sx={{ mr: 1 }} />
        <Typography variant="h6">Task Change History</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid>
          <Button variant="contained" onClick={handleFilter} sx={{ mr: 1 }}>
            Filter
          </Button>
          <Button variant="outlined" onClick={handleClearFilter}>
            Clear
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : changes.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
          No change history available
        </Typography>
      ) : (
        <List>
          {changes.map((change, index) => (
            <React.Fragment key={change.auditLogId}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Chip
                        label={change.auditAction.name}
                        size="small"
                        color={getActionColor(change.auditAction.name)}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="subtitle1">{change.todo.title}</Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                          {formatDate(change.auditedTimestamp)}
                        </Typography>
                        <Person fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {change.auditModifiedByUser.name}
                        </Typography>
                      </Box>

                      {change.changesMade && (
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: "background.default",
                            borderRadius: 1,
                            whiteSpace: "pre-line",
                          }}
                        >
                          <Typography variant="body2">{change.changesMade}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < changes.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  )
}

export default TodoChangeHistory
