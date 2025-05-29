import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import asyncHandler from './async'; // Now async.ts
import ErrorResponse from '../utils/errorResponse'; // Now errorResponse.ts
import User, { IUser } from '../models/User'; // Now User.ts

// Extend Express Request type to include the user property
export interface CustomRequest extends Request {
  user?: IUser; // User property is optional as it's added by this middleware
  file?: Express.Multer.File; // Add optional file property for Multer
}

interface DecodedToken {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to protect routes by verifying JWT token
 * Adds the authenticated user to the request object
 */
export const protect = asyncHandler(async (req: CustomRequest, _res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Extract token from Authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    // Get token from cookie
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route (no token)', 401));
  }

  // Verify JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    console.error('[AuthMiddleware] JWT_SECRET is not defined.');
    return next(new ErrorResponse('Server configuration error', 500));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    
    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password'); // Exclude password explicitly
    if (!user) {
      return next(new ErrorResponse('User not found for token, not authorized', 401));
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    // Handle different JWT errors specifically
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ErrorResponse('Token expired, please log in again', 401));
    } else if (err instanceof jwt.JsonWebTokenError) {
      return next(new ErrorResponse('Invalid token, please log in again', 401));
    }
    
    console.error('[AuthMiddleware] Token verification failed:', err);
    return next(new ErrorResponse('Not authorized to access this route (token invalid)', 401));
  }
});

// Type for valid user roles
type UserRole = 'user' | 'publisher' | 'admin';

/**
 * Middleware to restrict access to specific user roles
 * Must be used after the protect middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: CustomRequest, _res: Response, next: NextFunction): void => {
    // Check if user exists and has a role property
    if (!req.user?.role) {
      return next(new ErrorResponse('User role not found, authorization denied', 403));
    }
    
    // Check if user's role is in the authorized roles list
    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`, 
          403
        )
      );
    }
    
    next();
  };
}; 