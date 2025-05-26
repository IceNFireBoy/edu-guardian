import React from 'react';
import { render, screen } from '@testing-library/react';
import Progress from '../Progress';
import { Note } from '../../noteTypes';

const mockNote: Note = {
  _id: '1',
  title: 'Test Note',
  content: 'Test content',
  subject: 'Math',
  grade: '10th',
  semester: 'Fall',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'test.pdf',
  fileType: 'pdf',
  viewCount: 0,
  rating: 0,
  ratingCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  user: 'user123'
};

describe('Progress', () => {
  it('renders progress information', () => {
    render(<Progress note={mockNote} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('0 views')).toBeInTheDocument();
    expect(screen.getByText('0 ratings')).toBeInTheDocument();
  });

  it('displays correct view count', () => {
    const noteWithViews = { ...mockNote, viewCount: 5 };
    render(<Progress note={noteWithViews} />);
    expect(screen.getByText('5 views')).toBeInTheDocument();
  });

  it('displays correct rating count', () => {
    const noteWithRatings = { ...mockNote, ratingCount: 3 };
    render(<Progress note={noteWithRatings} />);
    expect(screen.getByText('3 ratings')).toBeInTheDocument();
  });
}); 