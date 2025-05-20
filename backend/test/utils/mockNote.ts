import mongoose from 'mongoose';

export const mockNoteRating = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
  value: 5,
  comment: 'Great note!',
  createdAt: new Date(),
  ...overrides
});

export const mockNoteFlashcard = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  question: 'Test question?',
  answer: 'Test answer',
  ...overrides
});

export const mockNote = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Note',
  description: 'Test note description',
  subject: 'mathematics',
  grade: '9',
  semester: 'spring',
  quarter: 'q2',
  topics: ['algebra', 'equations'],
  user: new mongoose.Types.ObjectId(),
  fileUrl: 'https://example.com/test.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  isPublic: true,
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  downloadCount: 0,
  aiSummary: '',
  flashcards: [],
  ratings: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockNoteData = (overrides = {}) => ({
  title: 'Test Note',
  description: 'Test note description',
  subject: 'mathematics',
  grade: '9',
  semester: 'spring',
  quarter: 'q2',
  topics: ['algebra', 'equations'],
  user: new mongoose.Types.ObjectId(),
  isPublic: true,
  ...overrides
}); 