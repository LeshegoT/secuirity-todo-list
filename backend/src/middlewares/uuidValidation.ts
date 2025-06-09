import type { Request, Response, NextFunction } from "express";

function isValidUUIDv4(uuid: string): boolean {
  const uuidv4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidv4Regex.test(uuid);
}

export interface UUIDRequest extends Request {
  validatedUUID?: string;
}

export const validateUUID = (paramName = "id") => {
  return (req: UUIDRequest, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];

    if (!uuid) {
      return res.status(400).json({
        error: "UUID parameter is required",
        code: "MISSING_UUID",
      });
    }

    if (!isValidUUIDv4(uuid)) {
      return res.status(400).json({
        error: "Invalid UUID format. Only UUID v4 is accepted.",
        code: "INVALID_UUID",
      });
    }

    req.validatedUUID = uuid;
    next();
  };
};

export const requireUUIDAuth = (
  req: UUIDRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as any).uuid) {
      const userUUID = (req.user as any).uuid;

      if (!isValidUUIDv4(userUUID)) {
        return res.status(401).json({
          error: "Invalid user UUID format",
          code: "INVALID_USER_UUID",
        });
      }
      (req as any).authenticatedUUID = userUUID;
      next();
      return;
    }

    const authUUID = req.headers["x-user-uuid"] as string;

    if (!authUUID) {
      return res.status(401).json({
        error: "Authentication UUID required in x-user-uuid header",
        code: "MISSING_AUTH_UUID",
      });
    }

    if (!isValidUUIDv4(authUUID)) {
      return res.status(401).json({
        error: "Invalid authentication UUID format",
        code: "INVALID_AUTH_UUID",
      });
    }
    (req as any).authenticatedUUID = authUUID;
    next();
  } catch (error) {
    console.error("Error in requireUUIDAuth middleware:", error);
    res.status(500).json({
      error: "Internal server error in authentication",
      code: "AUTH_ERROR",
    });
  }
};
