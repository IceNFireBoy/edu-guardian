import React from 'react';
import { render, screen } from '@testing-library/react';
import NoteList from '../NoteList';
import { Note } from '../../../types/note';

const notes: Note[] = [
  {
    _id: '1',
    title: 'Note 1',
    content: 'Content 1',
    subject: 'Math',
    grade: '10',
    semester: '1',
    quarter: '1',
    topic: 'Algebra',
    isPublic: true,
    fileUrl: 'http://example.com/file1.pdf',
    fileType: 'pdf',
    viewCount: 5,
    downloadCount: 1,
    averageRating: 4.0,
    rating: 0,
    ratingCount: 1,
    ratings: [],
    flashcards: [],
    user: 'user123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    aiSummary: '',
    aiSummaryKeyPoints: [],
  },
  {
    _id: '2',
    title: 'Note 2',
    content: 'Content 2',
    subject: 'Science',
    grade: '11',
    semester: '2',
    quarter: '2',
    topic: 'Biology',
    isPublic: true,
    fileUrl: 'http://example.com/file2.pdf',
    fileType: 'pdf',
    viewCount: 3,
    downloadCount: 2,
    averageRating: 3.5,
    rating: 0,
    ratingCount: 1,
    ratings: [],
    flashcards: [],
    user: 'user123',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    aiSummary: '',
    aiSummaryKeyPoints: [],
  }
];

describe('NoteList', () => {
  it('renders list of notes', () => {
    render(<NoteList notes={notes} />);
    
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('renders empty state when no notes', () => {
    render(<NoteList notes={[]} />);
    expect(screen.getByText('No notes found')).toBeInTheDocument();
  });
}); 