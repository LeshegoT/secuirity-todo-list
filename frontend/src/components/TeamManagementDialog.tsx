"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material"
import { PersonRemove, PersonAdd, EmojiEvents } from "@mui/icons-material"
import type { Team, User } from "../types"

interface TeamManagementDialogProps {
  open: boolean
  onClose: () => void
  team: Team
  currentUser: User
}

export default function TeamManagementDialog({ open, onClose, team, currentUser }: TeamManagementDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Add this mock function to simulate user search - replace with actual API call
  const searchUsers = async (query: string) => {
    setIsSearching(true)
    // Simulate API delay
    setTimeout(() => {
      // Mock user database - replace with actual API call
      const allUsers = [
        { id: 5, name: "Alice Cooper", email: "alice@example.com" },
        { id: 6, name: "Bob Smith", email: "bob@example.com" },
        { id: 7, name: "Charlie Brown", email: "charlie@example.com" },
        { id: 8, name: "Diana Prince", email: "diana@example.com" },
        { id: 9, name: "Edward Norton", email: "edward@example.com" },
      ]

      const results = allUsers.filter(
        (user) =>
          (user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())) &&
          !team.members.some((member) => member.id === user.id),
      )

      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  // Add this function to handle adding a user to the team
  const handleAddMember = (user: User) => {
    // Handle adding member to team - replace with actual API call
    console.log(`Adding user ${user.name} to team ${team.name}`)
    setSearchQuery("")
    setSearchResults([])
  }

  // Add this function to handle removing a user from the team
  const handleRemoveMember = (userId: number) => {
    // Handle removing member from team - replace with actual API call
    console.log(`Removing user ${userId} from team ${team.name}`)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Team: {team.name}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          Current Members
        </Typography>
        <List>
          {team.members.map((member) => (
            <ListItem key={member.id}>
              <ListItemAvatar>
                <Avatar src={member.avatar}>{member.name.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {member.name}
                    {member.id === team.teamLeadId && <EmojiEvents fontSize="small" color="warning" sx={{ ml: 1 }} />}
                  </Box>
                }
                secondary={member.email}
              />
              {member.id !== team.teamLeadId && member.id !== currentUser.id && (
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveMember(member.id)}>
                    <PersonRemove />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Add Member
        </Typography>
        <TextField
          fullWidth
          label="Search users by name or email"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (e.target.value.length >= 2) {
              searchUsers(e.target.value)
            } else {
              setSearchResults([])
            }
          }}
          InputProps={{
            endAdornment: isSearching ? <CircularProgress size={20} /> : null,
          }}
        />

        {searchResults.length > 0 && (
          <List sx={{ mt: 2, maxHeight: 240, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
            {searchResults.map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar src={user.avatar}>{user.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.name} secondary={user.email} />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAdd />}
                    onClick={() => handleAddMember(user)}
                  >
                    Add
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            No users found matching "{searchQuery}"
          </Typography>
        )}

        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
            Type at least 2 characters to search
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
