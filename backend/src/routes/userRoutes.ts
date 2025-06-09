import { Router, type Response } from "express";
import {
  getAllActiveUsers,
  getUserByUUID,
  toggleUserLock,
  softDeleteUser,
  verifyUserExists,
  getAllRoles,
  getUserTeams,
  getUsersInTeamLedBy,
  canUserModifyTarget,
  modifyUserRoles,
} from "../queries/users.js";
import {
  validateUUID,
  requireUUIDAuth,
} from "../middlewares/uuidValidation.js";
import {
  checkUserRoles,
  requireAdmin,
  requireTeamLeadOrAdmin,
  requireAnyRole,
  type RoleRequest,
} from "../middlewares/rolePermissions.js";

export const createUserRoutes = (): Router => {
  const router = Router();

  // GET /roles - Get all available roles (admin / team lead only)
  router.get(
    "/roles",
    requireUUIDAuth,
    checkUserRoles,
    async (req: RoleRequest, res: Response) => {
      try {
        if (!req.isAdmin && !req.isTeamLead) {
          return res.status(403).json({
            error: "Admin or Team Lead access required",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }
        const roles = await getAllRoles();

        res.json({
          success: true,
          data: roles,
        });
      } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "FETCH_ROLES_ERROR",
        });
      }
    }
  );

  router.use(requireUUIDAuth);
  router.use(checkUserRoles);

  // GET /users - List users based on role
  router.get("/", requireAnyRole, async (req: RoleRequest, res: Response) => {
    try {
      const authUUID = (req as any).authenticatedUUID;
      let users;

      if (req.isAdmin) {
        users = await getAllActiveUsers();
      } else if (req.isTeamLead) {
        users = await getUsersInTeamLedBy(authUUID);

        if (users.length === 0) {
          const self = await getUserByUUID(authUUID);
          users = self ? [self] : [];
        }
      } else {
        const user = await getUserByUUID(authUUID);
        users = user ? [user] : [];
      }

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "FETCH_USERS_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /users/:id - Get user details (with permission check)
  router.get(
    "/:id",
    validateUUID("id"),
    requireAnyRole,
    async (req: RoleRequest, res: Response) => {
      try {
        const authUUID = (req as any).authenticatedUUID;
        const targetUUID = req.validatedUUID!;

        const canView =
          req.isAdmin ||
          authUUID === targetUUID ||
          (req.isTeamLead && (await canUserModifyTarget(authUUID, targetUUID)));

        if (!canView) {
          return res.status(403).json({
            error: "Insufficient permissions to view this user",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        const user = await getUserByUUID(targetUUID);

        if (!user) {
          return res.status(404).json({
            error: "User not found",
            code: "USER_NOT_FOUND",
          });
        }

        res.json({
          success: true,
          data: user,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "FETCH_USER_ERROR",
        });
      }
    }
  );

  // PUT /users/:id/roles - Assign/remove roles (admin or team lead for their team)
  router.put(
    "/:id/roles",
    validateUUID("id"),
    requireTeamLeadOrAdmin,
    async (req: RoleRequest, res: Response) => {
      try {
        const { roles, operation = "replace" } = req.body;
        const authUUID = (req as any).authenticatedUUID;
        const targetUUID = req.validatedUUID!;

        if (!Array.isArray(roles)) {
          return res.status(400).json({
            error: "Roles must be an array",
            code: "INVALID_ROLES_FORMAT",
          });
        }

        if (!["add", "remove", "replace"].includes(operation)) {
          return res.status(400).json({
            error: "Operation must be one of: add, remove, replace",
            code: "INVALID_OPERATION",
          });
        }

        const canModify = await canUserModifyTarget(authUUID, targetUUID);
        if (!canModify) {
          return res.status(403).json({
            error: "Insufficient permissions to modify this user",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        if (!req.isAdmin && roles.includes("admin")) {
          return res.status(403).json({
            error: "Only admins can assign admin role",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        const availableRoles = await getAllRoles();
        const validRoleNames = availableRoles.map((role) => role.name);
        const invalidRoles = roles.filter(
          (role: string) => !validRoleNames.includes(role)
        );

        if (invalidRoles.length > 0) {
          return res.status(400).json({
            error: `Invalid roles: ${invalidRoles.join(
              ", "
            )}. Available roles: ${validRoleNames.join(", ")}`,
            code: "INVALID_ROLES",
          });
        }

        const userExists = await verifyUserExists(targetUUID);
        if (!userExists) {
          return res.status(404).json({
            error: "User not found",
            code: "USER_NOT_FOUND",
          });
        }

        await modifyUserRoles(
          targetUUID,
          roles,
          operation as "add" | "remove" | "replace"
        );

        const operationMessages = {
          add: "added to",
          remove: "removed from",
          replace: "updated for",
        };

        res.json({
          success: true,
          message: `Roles ${
            operationMessages[operation as keyof typeof operationMessages]
          } user successfully`,
          data: {
            userId: targetUUID,
            roles,
            operation,
          },
        });
      } catch (error) {
        console.error("Error updating user roles:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "UPDATE_ROLES_ERROR",
        });
      }
    }
  );

  // PUT /users/:id/lock - Lock/unlock user account (admin or team lead for their team)
  router.put(
    "/:id/lock",
    validateUUID("id"),
    requireTeamLeadOrAdmin,
    async (req: RoleRequest, res: Response) => {
      try {
        const { isActive } = req.body;
        const authUUID = (req as any).authenticatedUUID;
        const targetUUID = req.validatedUUID!;

        if (typeof isActive !== "boolean") {
          return res.status(400).json({
            error: "isActive must be a boolean value",
            code: "INVALID_ACTIVE_STATUS",
          });
        }

        const canModify = await canUserModifyTarget(authUUID, targetUUID);
        if (!canModify) {
          return res.status(403).json({
            error: "Insufficient permissions to modify this user",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        const userExists = await verifyUserExists(targetUUID);
        if (!userExists) {
          return res.status(404).json({
            error: "User not found",
            code: "USER_NOT_FOUND",
          });
        }

        const success = await toggleUserLock(targetUUID, isActive);

        if (!success) {
          return res.status(400).json({
            error: "Failed to update user status",
            code: "UPDATE_STATUS_FAILED",
          });
        }

        res.json({
          success: true,
          message: `User ${isActive ? "unlocked" : "locked"} successfully`,
          data: { userId: targetUUID, isActive },
        });
      } catch (error) {
        console.error("Error updating user lock status:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "UPDATE_LOCK_ERROR",
        });
      }
    }
  );

  // DELETE /users/:id - Soft delete user (admin or team lead for their team)
  router.delete(
    "/:id",
    validateUUID("id"),
    requireTeamLeadOrAdmin,
    async (req: RoleRequest, res: Response) => {
      try {
        const authUUID = (req as any).authenticatedUUID;
        const targetUUID = req.validatedUUID!;

        const canModify = await canUserModifyTarget(authUUID, targetUUID);
        if (!canModify) {
          return res.status(403).json({
            error: "Insufficient permissions to delete this user",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        const userExists = await verifyUserExists(targetUUID);
        if (!userExists) {
          return res.status(404).json({
            error: "User not found",
            code: "USER_NOT_FOUND",
          });
        }

        const success = await softDeleteUser(targetUUID);

        if (!success) {
          return res.status(400).json({
            error: "Failed to delete user",
            code: "DELETE_USER_FAILED",
          });
        }

        res.json({
          success: true,
          message: "User deleted successfully",
          data: { userId: targetUUID },
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "DELETE_USER_ERROR",
        });
      }
    }
  );

  // GET /users/:id/teams - Get user's teams
  router.get(
    "/:id/teams",
    validateUUID("id"),
    requireAnyRole,
    async (req: RoleRequest, res: Response) => {
      try {
        const authUUID = (req as any).authenticatedUUID;
        const targetUUID = req.validatedUUID!;

        const canView =
          req.isAdmin ||
          authUUID === targetUUID ||
          (req.isTeamLead && (await canUserModifyTarget(authUUID, targetUUID)));

        if (!canView) {
          return res.status(403).json({
            error: "Insufficient permissions to view this user's teams",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }

        const userExists = await verifyUserExists(targetUUID);
        if (!userExists) {
          return res.status(404).json({
            error: "User not found",
            code: "USER_NOT_FOUND",
          });
        }

        const teams = await getUserTeams(targetUUID);

        res.json({
          success: true,
          data: teams,
        });
      } catch (error) {
        console.error("Error fetching user teams:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "FETCH_USER_TEAMS_ERROR",
        });
      }
    }
  );

  return router;
};
