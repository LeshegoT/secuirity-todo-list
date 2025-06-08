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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Settings, Logout } from "@mui/icons-material";
import TeamSidebar from "../components/TeamSidebar";
import TaskList from "../components/TaskList";
import { apiService } from "../services/apiService";
import { Status, Team, Priority } from "../types";

const currentUser = {
  uuid: "e59c2865-79d9-4f6a-8908-23edf0d03889",
  name: "John Doe",
  email: "john@example.com",
  avatar: undefined,
};

export default function Dashboard() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [teams, setUserTeams] = useState<Team[]>([]);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchPriorities = async () => {
      const response = await apiService.retrievePriorities();
      setPriorities(response.data);
    };

    const fetchUserTeams = async () => {
      const response = await apiService.retrieveUserTeams();
      setUserTeams(response.data);
    };

    const retrieveStatuses = async () => {
      const response = await apiService.retrieveStatuses();
      setStatuses(response.data);
    };

    fetchPriorities();
    fetchUserTeams();
    retrieveStatuses();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
            <Avatar sx={{ width: 32, height: 32 }} src={currentUser.avatar}>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
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
                <Typography variant="subtitle2">{currentUser.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser.email}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Settings fontSize="small" sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem onClick={handleClose}>
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
                currentUser={currentUser}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
              />
            </Grid>
            <Grid>
              <TaskList
                todos={teams.flatMap((el) => el.todos)}
                teams={teams}
                currentUser={currentUser}
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
