"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Menu,
  Avatar,
  Divider,
  Alert,
  Button,
} from "@mui/material"
import { ArrowBack, Settings, Logout, Assessment, BarChart, TableChart, History } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"
import { apiService } from "../services/apiService"
import PriorityDistributionChart from "../components/PriorityDistributionChart"
import StatusDistributionChart from "../components/StatusDistributionChart"
import TodosTable from "../components/TodosTable"
import TodoChangeHistory from "../components/TodoChangeHistory"
import type { Team, TodoCountByPriority, TodoCountByStatus, TodosByPriority, TodosByStatus, Todo } from "../types"
import { toast } from "react-toastify";

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, index, value, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reporting-tabpanel-${index}`}
      aria-labelledby={`reporting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const ReportingPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [priorityCounts, setPriorityCounts] = useState<TodoCountByPriority[]>([])
  const [statusCounts, setStatusCounts] = useState<TodoCountByStatus[]>([])
  const [todosByPriority, setTodosByPriority] = useState<TodosByPriority[]>([])
  const [todosByStatus, setTodosByStatus] = useState<TodosByStatus[]>([])
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null)

  const [loadingPriorityCounts, setLoadingPriorityCounts] = useState(false)
  const [loadingStatusCounts, setLoadingStatusCounts] = useState(false)
  const [loadingTodosByPriority, setLoadingTodosByPriority] = useState(false)
  const [loadingTodosByStatus, setLoadingTodosByStatus] = useState(false)

  const open = Boolean(anchorEl)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true)
        const response = await apiService.retrieveUserTeams()
        setTeams(response.data || [])

        if (response.data && response.data.length > 0) {
          setSelectedTeamId(response.data[0].id)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load teams")
        toast("Error fetching teams:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      fetchReportingData(selectedTeamId)
    }
  }, [selectedTeamId])

  const fetchReportingData = async (teamId: number) => {
    setError(null)

    setLoadingPriorityCounts(true)
    try {
      const priorityData = await apiService.getTodoCountsByPriority(teamId)

      if (priorityData instanceof Error)
      {
        toast(priorityData.message);
      } else {
        setPriorityCounts(priorityData)
      }
    } catch (err: any) {
      toast("Error fetching priority counts:", err.message())
    } finally {
      setLoadingPriorityCounts(false)
    }

    setLoadingStatusCounts(true)
    try {
      const statusData = await apiService.getTodoCountsByStatus(teamId);

      if (statusData instanceof Error)
      {
        toast(statusData.message);
      } else {
        setStatusCounts(statusData);
      }

    } catch (err: any) {
      toast("Error fetching status counts:", err.message);
    } finally {
      setLoadingStatusCounts(false);
    }

    setLoadingTodosByPriority(true);
    try {
      const todosPriorityData = await apiService.getTodosByPriority(teamId);
      if (todosPriorityData instanceof Error)
      {
        toast(todosPriorityData.message);
      } else {
        setTodosByPriority(todosPriorityData);

        if (todosPriorityData.length > 0 && todosPriorityData[0].todos.length > 0) {
          setSelectedTodoId(todosPriorityData[0].todos[0].id);
        }
      }
    } catch (err: any) {
      toast("Error fetching todos by priority:", err)
    } finally {
      setLoadingTodosByPriority(false)
    }

    setLoadingTodosByStatus(true)
    try {
      const todosStatusData = await apiService.getTodosByStatus(teamId);

      if (todosStatusData instanceof Error)
      {
        toast(todosStatusData.message);
      } else {
        setTodosByStatus(todosStatusData);
      }
    } catch (err: any) {
      toast("Error fetching todos by status:", err);
    } finally {
      setLoadingTodosByStatus(false);
    }
  }

  const handleTeamChange = (event: any) => {
    setSelectedTeamId(Number(event.target.value))
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleClose()
    logout()
    navigate("/login")
  }

  const handleTodoSelect = (todoId: number) => {
    setSelectedTodoId(todoId)
    setTabValue(3)
  }

  const allTodos: Todo[] = [
    ...todosByPriority.flatMap((group) => group.todos),
    ...todosByStatus.flatMap((group) => group.todos),
  ]

  const uniqueTodos = Array.from(new Map(allTodos.map((todo) => [todo.id, todo])).values())

  if (loading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Reporting Dashboard
          </Typography>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar sx={{ width: 32, height: 32 }} src={user?.avatar}>
              {(user?.name || "")
                .split(" ")
                .map((n) => n[0])
                .join("") || "?"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem disabled>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => navigate("/dashboard")}>
              <ArrowBack fontSize="small" sx={{ mr: 1 }} /> Back to Dashboard
            </MenuItem>
            <MenuItem onClick={() => navigate("/users")}>
              <Settings fontSize="small" sx={{ mr: 1 }} /> User Management
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid>
                <FormControl fullWidth>
                  <InputLabel id="team-select-label">Select Team</InputLabel>
                  <Select
                    labelId="team-select-label"
                    id="team-select"
                    value={selectedTeamId || ""}
                    label="Select Team"
                    onChange={handleTeamChange}
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid>
                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => fetchReportingData(selectedTeamId!)}
                    disabled={!selectedTeamId}
                  >
                    Refresh Reports
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="reporting tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<BarChart />} label="Charts" />
              <Tab icon={<TableChart />} label="By Priority" />
              <Tab icon={<TableChart />} label="By Status" />
              <Tab icon={<History />} label="History" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container>
              {/*<Grid>*/}
              {/*  <PriorityDistributionChart data={priorityCounts} loading={loadingPriorityCounts} />*/}
              {/*</Grid>*/}
              <Grid>
                <StatusDistributionChart data={statusCounts} loading={loadingStatusCounts} />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {todosByPriority.map((group) => (
              <TodosTable
                key={group.priority.id}
                title={`${group.priority.name} Priority Tasks`}
                todos={group.todos}
                loading={loadingTodosByPriority}
                groupBy="priority"
                groupName={group.priority.name}
              />
            ))}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {todosByStatus.map((group) => (
              <TodosTable
                key={group.status.id}
                title={`${group.status.name} Status Tasks`}
                todos={group.todos}
                loading={loadingTodosByStatus}
                groupBy="status"
                groupName={group.status.name}
              />
            ))}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container>
              <Grid>
                <Paper sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Select Task
                  </Typography>
                  {uniqueTodos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No tasks available
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                      {uniqueTodos.map((todo) => (
                        <Box
                          key={todo.id}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1,
                            cursor: "pointer",
                            bgcolor: selectedTodoId === todo.id ? "primary.light" : "background.default",
                            "&:hover": { bgcolor: selectedTodoId === todo.id ? "primary.light" : "action.hover" },
                          }}
                          onClick={() => handleTodoSelect(todo.id)}
                        >
                          <Typography variant="body2" fontWeight={selectedTodoId === todo.id ? "bold" : "normal"}>
                            {todo.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid>
                {selectedTodoId && uniqueTodos.length > 0 ? (
                  <TodoChangeHistory todoId={selectedTodoId} />
                ) : (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
                      Select a task to view its change history
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </TabPanel>
        </Container>
      </Box>
    </Box>
  )
}

export default ReportingPage
