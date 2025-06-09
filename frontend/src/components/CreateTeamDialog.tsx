"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
} from "@mui/material"
import { Search, Person } from "@mui/icons-material"
import { User } from "../types"
import { apiService } from "../services/apiService"


interface CreateTeamDialogProps {
  open: boolean
  onClose: () => void
  onCreateTeam: (teamName: string, selectedUsers: User[]) => Promise<void>
  currentUser: User
}

export default function CreateTeamDialog({
  open,
  onClose,
  onCreateTeam,
  currentUser,
}: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [teamNameError, setTeamNameError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


 
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (searchQuery.length >= 2) {
      setIsLoading(true)
      setError(null)

      timeoutId = setTimeout(async () => {
        try {
          const response = await apiService.getUIserSearchResults(searchQuery)
          if (response.status === "success") {
            setSearchResults(response.data)
          } else {
            setError("Failed to fetch users")
            setSearchResults([])
          }
        } catch (error) {
          setError("An error occurred while searching")
          setSearchResults([])
        } finally {
          setIsLoading(false)
        }
      }, 300) 
    } else {
      setSearchResults([])
      setError(null)
    }

    return () => clearTimeout(timeoutId) 
  }, [searchQuery])

  const handleClose = () => {
    setTeamName("")
    setSearchQuery("")
    setSelectedUsers([])
    setSearchResults([])
    setError(null)
    onClose()
  }

 const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setTeamNameError("Team name is required")
      return
    }

    try {
      setIsLoading(true)
      setTeamNameError(null)
      const teamData = {
        name: teamName.trim(),
        members: selectedUsers,
      }
      const response = await apiService.createTeam(teamData)
      if (response.status === "success") {
        await onCreateTeam(teamName.trim(), selectedUsers) // Await async callback
        handleClose()
      } else {
        setTeamNameError("Failed to create team")
      }
    } catch (error) {
      setTeamNameError(error instanceof Error ? error.message : "An error occurred while creating the team")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = (user: User) => {
      setSelectedUsers([...selectedUsers, user])
      setSearchQuery("")
  }

  const handleRemoveUser = (uuid: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.uuid !== uuid))
  }

  // Filter out current user and already selected users from search results
  const filteredUsers = searchResults.filter(
    (user) =>
      user.uuid !== currentUser.uuid &&
      !selectedUsers.find((u) => u.uuid === user.uuid)
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Team Name"
          fullWidth
          variant="outlined"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" gutterBottom>
          Add Team Members
        </Typography>

        <TextField
          margin="dense"
          label="Search Users"
          fullWidth
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type at least 2 characters to search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {searchQuery.length >= 2 && isLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center", py: 2 }}>
            Loading...
          </Typography>
        )}

        {searchQuery.length >= 2 && !isLoading && error && (
          <Typography variant="body2" color="error" sx={{ mb: 2, textAlign: "center", py: 2 }}>
            {error}
          </Typography>
        )}

        {searchQuery.length >= 2 && !isLoading && !error && filteredUsers.length > 0 && (
          <Box sx={{ mb: 2, maxHeight: 200, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
            <List dense>
              {filteredUsers.map((user) => (
                <ListItem key={user.uuid} disablePadding>
                  <ListItemButton onClick={() => handleAddUser(user)}>
                    <Avatar src={user.avatar} sx={{ width: 32, height: 32, mr: 2 }}>
                      <Person />
                    </Avatar>
                    <ListItemText primary={user.name} secondary={user.email} />
                    <Button size="small" variant="outlined">
                      Add
                    </Button>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {searchQuery.length >= 2 && !isLoading && !error && filteredUsers.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center", py: 2 }}>
            No users found matching "{searchQuery}"
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Team Members
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip
            avatar={<Avatar src={currentUser.avatar}>{currentUser.name[0]}</Avatar>}
            label={`${currentUser.name} (Team Lead)`}
            color="primary"
            sx={{ mr: 1, mb: 1 }}
          />
          {selectedUsers.map((user) => (
            <Chip
              key={user.uuid}
              avatar={<Avatar src={user.avatar}>{user.name[0]}</Avatar>}
              label={user.name}
              onDelete={() => handleRemoveUser(user.uuid)}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>

        {selectedUsers.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Search and add users to your team. You will be the team lead.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreateTeam} variant="contained" disabled={!teamName.trim()}>
          Create Team
        </Button>
      </DialogActions>
    </Dialog>
  )
}