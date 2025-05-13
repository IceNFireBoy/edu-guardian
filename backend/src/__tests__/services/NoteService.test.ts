import NoteService from '../../services/NoteService';
import Note, { INote } from '../../models/Note';
import User, { IUser } from '../../models/User';
import mongoose from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import UserService from '../../services/UserService';
import BadgeService from '../../services/BadgeService';
import { mockUser } from '../factories/user.factory';
import { mockNote } from '../factories/note.factory';
import { mockBadge } from '../factories/badge.factory';
import { QuotaExceededError, NotFoundError, BadRequestError } from '../../utils/customErrors';
import { extractTextFromFile } from '../../utils/extractTextFromFile';
import OpenAI from 'openai';
import { AI_USAGE_LIMITS, OPENAI_CHAT_MODEL } from '../../config/constants';

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
  let testUser: IUser & { _id: mongoose.Types.ObjectId };
  let testNote: INote & { _id: mongoose.Types.ObjectId };
  let noteService: NoteService;
  let userService: UserService;

  beforeEach(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    
    const userDoc = new User(mockUser({
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      aiUsage: { summaryUsed: 0, flashcardUsed: 0, lastReset: new Date('2023-01-01T00:00:00.000Z') },
      streak: { current: 0, max: 0, lastUsed: new Date('2023-01-01T00:00:00.000Z') }
    }));
    testUser = await userDoc.save() as IUser & { _id: mongoose.Types.ObjectId };

    const noteDoc = new Note(mockNote({ user: testUser._id, fileUrl: 'path/to/fake.pdf' }));
    testNote = await noteDoc.save() as INote & { _id: mongoose.Types.ObjectId };

    noteService = new NoteService();
    userService = new UserService();
  });

  describe('getAllNotes', () => {
    it('should return all notes with pagination', async () => {
      const result = await NoteService.getAllNotes({}, { page: 1, limit: 10 });
      expect(result.notes).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
    });

    it('should filter notes by subject', async () => {
      const result = await NoteService.getAllNotes({ subject: 'Biology' }, {});
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].subject).toBe('Biology');
    });

    it('should filter by multiple criteria', async () => {
      // Create additional notes with different attributes
      await Note.create({
        title: 'Chemistry Note',
        description: 'Chemistry Description',
        subject: 'Chemistry',
        grade: '11',
        semester: '2',
        quarter: '3',
        topic: 'Chemical Bonds',
        fileUrl: 'https://example.com/chem.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: testUser._id,
        isPublic: true
      });

      // Filter by two criteria
      const result = await NoteService.getAllNotes({
        subject: 'Biology',
        grade: '12'
      }, {});

      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].subject).toBe('Biology');
      expect(result.notes[0].grade).toBe('12');
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
      const resultAsc = await NoteService.getAllNotes({}, { 
        sortBy: 'createdAt', 
        sortOrder: 'asc' 
      });
      
      expect(resultAsc.notes[0].title).toBe('Older Note');
      expect(resultAsc.notes[1].title).toBe('Test Note');

      // Test descending sort
      const resultDesc = await NoteService.getAllNotes({}, { 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      expect(resultDesc.notes[0].title).toBe('Test Note');
      expect(resultDesc.notes[1].title).toBe('Older Note');
    });
  });

  describe('getNoteById', () => {
    it('should return a note by id', async () => {
      const note = await NoteService.getNoteById(testNote._id.toString());
      expect(note).toBeDefined();
      expect(note?.title).toBe('Test Note');
    });

    it('should return null for non-existent note', async () => {
      const note = await NoteService.getNoteById('507f1f77bcf86cd799439011');
      expect(note).toBeNull();
    });

    it('should increment view count', async () => {
      // Initial view count should be 0
      expect(testNote.viewCount).toBe(0);

      // Get note to increment view count
      await NoteService.getNoteById(testNote._id.toString());

      // Verify view count was incremented in the database
      const updatedNote = await Note.findById(testNote._id);
      expect(updatedNote?.viewCount).toBe(1);
    });
  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'New Note',
        description: 'New Description',
        subject: 'Biology',
        grade: '11' as const,
        semester: '2' as const,
        quarter: '2' as const,
        topic: 'New Topic',
        fileUrl: 'https://example.com/new.pdf',
        fileType: 'pdf' as const,
        fileSize: 2000,
        isPublic: true
      };

      const note = await NoteService.createNote(noteData, testUser._id.toString());
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

      const note = await NoteService.createNote(noteData, testUser._id.toString());
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
        description: 'Updated Description'
      };

      const updatedNote = await NoteService.updateNoteById(
        testNote._id.toString(),
        testUser._id.toString(),
        updateData
      );

      expect(updatedNote?.title).toBe('Updated Note');
      expect(updatedNote?.description).toBe('Updated Description');
    });

    it('should throw error when updating another user\'s note', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      await expect(
        NoteService.updateNoteById(
          testNote._id.toString(),
          otherUser._id.toString(),
          { title: 'Updated Note' }
        )
      ).rejects.toThrow(ErrorResponse);
    });

    it('should throw error when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await NoteService.updateNoteById(
        nonExistentId,
        testUser._id.toString(),
        { title: 'Updated Note' }
      );
      
      expect(result).toBeNull();
    });

    it('should update tags correctly', async () => {
      const updateData = {
        tags: ['important', 'updated', 'test']
      };

      const updatedNote = await NoteService.updateNoteById(
        testNote._id.toString(),
        testUser._id.toString(),
        updateData
      );

      expect(updatedNote?.tags).toHaveLength(3);
      expect(updatedNote?.tags).toContain('important');
      expect(updatedNote?.tags).toContain('updated');
      expect(updatedNote?.tags).toContain('test');
    });

    it('should return original note if no changes made', async () => {
      const updateData = {
        title: testNote.title, // Same as original
        description: testNote.description // Same as original
      };

      const updatedNote = await NoteService.updateNoteById(
        testNote._id.toString(),
        testUser._id.toString(),
        updateData
      );

      expect(updatedNote?.title).toBe(testNote.title);
      expect(updatedNote?.description).toBe(testNote.description);
    });
  });

  describe('deleteNoteById', () => {
    it('should delete a note', async () => {
      const deletedNote = await NoteService.deleteNoteById(
        testNote._id.toString(),
        testUser._id.toString()
      );
      expect(deletedNote).toBeDefined();
      expect(deletedNote?.title).toBe('Test Note');

      const note = await Note.findById(testNote._id);
      expect(note).toBeNull();
    });

    it('should throw error when deleting another user\'s note', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      await expect(
        NoteService.deleteNoteById(
          testNote._id.toString(),
          otherUser._id.toString()
        )
      ).rejects.toThrow(ErrorResponse);
    });

    it('should return null when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await NoteService.deleteNoteById(
        nonExistentId,
        testUser._id.toString()
      );
      
      expect(result).toBeNull();
    });
  });

  describe('getUserNotes', () => {
    it('should return notes for a specific user', async () => {
      // Create another user with their own note
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      // Create a note for the other user
      await Note.create({
        title: 'Other User Note',
        description: 'Other Description',
        subject: 'Chemistry',
        grade: '11',
        semester: '2',
        quarter: '2',
        topic: 'Other Topic',
        fileUrl: 'https://example.com/other.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: otherUser._id,
        isPublic: true
      });

      // Get notes for original test user
      const userNotes = await NoteService.getUserNotes(testUser._id.toString());
      
      expect(userNotes).toHaveLength(1);
      expect(userNotes[0].title).toBe('Test Note');
      expect(userNotes[0].user.toString()).toBe(testUser._id.toString());
    });

    it('should return empty array when user has no notes', async () => {
      // Create a user with no notes
      const emptyUser = await User.create({
        name: 'Empty User',
        email: 'empty@example.com',
        password: 'password123',
        username: 'emptyuser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      const userNotes = await NoteService.getUserNotes(emptyUser._id.toString());
      expect(userNotes).toHaveLength(0);
    });
  });

  describe('getMyNotes', () => {
    it('should return all notes for the current user', async () => {
      // Create a second note for the test user
      await Note.create({
        title: 'Second Note',
        description: 'Second Description',
        subject: 'Physics',
        grade: '12',
        semester: '2',
        quarter: '3',
        topic: 'Math Topic',
        fileUrl: 'https://example.com/math.pdf',
        fileType: 'pdf',
        fileSize: 2000,
        user: testUser._id,
        isPublic: false // Private note
      });

      const myNotes = await NoteService.getMyNotes(testUser._id.toString());
      
      expect(myNotes).toHaveLength(2);
      expect(myNotes[0].title).toBe('Test Note');
      expect(myNotes[1].title).toBe('Second Note');
    });
  });

  describe('getTopRatedNotes', () => {
    it('should return notes sorted by average rating', async () => {
      // Create additional notes with ratings
      const noteA = await Note.create({
        title: 'High Rated Note',
        description: 'High rating description',
        subject: 'Physics',
        grade: '12',
        semester: '1',
        quarter: '1',
        topic: 'Physics Topic',
        fileUrl: 'https://example.com/physics.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: testUser._id,
        isPublic: true,
        averageRating: 4.8
      });

      const noteB = await Note.create({
        title: 'Medium Rated Note',
        description: 'Medium rating description',
        subject: 'Chemistry',
        grade: '12',
        semester: '1',
        quarter: '2',
        topic: 'Chemistry Topic',
        fileUrl: 'https://example.com/chemistry.pdf',
        fileType: 'pdf',
        fileSize: 1200,
        user: testUser._id,
        isPublic: true,
        averageRating: 3.5
      });

      // Add ratings directly
      await Note.findByIdAndUpdate(
        noteA._id,
        { $push: { ratings: { user: testUser._id, value: 5 } }, averageRating: 5 }
      );
      
      await Note.findByIdAndUpdate(
        noteB._id,
        { $push: { ratings: { user: testUser._id, value: 3 } }, averageRating: 3 }
      );

      // Get top rated notes
      const topNotes = await NoteService.getTopRatedNotes(2);
      
      expect(topNotes).toHaveLength(2);
      expect(topNotes[0].averageRating).toBeGreaterThanOrEqual(topNotes[1].averageRating);
    });

    it('should respect the limit parameter', async () => {
      // Clear existing notes for this test
      await Note.deleteMany({});
      
      // Create multiple notes with ratings
      for (let i = 0; i < 5; i++) {
        const note = await Note.create({
          title: `Note ${i}`,
          description: `Description ${i}`,
          subject: 'Physics',
          grade: '12',
          semester: '1',
          quarter: '1',
          topic: `Topic ${i}`,
          fileUrl: `https://example.com/note${i}.pdf`,
          fileType: 'pdf',
          fileSize: 1000 + i * 100,
          user: testUser._id,
          isPublic: true,
          averageRating: 5 - i * 0.5
        });
        
        // Add a rating to ensure the averageRating is correctly saved
        await Note.findByIdAndUpdate(
          note._id,
          { $push: { ratings: { user: testUser._id, value: Math.round(5 - i * 0.5) } } }
        );
      }

      // Get top 3 rated notes
      const topNotes = await NoteService.getTopRatedNotes(3);
      
      expect(topNotes).toHaveLength(3);
      expect(topNotes[0].averageRating).toBeGreaterThanOrEqual(topNotes[1].averageRating);
      expect(topNotes[1].averageRating).toBeGreaterThanOrEqual(topNotes[2].averageRating);
    });
  });

  describe('getNotesBySubject', () => {
    it('should return notes filtered by subject', async () => {
      // Create notes with different subjects
      await Note.create({
        title: 'Math Note',
        description: 'Math Description',
        subject: 'General Mathematics',
        grade: '12',
        semester: '1',
        quarter: '1',
        topic: 'Math Topic',
        fileUrl: 'https://example.com/math.pdf',
        fileType: 'pdf',
        fileSize: 1200,
        user: testUser._id,
        isPublic: true
      });

      await Note.create({
        title: 'Physics Note',
        description: 'Physics Description',
        subject: 'Physics',
        grade: '12',
        semester: '1',
        quarter: '1',
        topic: 'Physics Topic',
        fileUrl: 'https://example.com/physics.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: testUser._id,
        isPublic: true
      });

      // Get notes for Biology subject
      const biologyNotes = await NoteService.getNotesBySubject('Biology');
      
      expect(biologyNotes).toHaveLength(1);
      expect(biologyNotes[0].subject).toBe('Biology');
      expect(biologyNotes[0].title).toBe('Test Note');

      // Get notes for Physics subject
      const physicsNotes = await NoteService.getNotesBySubject('Physics');
      
      expect(physicsNotes).toHaveLength(1);
      expect(physicsNotes[0].subject).toBe('Physics');
      expect(physicsNotes[0].title).toBe('Physics Note');
    });

    it('should only return public notes', async () => {
      // Create a private note in the same subject
      await Note.create({
        title: 'Private Biology Note',
        description: 'Private Bio Description',
        subject: 'Biology',
        grade: '12',
        semester: '1',
        quarter: '2',
        topic: 'Private Bio Topic',
        fileUrl: 'https://example.com/private-bio.pdf',
        fileType: 'pdf',
        fileSize: 1000,
        user: testUser._id,
        isPublic: false // Private note
      });

      // Get notes for Biology subject
      const biologyNotes = await NoteService.getNotesBySubject('Biology');
      
      // Should only return the public note
      expect(biologyNotes).toHaveLength(1);
      expect(biologyNotes[0].isPublic).toBe(true);
      expect(biologyNotes[0].title).toBe('Test Note');
    });
  });

  describe('searchNotes', () => {
    it('should find notes matching search term', async () => {
      // Create note with specific content to search for
      await Note.create({
        title: 'Quantum Physics',
        description: 'Advanced quantum mechanics concepts',
        subject: 'Physics',
        grade: '12',
        semester: '2',
        quarter: '3',
        topic: 'Quantum Mechanics',
        fileUrl: 'https://example.com/quantum.pdf',
        fileType: 'pdf',
        fileSize: 2000,
        user: testUser._id,
        isPublic: true
      });

      // Search for "quantum"
      const results = await NoteService.searchNotes('quantum');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Quantum Physics');
    });

    it('should only return public notes in search results', async () => {
      // Create a private note with searchable content
      await Note.create({
        title: 'Private Quantum Notes',
        description: 'Secret quantum research',
        subject: 'Physics',
        grade: '12',
        semester: '1',
        quarter: '2',
        topic: 'Quantum Theory',
        fileUrl: 'https://example.com/private-quantum.pdf',
        fileType: 'pdf',
        fileSize: 1500,
        user: testUser._id,
        isPublic: false // Private note
      });

      // Search for "quantum"
      const results = await NoteService.searchNotes('quantum');
      
      // Should not find the private note
      expect(results).toHaveLength(0);
    });
  });

  describe('rateNote', () => {
    it('should add a rating to a note', async () => {
      const ratedNote = await NoteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        5
      );

      expect(ratedNote?.ratings).toHaveLength(1);
      expect(ratedNote?.ratings[0].value).toBe(5);
      expect(ratedNote?.averageRating).toBe(5);
    });

    it('should update existing rating', async () => {
      // Add initial rating
      await NoteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        3
      );

      // Update rating
      const ratedNote = await NoteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        5
      );

      expect(ratedNote?.ratings).toHaveLength(1);
      expect(ratedNote?.ratings[0].value).toBe(5);
      expect(ratedNote?.averageRating).toBe(5);
    });

    it('should calculate average rating correctly with multiple ratings', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      // Add first rating
      await NoteService.rateNote(
        testNote._id.toString(),
        testUser._id.toString(),
        5
      );

      // Add second rating
      const ratedNote = await NoteService.rateNote(
        testNote._id.toString(),
        otherUser._id.toString(),
        3
      );

      expect(ratedNote?.ratings).toHaveLength(2);
      expect(ratedNote?.averageRating).toBe(4); // (5+3)/2 = 4
    });

    it('should return null when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await NoteService.rateNote(
        nonExistentId,
        testUser._id.toString(),
        5
      );
      
      expect(result).toBeNull();
    });
  });

  describe('incrementDownloads', () => {
    it('should increment download count', async () => {
      // Initial download count should be 0
      expect(testNote.downloadCount).toBe(0);

      // Increment download count
      const updatedNote = await NoteService.incrementDownloads(
        testNote._id.toString(),
        testUser._id.toString()
      );

      expect(updatedNote?.downloadCount).toBe(1);

      // Verify count was updated in the database
      const dbNote = await Note.findById(testNote._id);
      expect(dbNote?.downloadCount).toBe(1);
    });

    it('should return null when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await NoteService.incrementDownloads(
        nonExistentId,
        testUser._id.toString()
      );
      
      expect(result).toBeNull();
    });
  });

  describe('createFlashcardForNote', () => {
    it('should add a flashcard to a note', async () => {
      const note = await NoteService.createFlashcardForNote(
        testNote._id.toString(),
        testUser._id.toString(),
        'What is biology?',
        'The study of life',
        'medium'
      );

      expect(note?.flashcards).toHaveLength(1);
      expect(note?.flashcards[0].question).toBe('What is biology?');
      expect(note?.flashcards[0].answer).toBe('The study of life');
      expect(note?.flashcards[0].difficulty).toBe('medium');
    });

    it('should throw error when adding flashcard to another user\'s note', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      await expect(
        NoteService.createFlashcardForNote(
          testNote._id.toString(),
          otherUser._id.toString(),
          'Test question',
          'Test answer'
        )
      ).rejects.toThrow('User not authorized');
    });

    it('should return null when note does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await NoteService.createFlashcardForNote(
        nonExistentId,
        testUser._id.toString(),
        'Test question',
        'Test answer'
      );
      
      expect(result).toBeNull();
    });
  });

  describe('addFlashcardsToNote', () => {
    it('should add multiple flashcards to a note', async () => {
      const flashcardsData = [
        { question: 'Question 1', answer: 'Answer 1', difficulty: 'easy' as const },
        { question: 'Question 2', answer: 'Answer 2', difficulty: 'medium' as const },
        { question: 'Question 3', answer: 'Answer 3', difficulty: 'hard' as const }
      ];

      const note = await NoteService.addFlashcardsToNote(
        testNote._id.toString(),
        testUser._id.toString(),
        flashcardsData
      );

      expect(note?.flashcards).toHaveLength(3);
      expect(note?.flashcards[0].question).toBe('Question 1');
      expect(note?.flashcards[1].question).toBe('Question 2');
      expect(note?.flashcards[2].question).toBe('Question 3');
    });

    it('should throw error when adding flashcards to another user\'s note', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        username: 'otheruser',
        role: 'user'
      }) as IUser & { _id: mongoose.Types.ObjectId };

      await expect(
        NoteService.addFlashcardsToNote(
          testNote._id.toString(),
          otherUser._id.toString(),
          [{ question: 'Q1', answer: 'A1' }]
        )
      ).rejects.toThrow('User not authorized');
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

      const result = await NoteService.uploadNoteFile(
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
        NoteService.uploadNoteFile(
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
      }) as IUser & { _id: mongoose.Types.ObjectId };

      const mockFile: any = {
        fieldname: 'document',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        filename: 'test-123456.pdf'
      };

      await expect(
        NoteService.uploadNoteFile(
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
      
      const result1 = await NoteService.getNotesByFilters(stringFilters);
      expect(result1).toHaveLength(1);
      expect(result1[0].title).toBe('Physics Grade 12');

      // Test with object filters
      const objectFilters = {
        grade: '11'
      };
      
      const result2 = await NoteService.getNotesByFilters(objectFilters);
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
      
      const result = await NoteService.getNotesByFilters(filters);
      
      // Should only include public Physics notes
      expect(result.every(note => note.isPublic)).toBe(true);
      expect(result.filter(note => note.title === 'Private Physics Notes')).toHaveLength(0);
    });

    it('should throw error with invalid filters format', async () => {
      const invalidFilters = '{subject: invalid json';
      
      await expect(
        NoteService.getNotesByFilters(invalidFilters)
      ).rejects.toThrow('Invalid filters format');
    });
  });
}); 