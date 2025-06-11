export class CustomError extends Error {
  public statusCode: number;
  public details?: string | null;

  constructor(
    name : string,
    message : string,
    statusCode : number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export class InvalidIdError extends CustomError {
  constructor(message = "Invalid ID") {
    super("InvalidIdError", message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized") {
    super("UnauthorizedError", message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "NotFound") {
    super("NotFoundError", message, 404);
  }
}