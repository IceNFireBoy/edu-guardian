import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/notes', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 'note1', title: 'Test Note', content: 'Test Content' }));
  }),
  rest.get('/api/notes/note1', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 'note1', title: 'Test Note', content: 'Test Content' }));
  }),
  rest.post('/api/notes/note1/ai-summary', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ summary: 'AI Summary', keyPoints: ['Point 1', 'Point 2'] }));
  }),
  rest.post('/api/notes/note1/ai-flashcards', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ flashcards: [{ question: 'Q1', answer: 'A1' }] }));
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
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Test Content' } });
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