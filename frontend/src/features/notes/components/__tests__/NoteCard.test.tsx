import { render, screen } from '@testing-library/react';
import NoteCard from '../../NoteCard';
import { Note } from '../../noteTypes';

const mockNotesCard: Note[] = [
  {
    id: '1',
    title: 'Test Note 1',
    content: 'Test content 1',
    fileUrl: 'http://example.com/test1.pdf',
    fileType: 'application/pdf',
    subject: 'Test Subject',
    grade: 'Test Grade',
    semester: 'Test Semester',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    viewCount: 0,
    downloadCount: 0,
    averageRating: 0,
    ratings: [],
    flashcards: [],
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com'
    },
    quarter: 'Test Quarter',
    topic: 'Test Topic'
  },
  {
    id: '2',
    title: 'Test Note 2',
    content: 'Test content 2',
    fileUrl: 'http://example.com/test2.pdf',
    fileType: 'application/pdf',
    subject: 'Test Subject',
    grade: 'Test Grade',
    semester: 'Test Semester',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    viewCount: 0,
    downloadCount: 0,
    averageRating: 0,
    ratings: [],
    flashcards: [],
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com'
    },
    quarter: 'Test Quarter',
    topic: 'Test Topic'
  }
];

const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  description: 'Test Description',
  content: 'Test Content',
  subject: 'Test Subject',
  grade: '10',
  semester: '1',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'application/pdf',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: { id: '1', username: 'testuser', email: 'test@example.com' }
};

const longNote: Note = {
  id: '2',
  title: 'Long Note',
  description: 'A very long note',
  content: 'Long content',
  subject: 'Test Subject',
  grade: '10',
  semester: '1',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'application/pdf',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: { id: '1', username: 'testuser', email: 'test@example.com' }
};

const imageNote: Note = {
  id: '3',
  title: 'Image Note',
  description: 'A note with an image',
  content: 'Image content',
  subject: 'Test Subject',
  grade: '10',
  semester: '1',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/image.jpg',
  fileType: 'image/jpeg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: { id: '1', username: 'testuser', email: 'test@example.com' }
};

const unknownNote: Note = {
  id: '4',
  title: 'Unknown Note',
  description: 'A note with unknown file type',
  content: 'Unknown content',
  subject: 'Test Subject',
  grade: '10',
  semester: '1',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/unknown.xyz',
  fileType: 'unknown',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: { id: '1', username: 'testuser', email: 'test@example.com' }
};

describe('NoteCard', () => {
  it('renders a standard note', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('renders a long note', () => {
    render(<NoteCard note={longNote} />);
    expect(screen.getByText('Long Note')).toBeInTheDocument();
  });

  it('renders an image note', () => {
    render(<NoteCard note={imageNote} />);
    expect(screen.getByText('Image Note')).toBeInTheDocument();
  });

  it('renders an unknown file type note', () => {
    render(<NoteCard note={unknownNote} />);
    expect(screen.getByText('Unknown Note')).toBeInTheDocument();
  });
}); 