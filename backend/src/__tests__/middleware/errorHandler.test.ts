import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../middleware/errorHandler';
import ErrorResponse from '../../utils/errorResponse';
import mongoose from 'mongoose';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      // @ts-ignore // Mock for res.headersSent for a specific test case
      headersSent: false, 
    };
    mockNext = jest.fn();
  });

  it('should handle ErrorResponse instances correctly', () => {
    const error = new ErrorResponse('Test ErrorResponse', 404);
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test ErrorResponse',
    });
  });

  it('should include errors array if provided in ErrorResponse', () => {
    const validationErrors = [{ field: 'email', message: 'Is required' }];
    const error = new ErrorResponse('Validation Failed', 400, validationErrors);
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation Failed',
      errors: validationErrors,
    });
  });

  it('should handle Mongoose CastError (ObjectId invalid)', () => {
    // Simulate a Mongoose CastError for an invalid ObjectId
    const error = new mongoose.Error.CastError('ObjectId', '123', '_id');
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(404); // Typically 404 for bad ID format
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found', // Error handler converts CastError to this
    });
  });

  it('should handle Mongoose ValidationError', () => {
    const errors = {
      name: new mongoose.Error.ValidatorError({ message: 'Name is required', path: 'name', type: 'required' }),
      email: new mongoose.Error.ValidatorError({ message: 'Email is invalid', path: 'email', type: 'format' }),
    };
    const error = new mongoose.Error.ValidationError();
    error.errors = errors;

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Name is required, Email is invalid', // Error handler joins messages
    });
  });

  it('should handle Mongoose Duplicate Key Error (code 11000)', () => {
    const error: any = new Error('Duplicate key');
    error.code = 11000;
    error.keyValue = { email: 'test@example.com' }; // Example keyValue
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate field value entered for: email', // Error handler specific message
    });
  });

  it('should handle generic errors with a 500 status code', () => {
    const error = new Error('Some generic server error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error',
    });
  });
  
  it('should not send response if headers already sent', () => {
    const error = new ErrorResponse('Test ErrorResponse', 404);
    // @ts-ignore
    mockResponse.headersSent = true; // Simulate headers already sent
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
    // It should call next(error) if headersSent, but our mockNext doesn't check args here
    // For a more robust test, one might check if next was called with the original error.
  });
}); 