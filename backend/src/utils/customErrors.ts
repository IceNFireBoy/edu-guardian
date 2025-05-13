export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // To distinguish between operational and programming errors
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    Error.captureStackTrace(this);
  }
}

export class QuotaExceededError extends ApiError {
  constructor(message: string = 'AI usage quota exceeded for the current period.') {
    super(message, 429); // 429 Too Many Requests
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found.') {
    super(message, 404);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request.') {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized.') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden.') {
    super(message, 403);
  }
} 