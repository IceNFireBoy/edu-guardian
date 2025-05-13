import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a type for the async function that asyncHandler will wrap
// This function can be any Express route handler (req, res, next) => Promise<any> or void
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler; 