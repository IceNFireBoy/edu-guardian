import React from 'react';
import { render, screen } from '@testing-library/react';
import NoteList from '../NoteList';
import { Note } from '../../noteTypes';

const mockNotes: Note[] = [
  {
    _id: '1',
    title: 'Test Note 1',
    content: 'Test content 1',
    subject: 'Math',
    grade: '10th',
    semester: 'Fall',
    quarter: 'Q1',
    topic: 'Algebra',
    isPublic: true,
    fileUrl: 'test1.pdf',
    fileType: 'pdf',
    viewCount: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: 'user123'
  },
  {
    _id: '2',
    title: 'Test Note 2',
    content: 'Test content 2',
    subject: 'Science',
    grade: '11th',
    semester: 'Spring',
    quarter: 'Q2',
    topic: 'Physics',
    isPublic: true,
    fileUrl: 'test2.pdf',
    fileType: 'pdf',
    viewCount: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    user: 'user123'
  }
];

describe('NoteList', () => {
  it('renders list of notes', () => {
    render(<NoteList notes={mockNotes} />);
    
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('renders empty state when no notes', () => {
    render(<NoteList notes={[]} />);
    expect(screen.getByText('No notes found')).toBeInTheDocument();
  });
}); 