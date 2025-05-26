import React from 'react';
import { render, screen } from '@testing-library/react';
import NoteViewer from '../NoteViewer';
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

describe('NoteViewer', () => {
  it('renders note content', () => {
    render(<NoteViewer note={mockNote} />);
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('10th')).toBeInTheDocument();
    expect(screen.getByText('Fall')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Algebra')).toBeInTheDocument();
  });

  it('renders PDF viewer when file is PDF', () => {
    render(<NoteViewer note={mockNote} />);
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('renders error state when note is null', () => {
    render(<NoteViewer note={null} />);
    expect(screen.getByText('Note not found')).toBeInTheDocument();
  });
}); 