import type React from "react"
import { Box, Paper, Typography } from "@mui/material"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { TodoCountByStatus } from "../types"

interface StatusDistributionChartProps {
  data: TodoCountByStatus[]
  loading: boolean
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data, loading }) => {
  const chartData = data.map((item) => ({
    name: item.status.name,
    count: item.todoCount,
    id: item.status.id,
  }))

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "#9e9e9e"
      case 2:
        return "#2196f3"
      case 3:
        return "#4caf50"
      default:
        return "#9c27b0"
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
          No status data available
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Tasks by Status
      </Typography>
      <Box sx={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} tasks`, "Count"]} />
            <Legend />
            {chartData.map((entry, index) => (
              <Bar key={entry.id} dataKey="count" name={entry.name} fill={getStatusColor(entry.id)} barSize={40} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export default StatusDistributionChart
