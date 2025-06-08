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
import { Team } from "../types";


const currentUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  avatar: undefined,
};

const todos = [
  {
    id: 1,
    title: "Implement user authentication",
    description: "Add login and registration functionality with 2FA",
    assignedToId: 1,
    teamId: 1,
    statusId: 1,
    priorityId: 1,
    createdAt: "2024-01-15",
    createdBy: 2,
  },
  {
    id: 2,
    title: "Design dashboard UI",
    description: "Create wireframes and mockups for the main dashboard",
    assignedToId: 2,
    teamId: 1,
    statusId: 2,
    priorityId: 2,
    createdAt: "2024-01-14",
    createdBy: 1,
  },
  {
    id: 3,
    title: "Set up database schema",
    description: "Create and migrate database tables",
    assignedToId: null,
    teamId: 2,
    statusId: 1,
    priorityId: 1,
    createdAt: "2024-01-13",
    createdBy: 4,
  },
];

const statuses = [
  { id: 1, name: "To Do" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Done" },
];

type Priority = {
  id: number;
  name: string;
};

export default function Dashboard() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
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

    fetchPriorities();
    fetchUserTeams ();
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
                todos={todos}
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
