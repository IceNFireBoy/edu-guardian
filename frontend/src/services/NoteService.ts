import { Note } from '../models/Note';
import { User } from '../models/User';
import { INote } from '../types/note';
import { IUser } from '../types/user';
import { Types } from 'mongoose';
import BadgeService from './BadgeService';

class NoteService {
  async getAllNotes(query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find(query).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNoteById(id: string): Promise<INote | null> {
    const note = await Note.findById(id).populate('user', 'name username');
    return note ? note.toObject() : null;
  }

  async createNote(noteData: Partial<INote>): Promise<INote> {
    const note = new Note(noteData);
    const savedNote = await note.save();
    return savedNote.toObject();
  }

  async updateNote(id: string, noteData: Partial<INote>): Promise<INote | null> {
    const note = await Note.findByIdAndUpdate(id, noteData, { new: true });
    return note ? note.toObject() : null;
  }

  async deleteNote(id: string): Promise<INote | null> {
    const note = await Note.findByIdAndDelete(id);
    return note ? note.toObject() : null;
  }

  async getNotesBySubject(subject: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ subject, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNotesByGrade(grade: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ grade, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNotesBySemester(semester: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ semester, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNotesByQuarter(quarter: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ quarter, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNotesByTopic(topic: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ topic, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getPublicNotes(query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ isPublic: true, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async getNotesByUser(userId: string, query: Partial<INote>): Promise<INote[]> {
    const notes = await Note.find({ user: userId, ...query }).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async incrementViewCount(noteId: string): Promise<INote | null> {
    const note = await Note.findByIdAndUpdate(noteId, { $inc: { viewCount: 1 } }, { new: true });
    return note ? note.toObject() : null;
  }

  async updateRating(noteId: string, rating: number): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    const newRatingCount = note.ratingCount + 1;
    const newRating = ((note.rating * note.ratingCount) + rating) / newRatingCount;

    const updatedNote = await Note.findByIdAndUpdate(noteId, {
      rating: newRating,
      ratingCount: newRatingCount
    }, { new: true });
    
    return updatedNote ? updatedNote.toObject() : null;
  }

  async searchNotes(searchQuery: string, filters: Partial<INote>): Promise<INote[]> {
    const query = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { topic: { $regex: searchQuery, $options: 'i' } }
      ],
      ...filters
    };

    const notes = await Note.find(query).populate('user', 'name username');
    return notes.map(note => note.toObject());
  }

  async generateAISummary(noteId: string): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // TODO: Implement AI summary generation
    const summary = 'AI generated summary';
    note.aiSummary = summary;
    const savedNote = await note.save();
    return savedNote.toObject();
  }

  async generateFlashcards(noteId: string): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // TODO: Implement flashcard generation
    const flashcards = [
      {
        question: 'Sample question',
        answer: 'Sample answer',
        difficulty: 'medium'
      }
    ];

    note.flashcards = flashcards;
    const savedNote = await note.save();
    return savedNote.toObject();
  }
}

export default new NoteService(); 