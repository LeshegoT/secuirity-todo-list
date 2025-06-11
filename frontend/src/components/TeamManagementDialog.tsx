"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { PersonRemove, PersonAdd, EmojiEvents } from "@mui/icons-material";
import type { Team, User } from "../types";
import { apiService } from "../services/apiService";
import { toast } from "react-toastify";

interface TeamManagementDialogProps {
  open: boolean;
  onClose: () => void;
  team: Team;
  currentUser: User;
}

export default function TeamManagementDialog({
  open,
  onClose,
  team,
  currentUser,
}: TeamManagementDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      setError(null);

      timeoutId = setTimeout(async () => {
        try {
          const response = await apiService.getUIserSearchResults(searchQuery);
          if (response.status === "success") {
            const filteredResults = response.data.filter(
              (user: { uuid: string; name: string }) =>
                !team.members.some((member) => member.uuid === user.uuid)
            );
            setSearchResults(filteredResults);
          } else {
            setError("Failed to fetch users");
            setSearchResults([]);
          }
        } catch (error) {
          setError("An error occurred while searching");
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setError(null);
      setIsSearching(false);
    }

    return () => clearTimeout(timeoutId);
  }, [searchQuery, team.members]);

  const handleAddMember = async (user: User) => {
    try {
      await apiService.updateTeam(team.id, [user.uuid], []);
      toast.success(`User ${user.name} added to team ${team.name}`);
    } catch (error) {
      toast.error(`Failed to add user to team`);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = async (uuid: string) => {
    try {
      await apiService.updateTeam(team.id, [], [uuid]);
      toast.success(`User removed from team ${team.name}`);
    } catch (error) {
      toast.error(`Failed to remove user from team`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Team: {team.name}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          Current Members
        </Typography>
        <List>
          {team.members.map((member) => (
            <ListItem key={member.uuid}>
              <ListItemAvatar>
                <Avatar src={member.avatar}>{member.name.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {member.name}
                    {member.uuid === team.teamLeadUuid && (
                      <EmojiEvents
                        fontSize="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                secondary={member.email}
              />
              {member.uuid !== team.teamLeadUuid &&
                member.uuid !== currentUser.uuid && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMember(member.uuid)}
                    >
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
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            endAdornment: isSearching ? <CircularProgress size={20} /> : null,
          }}
        />

        {searchQuery.length >= 2 && isSearching && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Searching...
          </Typography>
        )}

        {searchQuery.length >= 2 && !isSearching && error && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: "center" }}
          >
            {error}
          </Typography>
        )}

        {searchQuery.length >= 2 &&
          !isSearching &&
          !error &&
          searchResults.length > 0 && (
            <List
              sx={{
                mt: 2,
                maxHeight: 240,
                overflow: "auto",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              {searchResults.map((user) => (
                <ListItem key={user.uuid}>
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

        {searchQuery.length >= 2 &&
          !isSearching &&
          !error &&
          searchResults.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, textAlign: "center" }}
            >
              No users found matching "{searchQuery}"
            </Typography>
          )}

        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block", textAlign: "center" }}
          >
            Type at least 2 characters to search
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
