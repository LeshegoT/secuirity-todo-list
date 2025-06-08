import { Router } from "express";
import { RequestWithUser, RoleAssignmentRequest, AccountLockRequest } from "../types/types.js";
import { requireAdmin, validateUserId, sensitiveOperationRateLimit, preventSelfTargeting } from "../middlewares/admin.js";
import {
  getAllUsers,
  getUserById,
  getUserByUuid,
  userHasRole,
  getAllRoles,
  assignRoleToUser,
  removeRoleFromUser,
  lockUserAccount,
  unlockUserAccount,
  softDeleteUser,
  generatePasswordResetToken,
  validatePasswordResetToken,
  clearPasswordResetToken
} from "../queries/users.js";

const router = Router();

// GET /users - List all users
router.get("/", requireAdmin, async (req: RequestWithUser, res, next) => {
  try {
    const users = await getAllUsers();
    
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      is_verified: user.is_verified,
      uuid: user.uuid,
      roles: user.roles
    }));

    res.status(200).json({
      status: "success",
      data: sanitizedUsers
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/:id - Get user details
router.get("/:id", requireAdmin, validateUserId, async (req: RequestWithUser, res, next) => {
  try {
    const userId = req.validatedUserId;
    
    if (userId === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }
    
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      is_verified: user.is_verified,
      uuid: user.uuid,
      roles: user.roles
    };

    res.status(200).json({
      status: "success",
      data: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
});

// PUT /users/:id/roles - Assign/remove roles
router.put("/:id/roles", requireAdmin, validateUserId, sensitiveOperationRateLimit, async (req: RequestWithUser, res, next) => {
  try {
    const userId = req.validatedUserId;
    
    if (userId === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }
    
    const { action, roleIds }: RoleAssignmentRequest = req.body;

    if (!action || !Array.isArray(roleIds)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body. Expected: { action: 'assign' | 'remove', roleIds: number[] }"
      });
    }

    if (!['assign', 'remove'].includes(action)) {
      return res.status(400).json({
        status: "error",
        message: "Action must be 'assign' or 'remove'"
      });
    }

    const validRoleIds = roleIds.filter(id => Number.isInteger(id) && id > 0);
    if (validRoleIds.length !== roleIds.length) {
      return res.status(400).json({
        status: "error",
        message: "All role IDs must be positive integers"
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    const availableRoles = await getAllRoles();
    const availableRoleIds = availableRoles.map(r => r.id);

    const invalidRoleIds = validRoleIds.filter(id => !availableRoleIds.includes(id));
    if (invalidRoleIds.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Invalid role IDs: ${invalidRoleIds.join(', ')}`
      });
    }

    if (action === 'assign') {
      for (const roleId of validRoleIds) {
        await assignRoleToUser(userId, roleId);
      }
    } else {
      for (const roleId of validRoleIds) {
        await removeRoleFromUser(userId, roleId);
      }
    }

    const updatedUser = await getUserById(userId);
    
    res.status(200).json({
      status: "success",
      message: `Roles ${action}ed successfully`,
      data: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        roles: updatedUser!.roles
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /users/:id/lock - Lock/unlock user account
router.put("/:id/lock", requireAdmin, validateUserId, preventSelfTargeting, sensitiveOperationRateLimit, async (req: RequestWithUser, res, next) => {
  try {
    const userId = req.validatedUserId;

    if (userId === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }
    
    const { action }: AccountLockRequest = req.body;

    if (!action || !['lock', 'unlock'].includes(action)) {
      return res.status(400).json({
        status: "error",
        message: "Action must be 'lock' or 'unlock'"
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    if (action === 'lock') {
      await lockUserAccount(userId);
    } else {
      await unlockUserAccount(userId);
    }

    res.status(200).json({
      status: "success",
      message: `User account ${action}ed successfully`,
      data: {
        id: userId,
        action: action
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/:id - Soft delete user
router.delete("/:id", requireAdmin, validateUserId, preventSelfTargeting, sensitiveOperationRateLimit, async (req: RequestWithUser, res, next) => {
  try {
    const userId = req.validatedUserId;

    if (userId === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    await softDeleteUser(userId);

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      data: {
        id: userId,
        deleted: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /users/reset-password/:id - Generate password reset token
router.post("/reset-password/:id", requireAdmin, validateUserId, sensitiveOperationRateLimit, async (req: RequestWithUser, res, next) => {
  try {
    const userId = req.validatedUserId;

    if (userId === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    const resetToken = await generatePasswordResetToken(userId);

    
    res.status(200).json({
      status: "success",
      message: "Password reset token generated",
      data: {
        id: userId,
        resetToken: resetToken,
        message: "Token generated successfully."
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;