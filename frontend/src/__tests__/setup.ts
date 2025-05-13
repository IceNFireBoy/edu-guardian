import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    );
  }),

  // User endpoints
  rest.get('/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        aiUsage: {
          summaryUsed: 2,
          flashcardUsed: 3,
          lastReset: new Date().toISOString(),
        },
        streak: {
          current: 5,
          max: 7,
          lastUsed: new Date().toISOString(),
        },
        badges: [],
      })
    );
  }),

  // Note endpoints
  rest.post('/api/notes/generate-summary', (req, res, ctx) => {
    return res(
      ctx.json({
        summary: 'Mock AI summary',
        newlyAwardedBadges: [],
      })
    );
  }),

  rest.post('/api/notes/generate-flashcards', (req, res, ctx) => {
    return res(
      ctx.json({
        flashcards: [
          {
            question: 'Mock question',
            answer: 'Mock answer',
            tag: 'test',
          },
        ],
        newlyAwardedBadges: [],
      })
    );
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close()); 