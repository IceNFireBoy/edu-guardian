import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Note, NoteRating } from '../features/notes/noteTypes';

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
    username: 'testuser'
  },
  averageRating: 0,
  ratings: [],
  viewCount: 0,
  isPublic: true,
  tags: ['test', 'algebra']
};

const server = setupServer(
  rest.post('/api/v1/notes', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true, data: mockNote }));
  }),
  rest.get('/api/v1/notes/note1', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: mockNote }));
  }),
  rest.post('/api/v1/notes/note1/summarize', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      success: true,
      data: {
        _id: 'note1',
        aiSummary: {
          content: 'AI Summary',
          keyPoints: ['Point 1', 'Point 2'],
          generatedAt: new Date().toISOString(),
          modelUsed: 'gpt-3.5-turbo'
        }
      }
    }));
  }),
  rest.post('/api/v1/notes/note1/generate-flashcards', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      success: true,
      data: {
        flashcards: [
          {
            _id: 'fc1',
            question: 'Q1',
            answer: 'A1',
            difficulty: 'medium'
          }
        ]
      },
      newlyAwardedBadges: []
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Note Integration', () => {
  it('creates a new note and views it', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <App />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Note' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Content' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'mathematics' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: 'grade10' } });
    fireEvent.change(screen.getByLabelText('Semester'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Quarter'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Algebra' } });
    
    fireEvent.click(screen.getByText('Create Note'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  it('generates AI summary for a note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/note1']}>
        <App />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText('AI Summary'));
    fireEvent.click(screen.getByText('Generate Summary'));
    
    await waitFor(() => {
      expect(screen.getByText('AI Summary')).toBeInTheDocument();
      expect(screen.getByText('Point 1')).toBeInTheDocument();
      expect(screen.getByText('Point 2')).toBeInTheDocument();
    });
  });

  it('generates AI flashcards for a note', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/note1']}>
        <App />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText('AI Flashcards'));
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    await waitFor(() => {
      expect(screen.getByText('Q1')).toBeInTheDocument();
      expect(screen.getByText('A1')).toBeInTheDocument();
    });
  });
}); 