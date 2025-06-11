"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Container,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Settings, Logout, People } from "@mui/icons-material";
import TeamSidebar from "../components/TeamSidebar";
import TaskList from "../components/TaskList";
import { apiService } from "../services/apiService";
import type { Status, Team, Priority, User } from "../types";
import { useAuth } from "../context/authContext";

export default function Dashboard() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [teams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, logout, loading: authLoading } = useAuth();
  const open = Boolean(anchorEl);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [prioritiesRes, teamsRes, statusesRes] = await Promise.all([
          apiService.retrievePriorities(),
          apiService.retrieveUserTeams(),
          apiService.retrieveStatuses(),
        ]);
        setPriorities(prioritiesRes.data);
        setUserTeams(teamsRes.data);
        setStatuses(statusesRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const refetchTeams = async () => {
    try {
      const teamsRes = await apiService.retrieveUserTeams()
      setUserTeams(teamsRes.data)
    } catch (error) {
      console.error("Error refetching teams", error)
    }
  }


  if (loading || authLoading || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Teams Todo
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
              {(user?.name || "") // Accessing user.name here
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
                <Typography variant="subtitle2">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email} 
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                window.location.href = "/users";
              }}
            >
              <People fontSize="small" sx={{ mr: 1 }} /> User Management
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Settings fontSize="small" sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                logout();
                window.location.href = "/login";
              }}
            >
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid>
              <TeamSidebar
                teams={teams}
                currentUser={user}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                refetchTeams={refetchTeams}
              />
            </Grid>
            <Grid>
              <TaskList
                todos={teams.flatMap((el) => el.todos)}
                teams={teams}
                currentUser={user}
                selectedTeam={selectedTeam}
                statuses={statuses}
                priorities={priorities}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}