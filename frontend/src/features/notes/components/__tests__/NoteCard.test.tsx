import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NoteCard from '../NoteCard';
import { Note } from '../../../../types/note';

// Mock the useStreak hook
jest.mock('../../../../hooks/useStreak', () => ({
  useStreak: () => ({
    recordActivity: jest.fn()
  })
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('NoteCard', () => {
  const mockNote: Note = {
    _id: '1',
    title: 'Test Note',
    content: 'Test Content',
    description: 'A test note',
    fileUrl: 'http://example.com/file.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    subject: 'Math',
    grade: '11',
    semester: '1',
    quarter: '1',
    topic: 'Algebra',
    tags: ['math'],
    viewCount: 100,
    downloadCount: 50,
    ratings: [],
    averageRating: 4.5,
    aiSummary: '',
    aiSummaryKeyPoints: [],
    flashcards: [],
    user: 'user123',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    rating: 4.5,
    ratingCount: 10
  };

  const renderNoteCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <NoteCard
          note={mockNote}
          onView={jest.fn()}
          {...props}
        />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders note card with basic information', () => {
    renderNoteCard();
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('handles view count and download count display', () => {
    renderNoteCard();
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('handles rating display', () => {
    renderNoteCard();
    
    const stars = screen.getAllByTestId('star');
    expect(stars).toHaveLength(5);
    expect(stars[0]).toHaveClass('text-yellow-400');
  });

  it('handles view button click', () => {
    const onView = jest.fn();
    renderNoteCard({ onView });
    
    fireEvent.click(screen.getByText('View Details'));
    expect(onView).toHaveBeenCalledWith(mockNote);
    expect(mockNavigate).toHaveBeenCalledWith('/view-note?id=1');
  });

  it('renders compact view when compact prop is true', () => {
    renderNoteCard({ compact: true });
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('h-full');
  });

  it('handles invalid note data', () => {
    render(
      <BrowserRouter>
        <NoteCard
          note={{} as Note}
          onView={jest.fn()}
        />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Untitled Note')).toBeInTheDocument();
  });

  it('handles missing file URL', () => {
    const noteWithoutFile = { ...mockNote, fileUrl: undefined };
    renderNoteCard({ note: noteWithoutFile });
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('handles different file types', () => {
    const noteWithImage = { ...mockNote, fileType: 'image/jpeg' };
    renderNoteCard({ note: noteWithImage });
    
    expect(screen.getByAltText('Test Note')).toBeInTheDocument();
  });

  it('handles dark mode classes', () => {
    renderNoteCard();
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('dark:bg-slate-800');
  });

  it('handles motion animations', () => {
    renderNoteCard();
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('motion');
  });
}); 