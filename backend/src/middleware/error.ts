import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ErrorResponse from '../utils/errorResponse';

/**
 * Global error handler middleware
 */
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for debugging (with request info)
  console.error(`[${new Date().toISOString()}] ERROR: ${req.method} ${req.originalUrl}`);
  console.error('Request body:', req.body);
  console.error('Error details:', err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired. Please log in again.', 401);
  }

  // An unexplained 500 while Mongo is unreachable is a database outage
  // (e.g. mongoose buffering timeouts), not a generic server error. Say so,
  // so the frontend and logs point straight at the real problem.
  if (!error.statusCode && mongoose.connection.readyState !== 1) {
    error = new ErrorResponse(
      'Database unavailable: the server cannot reach MongoDB. Admin: check that the Atlas cluster is running and MONGO_URI on Render is current.',
      503
    );
  }

  // Send the error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler; 