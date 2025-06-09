import type { Response, NextFunction } from "express";
import { getUserByUUID } from "../queries/users.js";
import type { UUIDRequest } from "./uuidValidation.js";

export interface RoleRequest extends UUIDRequest {
  userRoles?: string[];
  isAdmin?: boolean;
  isTeamLead?: boolean;
  isTeamMember?: boolean;
}

export const checkUserRoles = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUUID = (req as any).authenticatedUUID;

    if (!authUUID) {
      return res.status(401).json({
        error: "Authentication required",
        code: "MISSING_AUTH",
      });
    }

    const user = await getUserByUUID(authUUID);

    if (!user) {
      return res.status(401).json({
        error: "Invalid authentication - user not found",
        code: "INVALID_AUTH",
      });
    }

    req.userRoles = user.userRoles || [];
    req.isAdmin = user.userRoles?.includes("admin") || false;
    req.isTeamLead = user.userRoles?.includes("team_lead") || false;
    req.isTeamMember = user.userRoles?.includes("team_member") || false;

    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      code: "ROLE_CHECK_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const requireAdmin = (
  req: RoleRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAdmin) {
    return res.status(403).json({
      error: "Admin access required",
      code: "INSUFFICIENT_PERMISSIONS",
    });
  }
  return next();
};

export const requireTeamLeadOrAdmin = (
  req: RoleRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAdmin && !req.isTeamLead) {
    return res.status(403).json({
      error: "Team lead or admin access required",
      code: "INSUFFICIENT_PERMISSIONS",
    });
  }
  return next();
};

export const requireAnyRole = (
  req: RoleRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userRoles || req.userRoles.length === 0) {
    return res.status(403).json({
      error: "User role required",
      code: "NO_ROLES_ASSIGNED",
    });
  }
  return next();
};
