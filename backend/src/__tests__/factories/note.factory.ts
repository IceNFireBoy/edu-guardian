import mongoose from 'mongoose';
import { INote, INoteRating, INoteFlashcard } from '../../models/Note'; // Adjust path as necessary
import { IUser } from '../../models/User'; // Adjust path as necessary
import { mockUser } from './user.factory'; // Assuming user factory exists

const createObjectId = () => new mongoose.Types.ObjectId().toString();

export const mockNoteRating = (overrides?: Partial<INoteRating>): INoteRating => {
  const defaultRating: INoteRating = {
    _id: createObjectId(),
    value: 5,
    user: createObjectId() as any, // or mockUser()._id
    // Document properties
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this),
    toJSON: jest.fn().mockReturnValue(this),
  } as any;
  return { ...defaultRating, ...overrides } as INoteRating;
};

export const mockNoteFlashcard = (overrides?: Partial<INoteFlashcard>): INoteFlashcard => {
  const defaultFlashcard: INoteFlashcard = {
    _id: createObjectId(),
    question: 'What is the capital of France?',
    answer: 'Paris',
    difficulty: 'easy',
    // Document properties
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this),
    toJSON: jest.fn().mockReturnValue(this),
  } as any;
  return { ...defaultFlashcard, ...overrides } as INoteFlashcard;
};

export const mockNote = (overrides?: Partial<INote>): INote => {
  const defaultNote: INote = {
    _id: createObjectId(),
    title: 'Test Note Title',
    slug: 'test-note-title',
    description: 'A comprehensive test note.',
    fileUrl: 'https://example.com/test-note.pdf',
    fileType: 'pdf',
    fileSize: 1024 * 1024, // 1MB
    subject: 'Computer Science',
    grade: '12',
    semester: '1',
    quarter: '1',
    topic: 'Testing',
    publicId: 'cloudinary_public_id',
    assetId: 'cloudinary_asset_id',
    tags: ['test', 'jest'],
    viewCount: 100,
    downloadCount: 50,
    ratings: [mockNoteRating()] as INoteRating[],
    averageRating: 5,
    aiSummary: 'This is an AI generated summary of the test note.',
    aiSummaryGeneratedAt: new Date(),
    aiSummaryKeyPoints: ['Key point 1', 'Key point 2'],
    flashcards: [mockNoteFlashcard()] as INoteFlashcard[],
    user: mockUser()._id as any, // Store user ID, can be populated object too
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // IUser Method Stubs
    getAverageRating: jest.fn(function(this: INote) {
      if (!this.ratings || this.ratings.length === 0) return 0;
      const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
      return sum / this.ratings.length;
    }),
    // Document properties
    id: '', // will be set below
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this),
    toJSON: jest.fn().mockReturnValue(this),
    isModified: jest.fn().mockReturnValue(false),
  } as any;

  const mergedNote = { ...defaultNote, ...overrides };
  mergedNote.id = mergedNote._id.toString();

  // If user is provided as a full object, use its _id
  if (overrides?.user && typeof overrides.user === 'object' && '_id' in overrides.user) {
    mergedNote.user = (overrides.user as IUser)._id as any;
  }

  return mergedNote as INote;
}; 