export class InvalidIdError extends Error {
  public statusCode: number;
  public details?: string | null;

  constructor(message = "Invalid ID", details: string | null) {
    super(message);
    this.name = "InvalidIdError";
    this.statusCode = 400;
    this.details = details;
  }
}