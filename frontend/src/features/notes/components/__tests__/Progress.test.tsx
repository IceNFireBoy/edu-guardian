import React from 'react';
import { render, screen } from '@testing-library/react';
import Progress from '../Progress';
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

describe('Progress', () => {
  it('renders progress information', () => {
    render(<Progress note={mockNote} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('10 views')).toBeInTheDocument();
    expect(screen.getByText('2 downloads')).toBeInTheDocument();
    expect(screen.getByText('4.5 average rating')).toBeInTheDocument();
    expect(screen.getByText('2 ratings')).toBeInTheDocument();
  });

  it('displays correct view count', () => {
    const noteWithViews = { ...mockNote, viewCount: 5 };
    render(<Progress note={noteWithViews} />);
    expect(screen.getByText('5 views')).toBeInTheDocument();
  });

  it('displays correct download count', () => {
    const noteWithDownloads = { ...mockNote, downloadCount: 3 };
    render(<Progress note={noteWithDownloads} />);
    expect(screen.getByText('3 downloads')).toBeInTheDocument();
  });

  it('displays correct average rating', () => {
    const noteWithRating = { ...mockNote, averageRating: 3.5 };
    render(<Progress note={noteWithRating} />);
    expect(screen.getByText('3.5 average rating')).toBeInTheDocument();
  });

  it('displays correct rating count', () => {
    const noteWithRatings = { ...mockNote, ratingCount: 3 };
    render(<Progress note={noteWithRatings} />);
    expect(screen.getByText('3 ratings')).toBeInTheDocument();
  });
}); 