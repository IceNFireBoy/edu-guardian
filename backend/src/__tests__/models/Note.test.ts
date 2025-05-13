import Note, { INote } from '../../models/Note';
import User, { IUser } from '../../models/User';
import mongoose from 'mongoose';

describe('Note Model', () => {
  let testUser: IUser & { _id: mongoose.Types.ObjectId };
  let testNote: INote;

  beforeEach(async () => {
    // Clear the collections
    await Note.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      role: 'user'
    }) as IUser & { _id: mongoose.Types.ObjectId };

    // Create test note
    testNote = await Note.create({
      title: 'Test Note',
      description: 'Test Description',
      subject: 'Biology',
      grade: '12',
      semester: '1',
      quarter: '1',
      topic: 'Test Topic',
      fileUrl: 'https://example.com/test.pdf',
      fileType: 'pdf',
      fileSize: 1000,
      user: testUser._id,
      isPublic: true
    });
  });

  describe('Note Creation', () => {
    it('should create a note successfully', async () => {
      expect(testNote).toBeDefined();
      expect(testNote.title).toBe('Test Note');
      expect(testNote.description).toBe('Test Description');
      expect(testNote.subject).toBe('Biology');
      
      if (testUser && testUser._id && testNote.user) {
        expect(testNote.user.toString()).toBe(testUser._id.toString());
      }
    });

    it('should require title', async () => {
      await expect(
        Note.create({
          description: 'Test Description',
          subject: 'Biology',
          grade: '12',
          semester: '1',
          quarter: '1',
          topic: 'Test Topic',
          fileUrl: 'https://example.com/test.pdf',
          fileType: 'pdf',
          fileSize: 1000,
          user: testUser._id
        })
      ).rejects.toThrow();
    });

    it('should require subject', async () => {
      await expect(
        Note.create({
          title: 'Test Note',
          description: 'Test Description',
          grade: '12',
          semester: '1',
          quarter: '1',
          topic: 'Test Topic',
          fileUrl: 'https://example.com/test.pdf',
          fileType: 'pdf',
          fileSize: 1000,
          user: testUser._id
        })
      ).rejects.toThrow();
    });
  });

  describe('Note Methods', () => {
    it('should calculate average rating correctly', async () => {
      await Note.findByIdAndUpdate(
        testNote._id,
        {
          $push: {
            ratings: [
              { user: new mongoose.Types.ObjectId(), value: 4 },
              { user: new mongoose.Types.ObjectId(), value: 5 }
            ]
          }
        },
        { new: true }
      );

      const updatedNote = await Note.findById(testNote._id);
      if (!updatedNote) throw new Error('Note not found');
      
      updatedNote.getAverageRating();
      await updatedNote.save();
      
      expect(updatedNote.averageRating).toBe(4.5);
    });

    it('should handle empty ratings', async () => {
      testNote.ratings = [];
      await testNote.save();

      expect(testNote.averageRating).toBe(0);
    });
  });

  describe('Note Virtuals', () => {
    it('should generate slug from title', async () => {
      expect(testNote.slug).toBe('test-note');
    });

    it('should update slug when title changes', async () => {
      testNote.title = 'Updated Test Note';
      await testNote.save();
      expect(testNote.slug).toBe('updated-test-note');
    });
  });

  describe('Note Indexes', () => {
    it('should have unique title for the same user', async () => {
      // Since slug is auto-generated from title, and may not have a unique index directly,
      // we'll test that the combination of user + title must be unique
      await expect(
        Note.create({
          title: 'Test Note', // Same title as the existing note
          description: 'Another Description',
          subject: 'Biology',
          grade: '12',
          semester: '1',
          quarter: '1',
          topic: 'Test Topic',
          fileUrl: 'https://example.com/test2.pdf', // Different URL
          fileType: 'pdf',
          fileSize: 1000,
          user: testUser._id
        })
      ).rejects.toThrow();
    });
  });

  describe('Note Relationships', () => {
    it('should populate user details', async () => {
      const populatedNote = await Note.findById(testNote._id).populate('user');
      expect(populatedNote?.user).toBeDefined();
      
      if (populatedNote?.user && typeof populatedNote.user !== 'string' && 'name' in populatedNote.user) {
        expect(populatedNote.user.name).toBe('Test User');
      } else {
        fail('User was not properly populated');
      }
    });

    it('should handle user deletion', async () => {
      await User.findByIdAndDelete(testUser._id);
      const note = await Note.findById(testNote._id);
      expect(note).toBeDefined();
      
      if (note && note.user && testUser && testUser._id) {
        expect(note.user.toString()).toBe(testUser._id.toString());
      }
    });
  });
}); 