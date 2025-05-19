import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Define interface for error object with statusCode
interface ExtendedError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
}

/**
 * Global error handling middleware
 * Formats different types of errors into a consistent response format
 */
const errorHandler = (err: Error | ErrorResponse | unknown, _req: Request, res: Response, _next: NextFunction): void => {
  // Initialize error object with defaults
  let error: ExtendedError = err instanceof Error ? err : new Error('Unknown error');
  
  // If it's not an ErrorResponse instance but has statusCode, preserve it
  if (!(err instanceof ErrorResponse) && (err as any).statusCode) {
    error.statusCode = (err as any).statusCode;
  }

  // Log the original error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (error.name === 'CastError' || err instanceof mongoose.Error.CastError) {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000 || error.name === 'MongoError') {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError' || err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors || {}).map(val => val.message);
    error = new ErrorResponse(message.join(', '), 400);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || err instanceof JsonWebTokenError) {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (error.name === 'TokenExpiredError' || err instanceof TokenExpiredError) {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  // Send the error response
  res.status(error.statusCode ?? 500).json({
    success: false,
    error: error.message ?? 'Server Error'
  });
};

export default errorHandler; 