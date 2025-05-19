import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../middleware/error';
import ErrorResponse from '../../utils/errorResponse';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should handle ErrorResponse with status code', () => {
    const error = new ErrorResponse('Test error', 400);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error'
    });
  });

  it('should handle mongoose validation error', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed'
    });
  });

  it('should handle mongoose duplicate key error', () => {
    const error = new Error('Duplicate field value entered');
    error.name = 'MongoError';
    (error as any).code = 11000;
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate field value entered'
    });
  });

  it('should handle mongoose cast error', () => {
    const error = new Error('Invalid ID');
    error.name = 'CastError';
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid ID'
    });
  });

  it('should handle JWT errors', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token'
    });
  });

  it('should handle JWT expiration errors', () => {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token expired'
    });
  });

  it('should handle unknown errors', () => {
    const error = new Error('Unknown error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown error'
    });
  });
}); 