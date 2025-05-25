import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { Note, Flashcard } from '../features/notes/noteTypes';

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  profileImage: 'https://example.com/avatar.jpg',
  xp: 100,
  level: 2,
  streak: {
    current: 5,
    longest: 7,
    lastUpdated: new Date().toISOString()
  },
  achievements: [],
  recentActivity: []
};

const mockNote: Note = {
  id: 'note1',
  title: 'Test Note',
  description: 'Test Content',
  subject: 'mathematics',
  grade: 'grade10',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  fileUrl: 'https://example.com/test.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  createdAt: new Date().toISOString(),
  user: {
    name: 'Test User',
    username: 'testuser'
  },
  averageRating: 0,
  ratings: [],
  viewCount: 0,
  isPublic: true,
  tags: ['test', 'algebra']
};

// Mock API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-token'
        }
      })
    );
  }),

  // User endpoints
  rest.get('/api/v1/users/profile', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: mockUser
      })
    );
  }),

  // Note endpoints
  rest.post('/api/v1/notes/note1/summarize', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          _id: 'note1',
          aiSummary: {
            content: 'Mock AI summary',
            keyPoints: ['Point 1', 'Point 2'],
            generatedAt: new Date().toISOString(),
            modelUsed: 'gpt-3.5-turbo'
          }
        },
        newlyAwardedBadges: []
      })
    );
  }),

  rest.post('/api/v1/notes/note1/generate-flashcards', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          flashcards: [
            {
              _id: 'fc1',
              question: 'Mock question',
              answer: 'Mock answer',
              difficulty: 'medium'
            }
          ]
        },
        newlyAwardedBadges: []
      })
    );
  }),

  // Note CRUD endpoints
  rest.get('/api/v1/notes', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          data: [mockNote],
          count: 1,
          totalPages: 1,
          currentPage: 1
        }
      })
    );
  }),

  rest.get('/api/v1/notes/note1', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: mockNote
      })
    );
  }),

  rest.post('/api/v1/notes', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: mockNote
      })
    );
  })
];

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close()); 