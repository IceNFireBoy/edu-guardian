import { ApiError, NotFoundError, BadRequestError, QuotaExceededError } from '../../utils/customErrors';

describe('Custom Errors', () => {
  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found.');
      expect(error.statusCode).toBe(404);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('BadRequestError', () => {
    it('should create BadRequestError with default message', () => {
      const error = new BadRequestError();
      expect(error.message).toBe('Bad request.');
      expect(error.statusCode).toBe(400);
    });

    it('should create BadRequestError with custom message', () => {
      const error = new BadRequestError('Invalid input data');
      expect(error.message).toBe('Invalid input data');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('QuotaExceededError', () => {
    it('should create QuotaExceededError with default message', () => {
      const error = new QuotaExceededError();
      expect(error.message).toBe('AI usage quota exceeded for the current period.');
      expect(error.statusCode).toBe(429);
    });

    it('should create QuotaExceededError with custom message', () => {
      const error = new QuotaExceededError('Daily AI summary quota exceeded');
      expect(error.message).toBe('Daily AI summary quota exceeded');
      expect(error.statusCode).toBe(429);
    });

    it('should create custom API error with message and status code', () => {
      const error = new ApiError('Flashcard quota exceeded', 403);
      expect(error.message).toBe('Flashcard quota exceeded');
      expect(error.statusCode).toBe(403);
    });
  });
}); 