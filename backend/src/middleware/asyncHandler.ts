import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to wrap express route handlers
 * Eliminates need to use try/catch for route handlers
 * @param fn Function that returns a Promise
 * @returns Express middleware function that handles Promise rejection
 */
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 