"use client"

import type React from "react"
import { UsersIcon } from "@heroicons/react/24/outline"

const UserManagementButton: React.FC = () => {
  const handleClick = () => {
    window.location.href = "/users"
  }

  return (
    <button onClick={handleClick} className="btn-base btn-primary flex items-center space-x-2" title="User Management">
      <UsersIcon className="icon-small" />
      <span>User Management</span>
    </button>
  )
}

export default UserManagementButton