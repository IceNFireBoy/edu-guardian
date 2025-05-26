import { NoteService } from '../../services/NoteService';
import User from '../../models/User';
import BadgeService from '../../services/BadgeService';
import { extractTextFromFile } from '../../utils/extractTextFromFile';
import { OPENAI_CHAT_MODEL } from '../../config/constants';
import mongoose from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import { mockUser } from '../factories/user.factory';
import { mockNote } from '../factories/note.factory';
import { QuotaExceededError, NotFoundError } from '../../utils/customErrors';
import OpenAI from 'openai';
import Note, { INote } from '../../models/Note';
import { AI_USAGE_LIMITS } from '../../config/aiConfig';

// Mock external functions
jest.mock('../../utils/extractTextFromFile', () => ({
  extractTextFromFile: jest.fn().mockImplementation(() => 'Extracted text content')
}));

jest.mock('../../services/BadgeService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkAndAwardBadges: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI-generated content' } }]
        })
      }
    }
  }));
});

describe('NoteService', () => {
  let testUser: any;
  let testNote: any;
  let noteService: NoteService;
  let mockBadgeService: jest.Mocked<typeof BadgeService>;

  beforeEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    
    const userDoc = new User(mockUser({
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      aiUsage: { summaryUsed: 0, flashcardUsed: 0, lastReset: new Date('2023-01-01T00:00:00.000Z') },
      streak: { current: 0, max: 0, lastUsed: new Date('2023-01-01T00:00:00.000Z') }
    }));
    testUser = await userDoc.save();

    const noteDoc = new Note(mockNote({ user: testUser._id, fileUrl: 'path/to/fake.pdf' }));
    testNote = await noteDoc.save();

    noteService = new NoteService();
    
    // Setup mock for extractTextFromFile
    (extractTextFromFile as jest.Mock).mockClear();
    (extractTextFromFile as jest.Mock).mockImplementation(() => Promise.resolve('Extracted text content'));
    
    // Setup badge service mock
    mockBadgeService = BadgeService as jest.Mocked<typeof BadgeService>;
    jest.spyOn(BadgeService.prototype, 'checkAndAwardBadges').mockResolvedValue([]);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    jest.clearAllMocks();
  });

  describe('getAllNotes', () => {
    it('should get all notes with pagination', async () => {
      const result = await noteService.getAllNotes({}, { page: 1, limit: 10 });
      expect(result.notes).toBeDefined();
      expect(result.count).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });

    it('should get all notes with filters', async () => {
      const result = await noteService.getAllNotes({ subject: 'Biology' }, {});
      expect(result.notes).toBeDefined();
      expect(result.count).toBeDefined();
    });

    it('should get all notes with complex filters', async () => {
      const result = await noteService.getAllNotes({
        subject: 'Biology',
        grade: '10th',
        semester: '1st',
        quarter: '1st',
        topic: 'Cell Biology'
      }, {});
      expect(result.notes).toBeDefined();
      expect(result.count).toBeDefined();
    });

    it('should get all notes with sorting', async () => {
      const resultAsc = await noteService.getAllNotes({}, {
        sortBy: 'title',
        sortOrder: 'asc'
      });
      expect(resultAsc.notes).toBeDefined();
      expect(resultAsc.count).toBeDefined();

      const resultDesc = await noteService.getAllNotes({}, {
        sortBy: 'title',
        sortOrder: 'desc'
      });
      expect(resultDesc.notes).toBeDefined();
      expect(resultDesc.count).toBeDefined();
    });
  });

  describe('getNoteById', () => {
    it('should get a note by id', async () => {
      const note = await noteService.getNoteById(testNote._id.toString());
      expect(note).toBeDefined();
      expect(note?._id.toString()).toBe(testNote._id.toString());
    });

    it('should return null for non-existent note', async () => {
      const note = await noteService.getNoteById('507f1f77bcf86cd799439011');
      expect(note).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      await expect(
        noteService.getNoteById(testNote._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'Test Note',
        subject: 'Biology',
        grade: '10th',
        semester: '1st',
        quarter: '1st',
        topic: 'Cell Biology',
        description: 'Test description',
        tags: ['test', 'biology'],
        isPublic: true
      };

      const note = await noteService.createNote(noteData, testUser._id.toString());
      expect(note).toBeDefined();
      expect(note.title).toBe(noteData.title);
      expect(note.subject).toBe(noteData.subject);
      expect(note.grade).toBe(noteData.grade);
      expect(note.semester).toBe(noteData.semester);
      expect(note.quarter).toBe(noteData.quarter);
      expect(note.topic).toBe(noteData.topic);
      expect(note.description).toBe(noteData.description);
      expect(note.tags).toEqual(noteData.tags);
      expect(note.isPublic).toBe(noteData.isPublic);
    });

    it('should throw error for invalid user id', async () => {
      const noteData = {
        title: 'Test Note',
        subject: 'Biology'
      };

      const note = await noteService.createNote(noteData, testUser._id.toString());
      expect(note).toBeDefined();
      expect(note.title).toBe(noteData.title);
      expect(note.subject).toBe(noteData.subject);
    });
  });

  describe('updateNote', () => {
    it('should update a note', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const updatedNote = await noteService.updateNote(
        testNote._id.toString(),
        updateData
      );
      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe(updateData.title);
      expect(updatedNote?.description).toBe(updateData.description);
    });

    it('should throw error for non-existent note', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await expect(
        noteService.updateNote(
          '507f1f77bcf86cd799439011',
          updateData
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid id', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await expect(
        noteService.updateNote(
          'invalid-id',
          updateData
        )
      ).rejects.toThrow();
    });

    it('should update only provided fields', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const updatedNote = await noteService.updateNote(
        testNote._id.toString(),
        updateData
      );
      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe(updateData.title);
      expect(updatedNote?.subject).toBe(testNote.subject);
    });

    it('should not update if no fields provided', async () => {
      const updateData = {};

      const updatedNote = await noteService.updateNote(
        testNote._id.toString(),
        updateData
      );
      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe(testNote.title);
      expect(updatedNote?.subject).toBe(testNote.subject);
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      const deletedNote = await noteService.deleteNote(
        testNote._id.toString()
      );
      expect(deletedNote).toBeDefined();
      expect(deletedNote?._id.toString()).toBe(testNote._id.toString());
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteService.deleteNote(
          '507f1f77bcf86cd799439011'
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid id', async () => {
      await expect(
        noteService.deleteNote(
          'invalid-id'
        )
      ).rejects.toThrow();
    });
  });

  describe('getUserNotes', () => {
    it('should get notes for a user', async () => {
      const userNotes = await noteService.getUserNotes(testUser._id.toString());
      expect(userNotes).toBeDefined();
      expect(Array.isArray(userNotes)).toBe(true);
      expect(userNotes.length).toBeGreaterThan(0);
      expect(userNotes[0].user.toString()).toBe(testUser._id.toString());
    });

    it('should return empty array for user with no notes', async () => {
      const emptyUser = await User.create({
        username: 'empty',
        email: 'empty@example.com',
        password: 'password123',
        name: 'Empty User'
      });

      const userNotes = await noteService.getUserNotes(emptyUser._id.toString());
      expect(userNotes).toBeDefined();
      expect(Array.isArray(userNotes)).toBe(true);
      expect(userNotes.length).toBe(0);
    });
  });

  describe('incrementDownloads', () => {
    it('should increment downloads for a note', async () => {
      const updatedNote = await noteService.incrementDownloads(
        testNote._id.toString(),
        testUser._id.toString()
      );
      expect(updatedNote).toBeDefined();
      expect(updatedNote?.downloads).toBe(testNote.downloads + 1);
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteService.incrementDownloads(
          '507f1f77bcf86cd799439011',
          testUser._id.toString()
        )
      ).rejects.toThrow();
    });
  });

  describe('createFlashcardForNote', () => {
    it('should create a flashcard for a note', async () => {
      const note = await noteService.createFlashcardForNote(
        testNote._id.toString(),
        testUser._id.toString(),
        'What is the capital of France?',
        'Paris'
      );
      expect(note).toBeDefined();
      expect(note?.flashcards).toBeDefined();
      expect(note?.flashcards.length).toBeGreaterThan(0);
      expect(note?.flashcards[0].question).toBe('What is the capital of France?');
      expect(note?.flashcards[0].answer).toBe('Paris');
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteService.createFlashcardForNote(
          '507f1f77bcf86cd799439011',
          testUser._id.toString(),
          'What is the capital of France?',
          'Paris'
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid user', async () => {
      await expect(
        noteService.createFlashcardForNote(
          testNote._id.toString(),
          '507f1f77bcf86cd799439011',
          'What is the capital of France?',
          'Paris'
        )
      ).rejects.toThrow();
    });
  });

  describe('generateAISummaryForNote', () => {
    it('should generate AI summary for a note', async () => {
      const result = await noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString());
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.aiSummary).toBeDefined();
      expect(result.newlyAwardedBadges).toBeDefined();
      expect(Array.isArray(result.newlyAwardedBadges)).toBe(true);
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error for invalid user', async () => {
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error for note without content', async () => {
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error for unauthorized user', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });
      
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), anotherUser._id.toString())
      ).rejects.toThrow('Not authorized to generate AI summary for this note');
    });
  });

  describe('generateAIFlashcardsForNote', () => {
    it('should generate AI flashcards for a note', async () => {
      const result = await noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString());
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.flashcards).toBeDefined();
      expect(Array.isArray(result.data.flashcards)).toBe(true);
      expect(result.newlyAwardedBadges).toBeDefined();
      expect(Array.isArray(result.newlyAwardedBadges)).toBe(true);
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error for invalid user', async () => {
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error for unauthorized user', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });
      
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), anotherUser._id.toString())
      ).rejects.toThrow('Not authorized to generate AI flashcards for this note');
    });
  });
}); 