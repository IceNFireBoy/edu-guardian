import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';

interface CustomError extends Error {
  statusCode?: number;
  code?: number; // For duplicate key error
  errors?: any; // For Mongoose validation errors
  value?: any; // For CastError
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  let error: ErrorResponse = { ...err } as ErrorResponse; // Type assertion
  error.message = err.message; // Ensure message is copied
  error.statusCode = err.statusCode; // Ensure statusCode is copied

  // Log to console for dev
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]'.red, err.stack?.red);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.errors || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val: any) => val.message);
    const message = messages.join(', ');
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

export default errorHandler; 