import { NoteService } from '../../services/NoteService';
import { INote } from '../../models/Note';
import { User } from '../../models/User';
import { BadgeService } from '../../services/BadgeService';
import { extractTextFromFile } from '../../utils/extractTextFromFile';
import { OPENAI_CHAT_MODEL } from '../../config/constants';
import mongoose from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import UserService from '../../services/UserService';
import { mockUser } from '../../../factories/user.factory';
import { mockNote } from '../../../factories/note.factory';
import { mockBadge } from '../../../factories/badge.factory';
import { QuotaExceededError, NotFoundError } from '../../utils/customErrors';
import OpenAI from 'openai';
import Note from '../models/Note';

// Mock external functions
jest.mock('../../utils/extractTextFromFile', () => ({
  extractTextFromFile: jest.fn().mockImplementation(() => 'Extracted text content')
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

  beforeEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    
    const userDoc = new User(mockUser({
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      aiUsage: { summaryUsed: 0, flashcardUsed: 0, lastReset: new Date('2023-01-01T00:00:00.000Z') },
      streak: { current: 0, max: 0, lastUsed: new Date('2023-01-01T00:00:00.000Z') }
    }));
    testUser = await userDoc.save() as any;

    const noteDoc = new Note(mockNote({ user: testUser._id, fileUrl: 'path/to/fake.pdf' }));
    testNote = await noteDoc.save() as any;

    noteService = new NoteService();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    jest.clearAllMocks();
  });

  describe('getAllNotes', () => {
    it('should return all notes with pagination', async () => {
      const result = await noteService.getAllNotes({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter notes by subject', async () => {
      const result = await noteService.getAllNotes({ subject: 'Biology' }, {});
      expect(result.data).toHaveLength(0);
    });

    it('should filter notes by multiple criteria', async () => {
      const result = await noteService.getAllNotes({
        subject: 'Test Subject',
        isPublic: true
      }, {});
      expect(result.data).toHaveLength(1);
    });

    it('should sort notes correctly', async () => {
      // Create another note with a different creation date
      const olderNote = await Note.create({
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
      
      expect(resultAsc.data[0].title).toBe('Older Note');
      expect(resultAsc.data[1].title).toBe('Test Note');

      // Test descending sort
      const resultDesc = await noteService.getAllNotes({}, { 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      expect(resultDesc.data[0].title).toBe('Test Note');
      expect(resultDesc.data[1].title).toBe('Older Note');
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
        content: 'New content',
        subject: 'New Subject',
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
        content: 'Note with tags',
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
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content'
      };

      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        updateData,
        testUser._id.toString()
      );

      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe('Updated Note');
    });

    it('should throw error for non-existent note', async () => {
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content'
      };

      await expect(noteService.updateNoteById(
        '507f1f77bcf86cd799439011',
        updateData,
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

      const updateData = {
        title: 'Updated Note',
        content: 'Updated content'
      };

      await expect(noteService.updateNoteById(
        testNote._id.toString(),
        updateData,
        anotherUser._id.toString()
      )).rejects.toThrow();
    });

    it('should update tags correctly', async () => {
      const updateData = {
        tags: ['important', 'updated', 'test']
      };

      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        updateData,
        testUser._id.toString()
      );

      expect(updatedNote?.tags).toHaveLength(3);
      expect(updatedNote?.tags).toContain('important');
      expect(updatedNote?.tags).toContain('updated');
      expect(updatedNote?.tags).toContain('test');
    });

    it('should return original note if no changes made', async () => {
      const updateData = {
        title: testNote.title, // Same as original
        content: testNote.content // Same as original
      };

      const updatedNote = await noteService.updateNoteById(
        testNote._id.toString(),
        updateData,
        testUser._id.toString()
      );

      expect(updatedNote?.title).toBe(testNote.title);
      expect(updatedNote?.content).toBe(testNote.content);
    });
  });

  describe('deleteNoteById', () => {
    it('should delete a note', async () => {
      const deletedNote = await noteService.deleteNoteById(
        testNote._id.toString(),
        testUser._id.toString()
      );

      expect(deletedNote).toBeDefined();
      expect(deletedNote?._id.toString()).toBe(testNote._id.toString());

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

  describe('getMyNotes', () => {
    it('should return user notes', async () => {
      const myNotes = await noteService.getMyNotes(testUser._id.toString());
      expect(myNotes).toHaveLength(1);
      expect(myNotes[0].title).toBe('Test Note');
    });
  });

  describe('getTopRatedNotes', () => {
    it('should return top rated notes', async () => {
      const topNotes = await noteService.getTopRatedNotes(2);
      expect(topNotes).toHaveLength(1);
    });

    it('should return limited number of notes', async () => {
      const topNotes = await noteService.getTopRatedNotes(3);
      expect(topNotes.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getNotesBySubject', () => {
    it('should return notes by subject', async () => {
      const biologyNotes = await noteService.getNotesBySubject('Biology');
      expect(biologyNotes).toHaveLength(0);
    });

    it('should return empty array for non-existent subject', async () => {
      const physicsNotes = await noteService.getNotesBySubject('Physics');
      expect(physicsNotes).toHaveLength(0);
    });

    it('should return notes with matching subject', async () => {
      const biologyNotes = await noteService.getNotesBySubject('Test Subject');
      expect(biologyNotes).toHaveLength(1);
      expect(biologyNotes[0].subject).toBe('Test Subject');
    });
  });

  describe('searchNotes', () => {
    it('should return notes matching search query', async () => {
      const results = await noteService.searchNotes('quantum');
      expect(results).toHaveLength(0);
    });

    it('should return notes with partial matches', async () => {
      const results = await noteService.searchNotes('Test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Note');
    });
  });

  describe('rateNote', () => {
    it('should rate a note', async () => {
      const ratedNote = await noteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        5
      );

      expect(ratedNote).toBeDefined();
      expect(ratedNote?.ratings).toHaveLength(1);
      expect(ratedNote?.ratings[0].rating).toBe(5);
    });

    it('should throw error for invalid rating', async () => {
      await expect(noteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        6
      )).rejects.toThrow();
    });

    it('should update existing rating', async () => {
      const ratedNote = await noteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        4
      );

      expect(ratedNote).toBeDefined();
      expect(ratedNote?.ratings).toHaveLength(1);
      expect(ratedNote?.ratings[0].rating).toBe(4);
    });

    it('should throw error for rating own note', async () => {
      await expect(noteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        5
      )).rejects.toThrow();
    });
  });

  describe('incrementDownloads', () => {
    it('should increment download count', async () => {
      const updatedNote = await noteService.incrementDownloads(
        testNote._id.toString()
      );

      expect(updatedNote).toBeDefined();
      expect(updatedNote?.downloads).toBe(1);
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.incrementDownloads(
        '507f1f77bcf86cd799439011'
      )).rejects.toThrow();
    });
  });

  describe('createFlashcardForNote', () => {
    it('should create flashcard for note', async () => {
      const note = await noteService.createFlashcardForNote(
        testNote._id.toString(),
        testUser._id.toString(),
        {
          question: 'Test question',
          answer: 'Test answer'
        }
      );

      expect(note).toBeDefined();
      expect(note?.flashcards).toHaveLength(1);
      expect(note?.flashcards[0].question).toBe('Test question');
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.createFlashcardForNote(
        '507f1f77bcf86cd799439011',
        testUser._id.toString(),
        {
          question: 'Test question',
          answer: 'Test answer'
        }
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
        {
          question: 'Test question',
          answer: 'Test answer'
        }
      )).rejects.toThrow();
    });
  });

  describe('addFlashcardsToNote', () => {
    it('should add flashcards to note', async () => {
      const note = await noteService.addFlashcardsToNote(
        testNote._id.toString(),
        testUser._id.toString(),
        [
          {
            question: 'Question 1',
            answer: 'Answer 1'
          },
          {
            question: 'Question 2',
            answer: 'Answer 2'
          }
        ]
      );

      expect(note).toBeDefined();
      expect(note?.flashcards).toHaveLength(2);
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteService.addFlashcardsToNote(
        '507f1f77bcf86cd799439011',
        testUser._id.toString(),
        [
          {
            question: 'Question 1',
            answer: 'Answer 1'
          }
        ]
      )).rejects.toThrow();
    });

    it('should throw error for unauthorized access', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User'
      });

      await expect(noteService.addFlashcardsToNote(
        testNote._id.toString(),
        anotherUser._id.toString(),
        [
          {
            question: 'Question 1',
            answer: 'Answer 1'
          }
        ]
      )).rejects.toThrow();
    });
  });

  describe('generateAISummaryForNote', () => {
    const summaryContent = 'This is a mock AI summary.';
    const keyPointsContent = ['Point 1', 'Point 2'];

    beforeEach(() => {
      extractTextFromFile.mockResolvedValue('Sufficient text content for summary.');
      (OpenAI as any)._setChatCompletionsCreateResponse?.({
        choices: [{
          message: { content: JSON.stringify({ summary: summaryContent, keyPoints: keyPointsContent }) }
        }]
      });
    });

    it('should generate and save AI summary for a note successfully', async () => {
      const mockDate = jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00.000Z'));
      global.Date = mockDate;
      const result = await noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString());

      expect(result.data.aiSummary?.content).toBe(summaryContent);
      expect(result.data.aiSummary?.keyPoints).toEqual(keyPointsContent);
      expect(result.data.aiSummary?.modelUsed).toBe(OPENAI_CHAT_MODEL);
      expect(result.data.aiSummary?.generatedAt.toISOString()).toBe('2023-01-01T10:00:00.000Z');
      
      const updatedNote = await Note.findById(testNote._id);
      expect(updatedNote?.aiSummary?.content).toBe(summaryContent);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.aiUsage.summaryUsed).toBe(1);
      expect(updatedUser?.totalSummariesGenerated).toBe(1);
      expect(updatedUser?.streak.current).toBe(1);
      expect(BadgeService.checkAndAwardBadges).toHaveBeenCalledTimes(2);
    });

    it('should throw QuotaExceededError if user has no summary quota left', async () => {
      testUser.aiUsage.summaryUsed = AI_USAGE_LIMITS.SUMMARY_PER_DAY;
      await testUser.save();
      
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should throw ErrorResponse if text extraction fails', async () => {
      extractTextFromFile.mockRejectedValue(new Error('Extraction failed'));
      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });

    it('should throw ErrorResponse if OpenAI call fails', async () => {
      (OpenAI as any)._setChatCompletionsCreateResponse?.(new Error('OpenAI API Error'));
      (OpenAI as any)._setChatCompletionsCreateResponse?.mockRejectedValueOnce(new Error('OpenAI API Error'));

      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });

    it('should throw ErrorResponse if note not found', async () => {
      await expect(
        noteService.generateAISummaryForNote(new mongoose.Types.ObjectId().toString(), testUser._id.toString())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ErrorResponse if user is not authorized (not owner of private note)', async () => {
      const anotherUserDoc = new User(mockUser({ email: 'another@example.com', username: 'anotheruser'}));
      const anotherUser = await anotherUserDoc.save();
      testNote.isPublic = false;
      await testNote.save();

      await expect(
        noteService.generateAISummaryForNote(testNote._id.toString(), anotherUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });
  });

  describe('generateAIFlashcardsForNote', () => {
    const flashcardsContent = [{ question: 'Q1', answer: 'A1', difficulty: 'easy' }];

    beforeEach(() => {
      extractTextFromFile.mockResolvedValue('Sufficient text content for flashcards.');
      (OpenAI as any)._setChatCompletionsCreateResponse?.({
        choices: [{ message: { content: JSON.stringify(flashcardsContent) } }]
      });
    });

    it('should generate and save AI flashcards for a note successfully', async () => {
      const mockDate = jest.fn().mockReturnValue(new Date('2023-01-01T11:00:00.000Z'));
      global.Date = mockDate;
      const result = await noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString());

      expect(result.data.flashcards).toEqual(flashcardsContent);
      
      const updatedNote = await Note.findById(testNote._id);
      expect(updatedNote?.flashcards.length).toBe(flashcardsContent.length);
      expect(updatedNote?.flashcards[0].question).toBe(flashcardsContent[0].question);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.aiUsage.flashcardUsed).toBe(1);
      expect(updatedUser?.totalFlashcardsGenerated).toBe(1);
      expect(updatedUser?.streak.current).toBe(1);
      expect(BadgeService.checkAndAwardBadges).toHaveBeenCalledTimes(2);
    });

    it('should throw QuotaExceededError if user has no flashcard quota left', async () => {
      testUser.aiUsage.flashcardUsed = AI_USAGE_LIMITS.FLASHCARDS_PER_DAY;
      await testUser.save();
      
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should throw ErrorResponse if text extraction fails', async () => {
      extractTextFromFile.mockRejectedValue(new Error('Extraction failed'));
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });

    it('should throw ErrorResponse if OpenAI call fails', async () => {
      (OpenAI as any)._setChatCompletionsCreateResponse?.(new Error('OpenAI API Error'));
      (OpenAI as any)._setChatCompletionsCreateResponse?.mockRejectedValueOnce(new Error('OpenAI API Error'));
      
      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), testUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });

    it('should throw ErrorResponse if note not found', async () => {
      await expect(
        noteService.generateAIFlashcardsForNote(new mongoose.Types.ObjectId().toString(), testUser._id.toString())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ErrorResponse if user is not authorized (not owner of private note)', async () => {
      const anotherUserDoc = new User(mockUser({ email: 'another@example.com', username: 'anotheruser'}));
      const anotherUser = await anotherUserDoc.save();
      testNote.isPublic = false;
      await testNote.save();

      await expect(
        noteService.generateAIFlashcardsForNote(testNote._id.toString(), anotherUser._id.toString())
      ).rejects.toThrow(ErrorResponse);
    });
  });

  describe('uploadNoteFile', () => {
    it('should upload file for a note', async () => {
      const mockFile: any = {
        fieldname: 'document',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 12345,
        destination: '/tmp/uploads',
        filename: 'test-123456.pdf',
        path: '/tmp/uploads/test-123456.pdf',
        buffer: Buffer.from('test file content')
      };

      const result = await noteService.uploadNoteFile(
        testNote._id.toString(),
        testUser._id.toString(),
        mockFile
      );

      expect(result).toBeDefined();
      expect(result?.fileUrl).toContain('test-123456.pdf');
      expect(result?.fileType).toBe('pdf');
      expect(result?.fileSize).toBe(12345);
    });

    it('should throw error when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const mockFile: any = {
        fieldname: 'document',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        filename: 'test-123456.pdf'
      };
      
      await expect(
        noteService.uploadNoteFile(
          nonExistentId,
          testUser._id.toString(),
          mockFile
        )
      ).rejects.toThrow('Note not found');
    });

    it('should throw error when user is not authorized', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as any;

      const mockFile: any = {
        fieldname: 'document',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        filename: 'test-123456.pdf'
      };

      await expect(
        noteService.uploadNoteFile(
          testNote._id.toString(),
          otherUser._id.toString(),
          mockFile
        )
      ).rejects.toThrow('User not authorized');
    });
  });

  describe('getNotesByFilters', () => {
    it('should return notes based on filters object', async () => {
      // Create additional notes with different properties
      await Note.create({
        title: 'Physics Grade 12',
        description: 'Physics notes for grade 12',
        subject: 'Physics',
        grade: '12',
        semester: '1',
        quarter: '2',
        topic: 'Mechanics',
        fileUrl: 'https://example.com/physics.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: testUser._id,
        isPublic: true
      });

      await Note.create({
        title: 'Chemistry Grade 11',
        description: 'Chemistry notes for grade 11',
        subject: 'Chemistry',
        grade: '11',
        semester: '2',
        quarter: '3',
        topic: 'Organic Chemistry',
        fileUrl: 'https://example.com/chemistry.pdf',
        fileType: 'pdf',
        fileSize: 1800,
        user: testUser._id,
        isPublic: true
      });

      // Test with JSON string filters
      const stringFilters = JSON.stringify({
        subject: 'Physics',
        grade: '12'
      });
      
      const result1 = await noteService.getNotesByFilters(stringFilters);
      expect(result1).toHaveLength(1);
      expect(result1[0].title).toBe('Physics Grade 12');

      // Test with object filters
      const objectFilters = {
        grade: '11'
      };
      
      const result2 = await noteService.getNotesByFilters(objectFilters);
      expect(result2).toHaveLength(1);
      expect(result2[0].title).toBe('Chemistry Grade 11');
    });

    it('should only return public notes regardless of filters', async () => {
      // Create a private note
      await Note.create({
        title: 'Private Physics Notes',
        description: 'Physics notes that are private',
        subject: 'Physics',
        grade: '12',
        semester: '1',
        quarter: '1',
        topic: 'Quantum Physics',
        fileUrl: 'https://example.com/private.pdf',
        fileType: 'pdf',
        fileSize: 2000,
        user: testUser._id,
        isPublic: false
      });

      const filters = {
        subject: 'Physics'
      };
      
      const result = await noteService.getNotesByFilters(filters);
      
      // Should only include public Physics notes
      expect(result.every(note => note.isPublic)).toBe(true);
      expect(result.filter(note => note.title === 'Private Physics Notes')).toHaveLength(0);
    });

    it('should throw error with invalid filters format', async () => {
      const invalidFilters = '{subject: invalid json';
      
      await expect(
        noteService.getNotesByFilters(invalidFilters)
      ).rejects.toThrow('Invalid filters format');
    });
  });
}); 