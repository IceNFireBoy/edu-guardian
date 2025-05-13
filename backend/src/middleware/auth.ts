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
  // Add other properties from your JWT payload if necessary (e.g., role)
}

// Protect routes
export const protect = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) { // Check if req.cookies exists
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route (no token)', 401));
  }

  if (!process.env.JWT_SECRET) {
    console.error('[AuthMiddleware] JWT_SECRET is not defined.');
    return next(new ErrorResponse('Server configuration error', 500));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    
    const user = await User.findById(decoded.id).select('-password'); // Exclude password explicitly
    if (!user) {
      return next(new ErrorResponse('User not found for token, not authorized', 401));
    }
    
    req.user = user; // Assign found user to req.user
    next();
  } catch (err) {
    // Handle different JWT errors specifically if needed (e.g., TokenExpiredError)
    console.error('[AuthMiddleware] Token verification failed:', err);
    return next(new ErrorResponse('Not authorized to access this route (token invalid)', 401));
  }
});

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(new ErrorResponse('User role not found, authorization denied', 403));
    }
    if (!roles.includes(req.user.role)) {
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