import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteCard from '../NoteCard';
import { useStreak } from '../../../hooks/useStreak';
import { useNavigate } from 'react-router-dom';

// Mock the hooks and dependencies
vi.mock('../../../hooks/useStreak');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

// Mock the rating stats function
vi.mock('../utils/ratingUtils', () => ({
  getRatingStats: () => ({ avg: 4.5, count: 10 })
}));

describe('NoteCard', () => {
  const mockNote = {
    id: 'test-note-id',
    title: 'Test Note',
    description: 'Test Description',
    subject: 'Mathematics',
    grade: '12',
    semester: '1',
    quarter: '1',
    topic: 'Algebra',
    isPublic: true,
    fileUrl: 'https://example.com/test.pdf',
    fileType: 'pdf',
    viewCount: 100,
    ratingCount: 10,
    averageRating: 4.5,
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockNavigate = vi.fn();
  const mockRecordActivity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useStreak as any).mockReturnValue({
      recordActivity: mockRecordActivity
    });
  });

  it('renders note card with correct information', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText(mockNote.title)).toBeInTheDocument();
    expect(screen.getByText(mockNote.description)).toBeInTheDocument();
    expect(screen.getByText(mockNote.subject)).toBeInTheDocument();
    expect(screen.getByText(`${mockNote.viewCount}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockNote.averageRating.toFixed(1)}`)).toBeInTheDocument();
  });

  it('renders compact view when compact prop is true', () => {
    render(<NoteCard note={mockNote} compact={true} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('h-full'); // Compact view class
  });

  it('handles click event and navigates to note details', () => {
    render(<NoteCard note={mockNote} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockNavigate).toHaveBeenCalledWith(`/notes/${mockNote.id}`);
    expect(mockRecordActivity).toHaveBeenCalledWith('view_note');
  });

  it('renders correct thumbnail for PDF files', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByTestId('pdf-thumbnail')).toBeInTheDocument();
  });

  it('renders correct thumbnail for image files', () => {
    const imageNote = {
      ...mockNote,
      fileType: 'image/jpeg',
      fileUrl: 'https://example.com/test.jpg'
    };
    
    render(<NoteCard note={imageNote} />);
    
    const thumbnail = screen.getByRole('img');
    expect(thumbnail).toHaveAttribute('src', imageNote.fileUrl);
    expect(thumbnail).toHaveAttribute('alt', imageNote.title);
  });

  it('renders fallback icon for unknown file types', () => {
    const unknownNote = {
      ...mockNote,
      fileType: 'unknown',
      fileUrl: 'https://example.com/test.xyz'
    };
    
    render(<NoteCard note={unknownNote} />);
    
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('handles invalid note prop gracefully', () => {
    render(<NoteCard note={null as any} />);
    
    expect(screen.getByText('Invalid Note')).toBeInTheDocument();
  });

  it('applies correct subject color theme', () => {
    render(<NoteCard note={mockNote} />);
    
    const subjectTag = screen.getByText(mockNote.subject);
    expect(subjectTag).toHaveClass('bg-blue-500'); // Assuming Mathematics maps to blue
  });

  it('displays correct rating information', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText(`${mockNote.averageRating.toFixed(1)}`)).toBeInTheDocument();
    expect(screen.getByText(`(${mockNote.ratingCount} votes)`)).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<NoteCard note={mockNote} />);
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(mockNavigate).toHaveBeenCalledWith(`/notes/${mockNote.id}`);
    expect(mockRecordActivity).toHaveBeenCalledWith('view_note');
  });

  it('truncates long titles and descriptions', () => {
    const longNote = {
      ...mockNote,
      title: 'This is a very long title that should be truncated after a certain number of characters',
      description: 'This is a very long description that should be truncated after a certain number of characters'
    };
    
    render(<NoteCard note={longNote} />);
    
    const title = screen.getByText(longNote.title);
    const description = screen.getByText(longNote.description);
    
    expect(title).toHaveClass('line-clamp-2');
    expect(description).toHaveClass('line-clamp-2');
  });
}); 