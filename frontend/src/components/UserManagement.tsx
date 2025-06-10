"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/authContext"
import { apiService } from "../services/apiService"
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material"
import { ArrowBack, Lock, LockOpen, Delete, Security, CheckCircle, Cancel, Groups } from "@mui/icons-material"
import "../App.css"

interface UserManagement {
  id: number
  uuid: string
  email: string
  name: string
  userRoles: string[]
  isActive: boolean
  createdAt: string
  isVerified: boolean
}

interface Role {
  id: number
  name: string
}

interface Team {
  id: number
  name: string
  is_lead: boolean
}

const UserManagement: React.FC = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [users, setUsers] = useState<UserManagement[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [roleOperation, setRoleOperation] = useState<"add" | "remove" | "replace">("replace")
  const [actionLoading, setActionLoading] = useState(false)

  // Role checks
  const isAccessAdmin = user?.userRoles?.includes("access_administrator")
  const isTeamLead = user?.userRoles?.includes("team_lead")
  const isTeamMember = user?.userRoles?.includes("team_member")

  // Determine user's access level
  const getAccessLevel = () => {
    if (isAccessAdmin) return "admin"
    if (isTeamLead) return "team_lead"
    return "team_member"
  }

  const accessLevel = getAccessLevel()

  useEffect(() => {
    loadUsers()
    if (isAccessAdmin) {
      loadRoles()
    }
    loadTeams()
  }, [isAccessAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUsers()
      setUsers(response.data || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load users")
      console.error("Error loading users:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await apiService.getUserRoles()
      setRoles(response.data || [])
    } catch (err: any) {
      console.error("Error loading roles:", err)
    }
  }

  const loadTeams = async () => {
    try {
      // For now, we'll create mock teams since the API might not have this endpoint yet
      // You can replace this with actual API call when available
      setTeams([
        { id: 1, name: "Development Team", is_lead: false },
        { id: 2, name: "Design Team", is_lead: false },
        { id: 3, name: "Marketing Team", is_lead: false },
        { id: 4, name: "Sales Team", is_lead: false },
      ])
    } catch (err: any) {
      console.error("Error loading teams:", err)
    }
  }

  // Check if current user can modify target user
  const canModifyUser = (targetUser: UserManagement) => {
    if (isAccessAdmin) return true
    if (isTeamLead && targetUser.uuid !== user?.uuid) return true
    return false
  }

  // Check if current user can view target user
  const canViewUser = (targetUser: UserManagement) => {
    if (isAccessAdmin) return true
    if (isTeamLead) return true
    if (isTeamMember && targetUser.uuid === user?.uuid) return true
    return false
  }

  const handleToggleUserLock = async (targetUser: UserManagement) => {
    if (!canModifyUser(targetUser)) return

    try {
      setActionLoading(true)
      const newStatus = !targetUser.isActive

      await apiService.toggleUserLock(targetUser.uuid, newStatus)
      setUsers(users.map((u) => (u.uuid === targetUser.uuid ? { ...u, isActive: newStatus } : u)))
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser || !canModifyUser(selectedUser)) return

    try {
      setActionLoading(true)
      await apiService.deleteUser(selectedUser.uuid)
      setUsers(users.filter((u) => u.uuid !== selectedUser.uuid))
      setShowDeleteModal(false)
      setSelectedUser(null)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateRoles = async () => {
    if (!selectedUser || selectedRoles.length === 0 || !isAccessAdmin) return

    try {
      setActionLoading(true)
      await apiService.updateUserRoles(selectedUser.uuid, selectedRoles, roleOperation)
      await loadUsers()
      setShowRoleModal(false)
      setSelectedUser(null)
      setSelectedRoles([])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user roles")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateTeams = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      // TODO: Implement actual team assignment API call
      // await apiService.updateUserTeams(selectedUser.uuid, selectedTeams)

      // For now, just show success message
      console.log(`Assigning user ${selectedUser.name} to teams:`, selectedTeams)

      setShowTeamModal(false)
      setSelectedUser(null)
      setSelectedTeams([])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user teams")
    } finally {
      setActionLoading(false)
    }
  }

  const openRoleModal = (targetUser: UserManagement) => {
    if (!isAccessAdmin) return
    setSelectedUser(targetUser)
    setSelectedRoles(targetUser.userRoles)
    setShowRoleModal(true)
  }

  const openTeamModal = (targetUser: UserManagement) => {
    if (!canModifyUser(targetUser)) return
    setSelectedUser(targetUser)
    setSelectedTeams([]) // TODO: Load user's current teams
    setShowTeamModal(true)
  }

  const openDeleteModal = (targetUser: UserManagement) => {
    if (!canModifyUser(targetUser)) return
    setSelectedUser(targetUser)
    setShowDeleteModal(true)
  }

  const getRoleDisplayName = (roleName: string) => {
    return roleName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "access_administrator":
        return "error"
      case "team_lead":
        return "primary"
      case "team_member":
        return "success"
      default:
        return "default"
    }
  }

  const goBackToDashboard = () => {
    window.location.href = "/dashboard"
  }

  const getPageTitle = () => {
    switch (accessLevel) {
      case "admin":
        return "User Management - All Users"
      case "team_lead":
        return "User Management - My Team"
      default:
        return "User Management - My Profile"
    }
  }

  // Mobile Card Component
  const UserCard = ({ targetUser }: { targetUser: UserManagement }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 2,
              color: "white",
              fontWeight: "bold",
            }}
          >
            {targetUser.name.charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {targetUser.name}
              {targetUser.uuid === user?.uuid && <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {targetUser.email}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Roles:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {targetUser.userRoles.map((role) => (
              <Chip
                key={role}
                label={getRoleDisplayName(role)}
                size="small"
                color={getRoleColor(role)}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="subtitle2">Status:</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {targetUser.isActive ? (
                <>
                  <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="success.main">
                    Active
                  </Typography>
                </>
              ) : (
                <>
                  <Cancel color="error" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="error.main">
                    Locked
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2">Created:</Typography>
            <Typography variant="body2">{new Date(targetUser.createdAt).toLocaleDateString()}</Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: "center", p: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Role Management - Only for access_administrator */}
          {isAccessAdmin && canModifyUser(targetUser) && (
            <Tooltip title="Manage Roles">
              <IconButton size="small" onClick={() => openRoleModal(targetUser)} disabled={actionLoading}>
                <Security />
              </IconButton>
            </Tooltip>
          )}

          {/* Team Assignment - For team leads and admins */}
          {(isAccessAdmin || isTeamLead) && canModifyUser(targetUser) && (
            <Tooltip title="Assign to Team">
              <IconButton size="small" onClick={() => openTeamModal(targetUser)} disabled={actionLoading}>
                <Groups />
              </IconButton>
            </Tooltip>
          )}

          {/* Lock/Unlock */}
          {canModifyUser(targetUser) && (
            <Tooltip title={targetUser.isActive ? "Lock User" : "Unlock User"}>
              <IconButton
                size="small"
                onClick={() => handleToggleUserLock(targetUser)}
                disabled={actionLoading}
                color={targetUser.isActive ? "error" : "success"}
              >
                {targetUser.isActive ? <Lock /> : <LockOpen />}
              </IconButton>
            </Tooltip>
          )}

          {/* Delete */}
          {canModifyUser(targetUser) && (
            <Tooltip title="Delete User">
              <IconButton
                size="small"
                onClick={() => openDeleteModal(targetUser)}
                disabled={actionLoading}
                color="error"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  )

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

      {/* Blue Header Bar - matching dashboard */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={goBackToDashboard} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isMobile ? "User Management" : getPageTitle()}
          </Typography>
          <Chip
            label={getRoleDisplayName(accessLevel === "admin" ? "access_administrator" : accessLevel)}
            color={getRoleColor(accessLevel === "admin" ? "access_administrator" : accessLevel)}
            variant="outlined"
            sx={{ color: "white", borderColor: "white" }}
          />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: isMobile ? 2 : 3, mt: 8 }}>
        <Container maxWidth="xl">
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Header with refresh button */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">
              {accessLevel === "team_member" ? "My Profile" : `Users (${users.filter((u) => canViewUser(u)).length})`}
            </Typography>
            <Button variant="outlined" onClick={loadUsers} disabled={loading}>
              Refresh
            </Button>
          </Box>

          {/* Responsive Content */}
          {isMobile ? (
            // Mobile Card Layout
            <Box>
              {users
                .filter((u) => canViewUser(u))
                .map((targetUser) => (
                  <UserCard key={targetUser.uuid} targetUser={targetUser} />
                ))}
            </Box>
          ) : (
            // Desktop Table Layout
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Roles</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users
                      .filter((u) => canViewUser(u))
                      .map((targetUser) => (
                        <TableRow key={targetUser.uuid} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  mr: 2,
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              >
                                {targetUser.name.charAt(0).toUpperCase()}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {targetUser.name}
                                  {targetUser.uuid === user?.uuid && (
                                    <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {targetUser.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {targetUser.userRoles.map((role) => (
                                <Chip
                                  key={role}
                                  label={getRoleDisplayName(role)}
                                  size="small"
                                  color={getRoleColor(role)}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {targetUser.isActive ? (
                                <>
                                  <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                                  <Typography variant="body2" color="success.main">
                                    Active
                                  </Typography>
                                </>
                              ) : (
                                <>
                                  <Cancel color="error" sx={{ mr: 1, fontSize: 20 }} />
                                  <Typography variant="body2" color="error.main">
                                    Locked
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(targetUser.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                              {/* Role Management - Only for access_administrator */}
                              {isAccessAdmin && canModifyUser(targetUser) && (
                                <Tooltip title="Manage Roles">
                                  <IconButton
                                    size="small"
                                    onClick={() => openRoleModal(targetUser)}
                                    disabled={actionLoading}
                                  >
                                    <Security />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Team Assignment - For team leads and admins */}
                              {(isAccessAdmin || isTeamLead) && canModifyUser(targetUser) && (
                                <Tooltip title="Assign to Team">
                                  <IconButton
                                    size="small"
                                    onClick={() => openTeamModal(targetUser)}
                                    disabled={actionLoading}
                                  >
                                    <Groups />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Lock/Unlock */}
                              {canModifyUser(targetUser) && (
                                <Tooltip title={targetUser.isActive ? "Lock User" : "Unlock User"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleUserLock(targetUser)}
                                    disabled={actionLoading}
                                    color={targetUser.isActive ? "error" : "success"}
                                  >
                                    {targetUser.isActive ? <Lock /> : <LockOpen />}
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Delete */}
                              {canModifyUser(targetUser) && (
                                <Tooltip title="Delete User">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDeleteModal(targetUser)}
                                    disabled={actionLoading}
                                    color="error"
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Container>
      </Box>

      {/* Role Management Modal */}
      <Dialog open={showRoleModal} onClose={() => setShowRoleModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Roles for {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Operation</InputLabel>
            <Select
              value={roleOperation}
              label="Operation"
              onChange={(e) => setRoleOperation(e.target.value as "add" | "remove" | "replace")}
            >
              <MenuItem value="replace">Replace all roles</MenuItem>
              <MenuItem value="add">Add roles</MenuItem>
              <MenuItem value="remove">Remove roles</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Roles:
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: "auto" }}>
            {roles.map((role) => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoles.includes(role.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.name])
                      } else {
                        setSelectedRoles(selectedRoles.filter((r) => r !== role.name))
                      }
                    }}
                  />
                }
                label={getRoleDisplayName(role.name)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRoles}
            variant="contained"
            disabled={actionLoading || selectedRoles.length === 0}
          >
            {actionLoading ? <CircularProgress size={20} /> : "Update Roles"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Assignment Modal */}
      <Dialog open={showTeamModal} onClose={() => setShowTeamModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Teams for {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the teams this user should be assigned to:
          </Typography>

          <Box sx={{ maxHeight: 300, overflow: "auto" }}>
            {teams.map((team) => (
              <FormControlLabel
                key={team.id}
                control={
                  <Checkbox
                    checked={selectedTeams.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeams([...selectedTeams, team.id])
                      } else {
                        setSelectedTeams(selectedTeams.filter((t) => t !== team.id))
                      }
                    }}
                  />
                }
                label={team.name}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTeamModal(false)}>Cancel</Button>
          <Button onClick={handleUpdateTeams} variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : "Assign Teams"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone and will
            remove the user from all teams.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : "Delete User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserManagement
