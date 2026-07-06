import Note, { INote } from '../models/Note';
import { IUser } from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import BadgeService from './BadgeService';
import UserService from './UserService';
import { Types } from 'mongoose';
import { NotFoundError, BadRequestError, QuotaExceededError } from '../utils/customErrors'; // Import if needed directly
import { FilterQuery, PopulateOptions } from 'mongoose';
import { extractTextFromFile } from '../utils/extractTextFromFile';


// For multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Define a type for pagination options
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Define a type for note query filters
export interface NoteQueryFilters extends FilterQuery<INote> {
  grade?: string;
  subject?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  // Add other filterable fields from INote as needed
}


export default class NoteService {
  public async createNote(noteData: Partial<INote>, userId: string): Promise<INote> {
    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    const note = await Note.create({
      ...noteData,
      user: userId
    });

    await BadgeService.checkAndAwardBadges(userId, 'note_created', { noteId: note._id });
    return note;
  }

  public async getNoteById(id: string): Promise<INote | null> {
    return await Note.findById(id).populate('user', 'name email');
  }

  public async updateNote(id: string, noteData: Partial<INote>): Promise<INote | null> {
    return await Note.findByIdAndUpdate(id, noteData, {
      new: true,
      runValidators: true
    });
  }

  public async deleteNote(id: string): Promise<INote | null> {
    return await Note.findByIdAndDelete(id);
  }

  public async getNotesByUser(userId: string): Promise<INote[]> {
    return await Note.find({ user: userId });
  }

  public async getNotesByCategory(category: string): Promise<INote[]> {
    return await Note.find({ category });
  }

  public async getNotesByTag(tag: string): Promise<INote[]> {
    return await Note.find({ tags: tag });
  }

  public async searchNotes(query: string): Promise<INote[]> {
    return await Note.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    });
  }

  public async getAllNotes(
    filters: NoteQueryFilters,
    pagination: PaginationOptions
  ): Promise<{ notes: INote[], count: number, totalPages: number, currentPage: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build query
    let query = Note.find(filters);

    // Sorting
    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sort);

    // Pagination
    query = query.skip(skip).limit(limit);

    // Populate user details (example, adjust fields as needed)
    const userPopulateOptions: PopulateOptions = {
        path: 'user',
        select: 'name username profileImage' // Select specific fields from the user
    };
    query = query.populate(userPopulateOptions);
    
    // Optionally populate ratings.user as well if needed for display
    // const ratingsUserPopulateOptions: PopulateOptions = {
    //     path: 'ratings.user',
    //     select: 'name username'
    // };
    // query = query.populate(ratingsUserPopulateOptions);

    // Lean for performance if not modifying docs
    query = query.lean() as any; // Type assertion to resolve compatibility issue

    const notes = await query.exec();
    const count = await Note.countDocuments(filters);
    const totalPages = Math.ceil(count / limit);

    return { notes, count, totalPages, currentPage: page };
  }

  public async getUserNotes(userId: string): Promise<INote[]> {
    // Add population for user details if needed on these notes
    const notes = await Note.find({ user: userId }).lean();
    return notes;
  }

  public async getMyNotes(userId: string): Promise<INote[]> {
     // Similar to getUserNotes, but could have different logic if "my notes" implies more
    const notes = await Note.find({ user: userId })
                            .populate({ path: 'user', select: 'name username profileImage' })
                            .lean();
    return notes;
  }

  public async getTopRatedNotes(limit: number = 10): Promise<INote[]> {
    const notes = await Note.find({ isPublic: true }) // Assuming only public notes
                            .sort({ averageRating: -1 })
                            .limit(limit)
                            .populate({ path: 'user', select: 'name username profileImage' })
                            .lean();
    return notes;
  }

  public async getNotesBySubject(subject: string): Promise<INote[]> {
    const notes = await Note.find({ subject: subject, isPublic: true }) // Assuming public notes
                            .populate({ path: 'user', select: 'name username profileImage' })
                            .lean();
    return notes;
  }

  public async addFlashcardsToNote(noteId: string, userId: string, flashcardsData: Array<{ question: string; answer: string; difficulty?: 'easy' | 'medium' | 'hard' }>): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      return null;
    }
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to add flashcards to this note', 401);
    }
    
    // Add new flashcards to the existing ones
    flashcardsData.forEach(fc => {
        note.flashcards.push({
            question: fc.question,
            answer: fc.answer,
            difficulty: fc.difficulty ?? 'medium', // Default difficulty
        } as any); // Cast to any to satisfy INoteFlashcard structure if subdocument _id is an issue
    });
    
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note;
  }

  public async uploadNoteFile(noteId: string, userId: string, file: MulterFile): Promise<INote | null> {
    // This is a placeholder. Actual implementation will involve:
    // 1. Uploading file to a cloud storage (e.g., Cloudinary, S3)
    // 2. Getting the URL and other details from the storage service
    // 3. Updating the note document with these details (fileUrl, fileSize, fileType, publicId, assetId)
    // console.log('File upload service method called for note:', noteId, 'by user:', userId); // Removed
    // console.log('File details:', file); // Removed

    const note = await Note.findById(noteId);
    if (!note) {
        throw new ErrorResponse('Note not found', 404);
    }
    if (note.user.toString() !== userId) {
        throw new ErrorResponse('User not authorized to upload file for this note', 401);
    }

    // Example update (replace with actual file handling logic)
    note.fileUrl = `https://example.com/uploads/${file.filename}`; // Placeholder URL
    note.fileType = file.mimetype.split('/')[1] as INote['fileType']; // Basic type extraction
    note.fileSize = file.size;
    // note.publicId = ... // from cloudinary or other service
    // note.assetId = ... // from cloudinary or other service
    
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note.populate({ path: 'user', select: 'name username profileImage' });
  }

  public async getNotesByFilters(filters: string | NoteQueryFilters): Promise<INote[]> {
    // This is a placeholder. Implementation depends on how 'filters' string is structured.
    // Needs parsing and conversion into a Mongoose query object.
    try {
        const parsedFilters: NoteQueryFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        parsedFilters.isPublic = true; // Assuming only public notes
        const notes = await Note.find(parsedFilters)
                                .populate({ path: 'user', select: 'name username profileImage' })
                                .lean();
        return notes;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid filters format';
        throw new ErrorResponse(errorMessage, 400);
    }
  }

  public async rateNote(noteId: string, userId: string, ratingValue: number): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) return null;

    // Check if the user has already rated this note
    const existingRatingIndex = note.ratings.findIndex(r => r.user.toString() === userId);

    if (existingRatingIndex >= 0) {
      // Update existing rating
      note.ratings[existingRatingIndex].value = ratingValue;
    } else {
      // Add new rating using a MongoDB update operation instead of push
      await Note.findByIdAndUpdate(
        noteId,
        { $push: { ratings: { user: userId, value: ratingValue } } }
      );
      
      // Reload the note with the new rating
      const updatedNote = await Note.findById(noteId);
      if (!updatedNote) return null;
      
      // Recalculate average rating
      updatedNote.getAverageRating();
      await updatedNote.save();
      return updatedNote;
    }

    // Don't need this if we're using the update approach above
    note.getAverageRating();
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note;
  }

  public async incrementDownloads(noteId: string, userId: string): Promise<INote | null> {
    // userId might be used for logging or restrictions, not strictly needed for incrementing
    const note = await Note.findByIdAndUpdate(
      noteId, 
      { $inc: { downloadCount: 1 } },
      { new: true } // Return the updated document
    ).populate({ path: 'user', select: 'name username profileImage' }).lean();
    
    if (!note) {
        return null;
    }
    return note;
  }

  public async createFlashcardForNote(noteId: string, userId: string, question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      return null;
    }
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to add flashcards to this note', 401);
    }
    note.flashcards.push({ question, answer, difficulty } as any);
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note.populate({ path: 'user', select: 'name username profileImage' });
  }

  public async updateFlashcard(
    noteId: string,
    userId: string,
    flashcardId: string,
    updates: { question?: string; answer?: string; difficulty?: 'easy' | 'medium' | 'hard' }
  ): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) return null;
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to edit flashcards on this note', 401);
    }
    const card = (note.flashcards as any).id(flashcardId);
    if (!card) {
      throw new ErrorResponse('Flashcard not found on this note', 404);
    }
    if (updates.question !== undefined) card.question = updates.question;
    if (updates.answer !== undefined) card.answer = updates.answer;
    if (updates.difficulty !== undefined) card.difficulty = updates.difficulty;
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note;
  }

  public async deleteFlashcard(noteId: string, userId: string, flashcardId: string): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) return null;
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to delete flashcards on this note', 401);
    }
    const card = (note.flashcards as any).id(flashcardId);
    if (!card) {
      throw new ErrorResponse('Flashcard not found on this note', 404);
    }
    card.deleteOne();
    // validateModifiedOnly: legacy notes can carry malformed subdocuments (e.g.
    // a rating missing its value); a full-validation save would reject THIS
    // write for THAT old data ("Path `value` is required").
    await note.save({ validateModifiedOnly: true });
    return note;
  }

} 