"use client"

import { useState } from "react"
import { Paper, Typography, List, ListItem, ListItemButton, ListItemText, IconButton, Box } from "@mui/material"
import { Group, Settings, EmojiEvents, Add } from "@mui/icons-material"
import TeamManagementDialog from "./TeamManagementDialog"
import type { Team, User } from "../types"
import CreateTeamDialog from "./CreateTeamDialog"

interface TeamSidebarProps {
  teams: Team[]
  currentUser: User
  selectedTeam: number | null
  onSelectTeam: (teamId: number | null) => void
  refetchTeams: () => Promise<void>
}

export default function TeamSidebar({ teams, currentUser, selectedTeam, onSelectTeam , refetchTeams}: TeamSidebarProps) {
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)
  const [teamToManage, setTeamToManage] = useState<Team | null>(null)
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)

  const isTeamLead = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId)
    return team?.teamLeadUuid === currentUser.uuid
  }

  const handleOpenManageTeam = (team: Team) => {
    setTeamToManage(team)
    setIsManageTeamOpen(true)
  }

   const handleOpenCreateTeam = () => {
    setIsCreateTeamOpen(true)
  }

const handleCreateTeam = async (teamName: string, selectedUsers: User[]) => {
    await refetchTeams()
    setIsCreateTeamOpen(false)
  }
  return (
    <Paper elevation={1} sx={{ height: "100%" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Group fontSize="small" /> My Teams
        </Typography>
         <IconButton aria-label="create team" onClick={handleOpenCreateTeam}>
          <Add fontSize="small" />
        </IconButton>
      </Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton selected={selectedTeam === null} onClick={() => onSelectTeam(null)}>
            <ListItemText primary="All Tasks" />
          </ListItemButton>
        </ListItem>
        {teams
          .map((team) => (
            <ListItem
              key={team.id}
              disablePadding
              secondaryAction={
                isTeamLead(team.id) ? (
                  <IconButton edge="end" aria-label="manage" onClick={() => handleOpenManageTeam(team)}>
                    <Settings fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <ListItemButton selected={selectedTeam === team.id} onClick={() => onSelectTeam(team.id)}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {team.name}
                      {isTeamLead(team.id) && <EmojiEvents fontSize="small" color="warning" sx={{ ml: 1 }} />}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {teamToManage && (
        <TeamManagementDialog
          open={isManageTeamOpen}
          onClose={() => setIsManageTeamOpen(false)}
          team={teamToManage}
          currentUser={currentUser}
        />
      )}

       <CreateTeamDialog open={isCreateTeamOpen} onClose={() => setIsCreateTeamOpen(false)} currentUser={currentUser} onCreateTeam={handleCreateTeam} />
    </Paper>
  )
}
