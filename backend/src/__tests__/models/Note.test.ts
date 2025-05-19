import mongoose from 'mongoose';
import Note from '../../models/Note';
import { mockNote, mockNoteRating, mockNoteFlashcard } from '../factories/note.factory';

describe('Note Model Test', () => {
  beforeAll(async () => {
    // Connection is handled by setup.ts
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  afterAll(async () => {
    // Disconnection is handled by setup.ts
  });

  it('should create & save note successfully', async () => {
    const validNote = mockNote();
    const savedNote = await Note.create(validNote);
    
    expect(savedNote._id).toBeDefined();
    expect(savedNote.title).toBe(validNote.title);
    expect(savedNote.subject).toBe(validNote.subject);
    expect(savedNote.grade).toBe(validNote.grade);
  });

  it('should fail to save note without required fields', async () => {
    const noteWithoutTitle = mockNote({ title: undefined });
    let err: any;
    
    try {
      await Note.create(noteWithoutTitle);
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should update note ratings', async () => {
    const note = await Note.create(mockNote());
    const rating = mockNoteRating();
    note.ratings.push(rating as any);
    const updatedNote = await note.save();
    expect(updatedNote?.ratings).toHaveLength(1);
    expect(updatedNote?.ratings[0].value).toBe(rating.value);
  });

  it('should update note downloads', async () => {
    const note = await Note.create(mockNote());
    note.downloadCount = 5;
    const updatedNote = await note.save();
    expect(updatedNote?.downloadCount).toBe(5);
  });

  it('should update note flashcards', async () => {
    const note = await Note.create(mockNote());
    const flashcard = mockNoteFlashcard();
    note.flashcards.push(flashcard as any);
    const updatedNote = await note.save();
    expect(updatedNote?.flashcards).toHaveLength(1);
    expect(updatedNote?.flashcards[0].question).toBe(flashcard.question);
  });

  it('should update AI summary', async () => {
    const note = await Note.create(mockNote());
    note.aiSummary = 'Updated AI summary';
    note.aiSummaryGeneratedAt = new Date();
    const updatedNote = await note.save();
    expect(updatedNote?.aiSummary).toBe('Updated AI summary');
    expect(updatedNote?.aiSummaryGeneratedAt).toBeDefined();
  });
}); 