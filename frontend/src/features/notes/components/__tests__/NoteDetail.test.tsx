import { Note } from '../../noteTypes';

const mockNotesDetail: Note[] = [
  {
    id: '1',
    title: 'Test Note 1',
    content: 'Test content 1',
    fileUrl: 'http://example.com/test1.pdf',
    fileType: 'application/pdf',
    subject: 'Test Subject',
    grade: 'Test Grade',
    semester: 'Test Semester',
    quarter: 'Test Quarter',
    topic: 'Test Topic',
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
    }
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
    quarter: 'Test Quarter',
    topic: 'Test Topic',
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
    }
  }
]; 