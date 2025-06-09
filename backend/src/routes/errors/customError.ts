export class CustomError extends Error {
  public statusCode: number;
  public details?: string | null;

  constructor(
    name : string,
    message : string,
    statusCode : number,
    details: string | null) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class InvalidIdError extends CustomError {
  constructor(message = "Invalid ID", details: string | null) {
    super("InvalidIdError", message, 400, details);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized", details: string | null) {
    super("UnauthorizedError", message, 401, details);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "NotFound", details: string | null) {
    super("NotFoundError", message, 404, details);
  }
}