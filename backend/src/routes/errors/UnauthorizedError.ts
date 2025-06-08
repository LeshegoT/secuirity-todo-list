export class UnauthorizedError extends Error {
  public statusCode: number;
  public details?: string | null;

  constructor(message = "Unauthorized", details: string | null) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
    this.details = details;
  }
}