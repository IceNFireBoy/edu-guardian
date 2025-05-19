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

/**
 * Error thrown when a user has exceeded their quota for AI-powered features
 */
export class QuotaExceededError extends ApiError {
  constructor(message = 'AI usage quota exceeded for the current period.') {
    super(message, 429); // 429 Too Many Requests
  }
}

/**
 * Error thrown when a requested resource cannot be found
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super(message, 404);
  }
}

/**
 * Error thrown when the request is malformed or contains invalid data
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request.') {
    super(message, 400);
  }
}

/**
 * Error thrown when the user is not authenticated
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized.') {
    super(message, 401);
  }
}

/**
 * Error thrown when the user is authenticated but lacks permissions
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden.') {
    super(message, 403);
  }
} 