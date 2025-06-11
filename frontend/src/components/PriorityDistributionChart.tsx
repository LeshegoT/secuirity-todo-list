import type React from "react"
import { Box, Paper, Typography } from "@mui/material"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { TodoCountByPriority } from "../types"

interface PriorityDistributionChartProps {
  data: TodoCountByPriority[]
  loading: boolean
}

const COLORS = ["#f44336", "#ff9800", "#4caf50", "#2196f3", "#9c27b0"]

const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({ data, loading }) => {
  const chartData = data.map((item) => ({
    name: item.priority.name,
    value: item.todoCount,
    id: item.priority.id,
  }))

  const getPriorityColor = (priorityId: number) => {
    switch (priorityId) {
      case 1:
        return "#f44336"
      case 2:
        return "#ff9800"
      case 3:
        return "#4caf50"
      default:
        return COLORS[priorityId % COLORS.length]
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Loading chart data...
        </Typography>
      </Paper>
    )
  }

  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No priority data available
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Tasks by Priority
      </Typography>
      <Box sx={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPriorityColor(entry.id)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} tasks`, "Count"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export default PriorityDistributionChart
