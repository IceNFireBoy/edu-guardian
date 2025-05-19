import { INote, INoteRating, INoteFlashcard } from '../../models/Note';
import Note from '../../models/Note';
import mongoose from 'mongoose';

export const mockNote = (overrides: Partial<INote> = {}): Partial<INote> => ({
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Note',
  slug: 'test-note',
  description: 'Test note description',
  fileUrl: 'test-file.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  subject: 'Biology',
  grade: '11',
  semester: '1',
  quarter: '1',
  topic: 'Test Topic',
  tags: ['test', 'biology'],
  viewCount: 0,
  downloadCount: 0,
  ratings: [],
  averageRating: 0,
  aiSummary: '',
  aiSummaryGeneratedAt: new Date(),
  aiSummaryKeyPoints: [],
  flashcards: [],
  user: new mongoose.Types.ObjectId(),
  isPublic: true,
  publicId: '',
  assetId: '',
  ...overrides
});

export const mockNoteRating = (overrides: Partial<INoteRating> = {}): Partial<INoteRating> => ({
  _id: new mongoose.Types.ObjectId(),
  value: 5,
  user: new mongoose.Types.ObjectId(),
  ...overrides
});

export const mockNoteFlashcard = (overrides: Partial<INoteFlashcard> = {}): Partial<INoteFlashcard> => ({
  _id: new mongoose.Types.ObjectId(),
  question: 'Test question?',
  answer: 'Test answer',
  difficulty: 'medium',
  ...overrides
});

export const mockTestNote = async (overrides: Partial<INote> = {}): Promise<INote> => {
  const noteData = mockNote(overrides);
  const note = new Note(noteData);
  return note.save();
}; 