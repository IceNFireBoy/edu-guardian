// NOTE: This file is a factory, not a test suite. It should not be picked up by Jest.
// All code commented out to prevent Jest from running it as a test suite.
// (No test or describe blocks should be present)
import mongoose from 'mongoose';
// import { INote, INoteRating, INoteFlashcard } from '../../models/Note';

const createObjectId = () => new mongoose.Types.ObjectId();

/**
 * @param {Partial<INoteRating>} [overrides]
 * @returns {INoteRating}
 */
export const mockNoteRating = (overrides = {}) => ({
  value: 5,
  user: createObjectId(),
  ...overrides
});

/**
 * @param {Partial<INoteFlashcard>} [overrides]
 * @returns {INoteFlashcard}
 */
export const mockNoteFlashcard = (overrides = {}) => ({
  question: 'What is the capital of France?',
  answer: 'Paris',
  difficulty: 'easy',
  ...overrides
});

/**
 * @param {Partial<INote>} [overrides]
 * @returns {Partial<INote>}
 */
export const mockNote = (overrides = {}) => {
  const defaultNote = {
    title: 'Mock Note',
    slug: 'mock-note',
    description: 'A mock note for testing',
    fileUrl: 'https://example.com/mock.pdf',
    fileType: 'pdf',
    fileSize: 12345,
    subject: 'Biology',
    grade: '12',
    semester: '1',
    quarter: '1',
    topic: 'Algebra',
    publicId: 'mock-public-id',
    assetId: 'mock-asset-id',
    isPublic: true,
    ratings: [mockNoteRating(), mockNoteRating({ value: 4 }), mockNoteRating({ value: 3 })],
    averageRating: 4,
    aiSummary: '',
    aiSummaryGeneratedAt: new Date(),
    aiSummaryKeyPoints: [],
    flashcards: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    user: createObjectId()
  };
  return { ...defaultNote, ...overrides };
};

/**
 * @param {Partial<INote>} [overrides]
 * @returns {Promise<INote & {_id: mongoose.Types.ObjectId}>}
 */
export const createTestNote = async (overrides = {}) => {
  const Note = mongoose.model('Note');
  const note = new Note({
    ...mockNote(),
    ...overrides
  });
  await note.save();
  return note;
}; 