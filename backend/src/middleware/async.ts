import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a type for the async function that asyncHandler will wrap
// This function can be any Express route handler (req, res, next) => Promise<void>
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async express route handler to automatically catch any errors
 * and pass them to the next() function for the error middleware to handle.
 * 
 * @param fn - The async route handler function to wrap
 * @returns A function compatible with Express route handlers
 */
const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler; 