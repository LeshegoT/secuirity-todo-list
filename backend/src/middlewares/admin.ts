import { Response, NextFunction } from "express";
import { RequestWithUser } from "../types/types.js";
import { getUserId, userHasRole } from "../queries/users.js";

/**
 * Middleware to ensure user is authenticated and has our admin roles
 */
export async function requireAdmin(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user || !user.uuid) {
      return res.status(401).json({ 
        status: "error", 
        message: "Unauthorized" 
      });
    }

    const userId = await getUserId(user.uuid);
    if (!userId) {
      return res.status(401).json({ 
        status: "error", 
        message: "Unauthorized" 
      });
    }

    const isAdmin = await userHasRole(userId, 'admin');
    if (!isAdmin) {
      return res.status(403).json({ 
        status: "error", 
        message: "Admin access required" 
      });
    }

    // Attach userId to request for use in route handlers
    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate user ID parameter
 */
export function validateUserId(req: RequestWithUser, res: Response, next: NextFunction) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      status: "error", 
      message: "User ID parameter is required" 
    });
  }
  
  const userId = parseInt(id);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ 
      status: "error", 
      message: "Invalid user ID" 
    });
  }
  
  req.validatedUserId = userId;
  next();
}

/**
 * Rate limiting middleware for sensitive operations
 * In production, implement with express-rate-limit
 */
export function sensitiveOperationRateLimit(req: RequestWithUser, res: Response, next: NextFunction) {
  // TODO: Implement proper rate limiting with express-rate-limit
  // Example configuration:
  // - 5 requests per minute per IP for password resets
  // - 10 requests per minute per IP for role changes
  // - 3 requests per minute per IP for account locks/deletes
  
  next();
}

/**
 * Middleware to prevent self-targeting operations
 * Prevents admins from locking/deleting their own accounts
 */
export function preventSelfTargeting(req: RequestWithUser, res: Response, next: NextFunction) {
  const currentUserId = req.userId;
  const targetUserId = req.validatedUserId;

  if (currentUserId === targetUserId) {
    return res.status(400).json({
      status: "error",
      message: "Cannot perform this operation on your own account"
    });
  }

  next();
}