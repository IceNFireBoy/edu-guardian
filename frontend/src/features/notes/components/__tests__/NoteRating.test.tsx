import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteRating from '../NoteRating';
import { Note } from '../../../types/note';

const mockNote = {
  _id: '1',
  title: 'Test Note',
  content: 'Some content',
  subject: 'Math',
  grade: '10',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'pdf',
  viewCount: 10,
  downloadCount: 2,
  averageRating: 4.5,
  ratingCount: 2,
  ratings: [],
  flashcards: [],
  user: 'user123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  aiSummary: '',
  aiSummaryKeyPoints: [],
  asset_id: '1',
};

describe('NoteRating', () => {
  const mockOnRate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders rating stars', () => {
    render(<NoteRating note={mockNote} onRate={mockOnRate} />);
    
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('calls onRate when a star is clicked', () => {
    render(<NoteRating note={mockNote} onRate={mockOnRate} />);
    
    fireEvent.click(screen.getAllByRole('button')[2]); // Click 3rd star
    expect(mockOnRate).toHaveBeenCalledWith(3);
  });

  it('displays current rating', () => {
    const noteWithRating = { ...mockNote, rating: 4, ratingCount: 1 };
    render(<NoteRating note={noteWithRating} onRate={mockOnRate} />);
    
    const stars = screen.getAllByRole('button');
    expect(stars[3]).toHaveClass('text-yellow-400'); // 4th star should be filled
    expect(stars[4]).not.toHaveClass('text-yellow-400'); // 5th star should be empty
  });
}); 