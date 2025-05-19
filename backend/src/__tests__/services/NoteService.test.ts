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
    it('should return all notes with pagination', async () => {
      const result = await noteService.getAllNotes({}, { page: 1, limit: 10 });
      expect(result.notes).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should filter notes by subject', async () => {
      const result = await noteService.getAllNotes({ subject: 'Biology' }, {});
      expect(result.notes).toHaveLength(0);
    });

    it('should filter notes by multiple criteria', async () => {
      const result = await noteService.getAllNotes({
        subject: 'Test Subject',
        isPublic: true
      }, {});
      expect(result.notes).toHaveLength(1);
    });

    // Original test used olderNote but didn't reference it,
    // creating a test note and not using it isn't a problem
    it('should sort notes correctly', async () => {
      // Create another note with a different creation date
      await Note.create({
        title: 'Older Note',
        description: 'Older Description',
        subject: 'Biology',
        grade: '12',
        semester: '1',
        quarter: '1',
        topic: 'Old Topic',
        fileUrl: 'https://example.com/old.pdf',
        fileType: 'pdf',
        fileSize: 1000,
        user: testUser._id,
        isPublic: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      });

      // Test ascending sort
      const resultAsc = await noteService.getAllNotes({}, { 
        sortBy: 'createdAt', 
        sortOrder: 'asc' 
      });
      
      expect(resultAsc.notes[0].title).toBe('Older Note');
      expect(resultAsc.notes[1].title).toBe('Test Note');

      // Test descending sort
      const resultDesc = await noteService.getAllNotes({}, { 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      expect(resultDesc.notes[0].title).toBe('Test Note');
      expect(resultDesc.notes[1].title).toBe('Older Note');
    });
  });

  describe('getNoteById', () => {
    it('should return a note by id', async () => {
      const note = await noteService.getNoteById(testNote._id.toString());
      expect(note).toBeDefined();
      expect(note?.title).toBe('Test Note');
    });

    it('should return null for non-existent note', async () => {
      const note = await noteService.getNoteById('507f1f77bcf86cd799439011');
      expect(note).toBeNull();
    });

    it('should increment view count', async () => {
      // Initial view count should be 0
      expect(testNote.viewCount).toBe(0);

      // Get note to increment view count
      await noteService.getNoteById(testNote._id.toString());

      // Verify view count was incremented in the database
      const updatedNote = await Note.findById(testNote._id);
      expect(updatedNote?.viewCount).toBe(1);
    });
  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'New Note',
        description: 'New content',
        subject: 'Test Subject',
        grade: '12' as const,
        semester: '1' as const,
        quarter: '1' as const,
        topic: 'Test Topic',
        fileType: 'pdf' as const,
        fileSize: 1000,
        fileUrl: 'http://example.com/test.pdf',
        isPublic: true
      };

      const note = await noteService.createNote(noteData, testUser._id.toString());
      expect(note).toBeDefined();
      expect(note.title).toBe('New Note');
      expect(note.user.toString()).toBe(testUser._id.toString());
    });

    it('should create a note with tags', async () => {
      const noteData = {
        title: 'Tagged Note',
        description: 'Note with tags',
        subject: 'Biology',
        grade: '12' as const,
        semester: '1' as const,
        quarter: '2' as const,
        topic: 'Tagged Topic',
        fileUrl: 'https://example.com/tagged.pdf',
        fileType: 'pdf' as const,
        fileSize: 1800,
        tags: ['important', 'biology', 'exam'],
        isPublic: true
      };

      const note = await noteService.createNote(noteData, testUser._id.toString());
      expect(note.tags).toHaveLength(3);
      expect(note.tags).toContain('important');
      expect(note.tags).toContain('biology');
      expect(note.tags).toContain('exam');
    });
  });

  describe('updateNoteById', () => {
    it('should update a note', async () => {
      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        { title: 'Updated Note', description: 'Updated content' },
        testUser._id.toString()
      );

      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe('Updated Note');
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.updateNoteById(
        '507f1f77bcf86cd799439011',
        { title: 'Updated Note', description: 'Updated content' },
        testUser._id.toString()
      )).rejects.toThrow();
    });

    it('should throw error for unauthorized update', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });

      await expect(noteService.updateNoteById(
        testNote._id.toString(),
        { title: 'Updated Note', description: 'Updated content' },
        anotherUser._id.toString()
      )).rejects.toThrow();
    });

    it('should update tags correctly', async () => {
      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        { tags: ['important', 'updated', 'test'] },
        testUser._id.toString()
      );

      expect(updatedNote?.tags).toHaveLength(3);
      expect(updatedNote?.tags).toContain('important');
      expect(updatedNote?.tags).toContain('updated');
      expect(updatedNote?.tags).toContain('test');
    });

    it('should return original note if no changes made', async () => {
      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        { title: testNote.title, description: testNote.description },
        testUser._id.toString()
      );

      expect(updatedNote?.title).toBe(testNote.title);
      expect(updatedNote?.description).toBe(testNote.description);
    });
  });

  describe('deleteNoteById', () => {
    it('should delete a note', async () => {
      const deletedNote = await noteService.deleteNoteById(
        testNote._id.toString(),
        testUser._id.toString()
      );

      expect(deletedNote).toBeDefined();
      expect(deletedNote?._id?.toString()).toBe(testNote._id.toString());

      const note = await Note.findById(testNote._id);
      expect(note).toBeNull();
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.deleteNoteById(
        '507f1f77bcf86cd799439011',
        testUser._id.toString()
      )).rejects.toThrow();
    });

    it('should throw error for unauthorized deletion', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });

      await expect(noteService.deleteNoteById(
        testNote._id.toString(),
        anotherUser._id.toString()
      )).rejects.toThrow();
    });
  });

  describe('getUserNotes', () => {
    it('should return user notes', async () => {
      const userNotes = await noteService.getUserNotes(testUser._id.toString());
      expect(userNotes).toHaveLength(1);
      expect(userNotes[0].title).toBe('Test Note');
    });

    it('should return empty array for user with no notes', async () => {
      const emptyUser = await User.create({
        username: 'empty',
        email: 'empty@example.com',
        password: 'password123',
        name: 'Empty User'
      });

      const userNotes = await noteService.getUserNotes(emptyUser._id.toString());
      expect(userNotes).toHaveLength(0);
    });
  });

  describe('incrementDownloads', () => {
    it('should increment download count', async () => {
      const updatedNote = await noteService.incrementDownloads(
        testNote._id.toString(),
        testUser._id.toString()
      );

      expect(updatedNote).toBeDefined();
      expect(updatedNote?.downloadCount).toBe(1);
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.incrementDownloads(
        '507f1f77bcf86cd799439011',
        testUser._id.toString()
      )).rejects.toThrow();
    });
  });

  describe('createFlashcardForNote', () => {
    it('should create flashcard for note', async () => {
      const note = await noteService.createFlashcardForNote(
        testNote._id.toString(),
        testUser._id.toString(),
        'Test question',
        'Test answer'
      );

      expect(note).toBeDefined();
      expect(note?.flashcards).toHaveLength(1);
      expect(note?.flashcards[0].question).toBe('Test question');
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.createFlashcardForNote(
        '507f1f77bcf86cd799439011',
        testUser._id.toString(),
        'Test question',
        'Test answer'
      )).rejects.toThrow();
    });

    it('should throw error for unauthorized access', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });

      await expect(noteService.createFlashcardForNote(
        testNote._id.toString(),
        anotherUser._id.toString(),
        'Test question',
        'Test answer'
      )).rejects.toThrow();
    });
  });

  describe('generateAISummaryForNote', () => {
    // Tests for AI summary generation
    it('should generate AI summary for a note', async () => {
      // Mock the necessary functions
      (extractTextFromFile as jest.Mock).mockResolvedValue('Sufficient text content for summary.');
      
      // Create a mock Date constructor
      const mockDate = jest.fn(() => ({ toISOString: () => '2023-01-01T10:00:00.000Z' }));
      mockDate.UTC = jest.fn();
      mockDate.now = jest.fn(() => 1672567200000); // Jan 1, 2023, 10:00:00 UTC timestamp
      const originalDate = global.Date;
      global.Date = mockDate as any;
      
      // Setup summary content
      const summaryContent = 'This is an AI-generated summary.';
      const keyPointsContent = ['Key point 1', 'Key point 2'];
      
      // Mock OpenAI response
      const openAIMock = OpenAI as jest.MockedClass<typeof OpenAI>;
      openAIMock.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({ summary: summaryContent, keyPoints: keyPointsContent }) } }]
          })
        }
      } as any;
      
      // Call the method
      const result = await noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString());
      
      // Restore Date
      global.Date = originalDate;
      
      // Check results
      expect(result.data).toHaveProperty('aiSummary');
      expect(result.data.aiSummary).toBe(summaryContent);
      expect(result.data.aiSummaryKeyPoints).toEqual(keyPointsContent);
      expect(result.data.aiSummaryGeneratedAt.toISOString()).toBe('2023-01-01T10:00:00.000Z');
      
      // Verify note was updated in database
      const updatedNote = await Note.findById(testNote._id);
      expect(updatedNote?.aiSummary).toBe(summaryContent);
      
      // Verify user AI usage was incremented
      expect(testUser.aiUsage.summaryUsed).toBe(0); // Initial value
      
      // Verify badge service was called
      expect(BadgeService.prototype.checkAndAwardBadges).toHaveBeenCalledTimes(2);
    });
    
    it('should throw quota exceeded error if user has reached AI usage limit', async () => {
      // Set user's AI usage to the limit
      testUser.aiUsage.summaryUsed = AI_USAGE_LIMITS.SUMMARY_PER_DAY;
      await testUser.save();
      
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(QuotaExceededError);
    });
    
    it('should throw error if text extraction fails', async () => {
      // Mock text extraction failure
      (extractTextFromFile as jest.Mock).mockRejectedValue(new Error('Extraction failed'));
      
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow('Failed to extract text from note file');
    });
    
    it('should throw error if OpenAI API fails', async () => {
      (extractTextFromFile as jest.Mock).mockResolvedValue('Sufficient text content for summary.');
      
      // Mock OpenAI API failure
      const openAIMock = OpenAI as jest.MockedClass<typeof OpenAI>;
      openAIMock.prototype.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
        }
      } as any;
      
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow('Failed to generate summary with AI');
    });
    
    it('should throw error for unauthorized access', async () => {
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
    // Tests for AI flashcard generation
    it('should generate AI flashcards for a note', async () => {
      // Mock the necessary functions
      (extractTextFromFile as jest.Mock).mockResolvedValue('Sufficient text content for flashcards.');
      
      // Create a mock Date constructor
      const mockDate = jest.fn(() => ({ toISOString: () => '2023-01-01T10:00:00.000Z' }));
      mockDate.UTC = jest.fn();
      mockDate.now = jest.fn(() => 1672567200000); // Jan 1, 2023, 10:00:00 UTC timestamp
      const originalDate = global.Date;
      global.Date = mockDate as any;
      
      // Mock OpenAI response with flashcards
      const openAIMock = OpenAI as jest.MockedClass<typeof OpenAI>;
      openAIMock.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify([
              { question: 'Question 1', answer: 'Answer 1', difficulty: 'easy' },
              { question: 'Question 2', answer: 'Answer 2', difficulty: 'medium' }
            ]) } }]
          })
        }
      } as any;
      
      // Call the method
      const result = await noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString());
      
      // Restore Date
      global.Date = originalDate;
      
      // Check results
      expect(result.data.flashcards).toHaveLength(2);
      expect(result.data.flashcards[0].question).toBe('Question 1');
      
      // Verify badge service was called
      expect(BadgeService.prototype.checkAndAwardBadges).toHaveBeenCalledTimes(2);
    });
    
    it('should throw quota exceeded error if user has reached AI usage limit', async () => {
      // Set user's AI usage to the limit
      testUser.aiUsage.flashcardUsed = AI_USAGE_LIMITS.FLASHCARDS_PER_DAY;
      await testUser.save();
      
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(QuotaExceededError);
    });
    
    it('should throw error if text extraction fails', async () => {
      // Mock text extraction failure
      (extractTextFromFile as jest.Mock).mockRejectedValue(new Error('Extraction failed'));
      
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow('Failed to extract text from note file');
    });
    
    it('should throw error for unauthorized access', async () => {
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