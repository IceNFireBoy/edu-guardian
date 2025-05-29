import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteFlashcards } from './NoteFlashcards';
import { Note } from '../../types/note';

const mockNote: Note = {
  _id: '1',
  title: 'Test Note',
  content: 'Test content',
  subject: 'math',
  grade: '9',
  semester: '1',
  quarter: '1',
  topic: 'algebra',
  tags: ['test'],
  rating: 4.5,
  ratingCount: 10,
  viewCount: 100,
  downloadCount: 50,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  userId: 'user1',
  isPublic: true,
  comments: [],
  flashcards: [
    {
      _id: '1',
      front: 'What is 2+2?',
      back: '4',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      _id: '2',
      front: 'What is 3x3?',
      back: '9',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]
};

describe('NoteFlashcards', () => {
  it('renders flashcards correctly', () => {
    render(<NoteFlashcards note={mockNote} />);
    
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('What is 3x3?')).toBeInTheDocument();
  });

  it('flips flashcards when clicked', () => {
    render(<NoteFlashcards note={mockNote} />);
    
    const firstCard = screen.getByText('What is 2+2?');
    fireEvent.click(firstCard);
    expect(screen.getByText('4')).toBeInTheDocument();
    
    fireEvent.click(firstCard);
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('shows empty state when no flashcards', () => {
    const noteWithoutFlashcards = { ...mockNote, flashcards: [] };
    render(<NoteFlashcards note={noteWithoutFlashcards} />);
    
    expect(screen.getByText('No flashcards available')).toBeInTheDocument();
  });
}); 