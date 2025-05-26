import React from 'react';
import { render, screen } from '@testing-library/react';
import NoteViewer from '../NoteViewer';
import { Note } from '../../../../types/note';

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

describe('NoteViewer', () => {
  it('renders note content', () => {
    render(<NoteViewer note={mockNote} />);
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Some content')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
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