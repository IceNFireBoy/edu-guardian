import Note, { INote } from '../models/Note';
import User, { IUser } from '../models/User'; // For user-related operations if needed
import { NotFoundError, BadRequestError, QuotaExceededError } from '../utils/customErrors'; // Import if needed directly
import UserService from './UserService'; // Import UserService instance
import BadgeService from './BadgeService'; // Import BadgeService
import ErrorResponse from '../utils/errorResponse';
import { FilterQuery, PopulateOptions } from 'mongoose';
import { extractTextFromFile } from '../utils/extractTextFromFile';
import OpenAI from 'openai';
import { OPENAI_CHAT_MODEL, AI_FEATURE_TYPES, FLASHCARD_DIFFICULTY_LEVELS, IUserBadgeEarnedAPIResponse } from '../config/constants'; // Import constants & new type
import { IBadge } from '../models/Badge'; // Implied import for IBadge type

// Define a type for the response of AI generation methods that includes newly awarded badges
interface AIGenerationResponse<T> {
  data: T;
  newlyAwardedBadges: IUserBadgeEarnedAPIResponse[]; // Using a specific type for API response
}

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const badgeService = new BadgeService();
const userService = new UserService();

export class NoteService {
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

  public async getNoteById(noteId: string): Promise<INote | null> {
    const note = await Note.findById(noteId)
                           .populate({ path: 'user', select: 'name username profileImage' })
                           // .populate({ path: 'ratings.user', select: 'name username' })
                           .lean(); // Using lean if no save operations after fetch

    if (!note) {
      // ErrorResponse will be thrown by controller if service returns null
      return null;
    }

    // Increment view count (if not using lean() or handle separately)
    // If using lean, this update needs to be a separate operation
    await Note.findByIdAndUpdate(noteId, { $inc: { viewCount: 1 } });

    // Re-fetch if you need the absolute latest viewCount and still want to use lean for the main fetch
    // Or, return note and increment viewCount in the background (less critical for immediate response)
    // For simplicity here, we assume viewCount on the initially fetched lean doc is acceptable for response.
    // To return the updated doc, remove .lean() or re-fetch.
    
    return { ...note, viewCount: (note.viewCount || 0) + 1 }; // Manually increment for lean response
  }

  public async createNote(noteData: Partial<INote>, userId: string): Promise<INote> {
    // Ensure the user ID is added to the note data
    const dataToSave: Partial<INote> = {
      ...noteData,
      user: userId as any // mongoose.Types.ObjectId will be handled by Mongoose
    };

    // Title, subject, grade, semester, quarter, topic, fileUrl, fileType, fileSize are required by schema/routes
    // Other fields like description, tags are optional
    // slug will be auto-generated by pre-save hook
    // viewCount, downloadCount, averageRating, ratings, flashcards, aiSummary will have defaults or be empty initially

    const note = await Note.create(dataToSave);
    // No need to manually populate user here as we are creating.
    // If client needs populated user immediately, a separate getById call might be cleaner or adjust response.
    return note;
  }

  public async updateNoteById(noteId: string, userId: string, noteData: Partial<INote>): Promise<INote | null> {
    let note = await Note.findById(noteId);

    if (!note) {
      return null; // Controller will send 404
    }

    // Check ownership
    // Convert note.user (which could be ObjectId) to string for comparison
    if (note.user.toString() !== userId) {
      // Throw an error that will be caught by asyncHandler and passed to the error handler
      // This results in a 401 or 403, which is more appropriate than returning null here
      throw new ErrorResponse('User not authorized to update this note', 401);
    }

    // Update allowed fields
    // Client should only send fields they intend to change.
    // Fields like 'user', 'slug' (unless title changes), 'ratings', 'averageRating', 'flashcards', 'aiSummary' 
    // 'viewCount', 'downloadCount' are generally not updated directly via this method.
    // 'fileUrl', 'fileType', 'fileSize' might be updated if a new file is uploaded, handled separately or here.
    // For simplicity, allowing update of most textual and descriptive fields. 
    // More granular control can be added if needed.

    // List of fields that can be updated by the user:
    const updatableFields: (keyof INote)[] = [
        'title',
        'description',
        'subject',
        'grade',
        'semester',
        'quarter',
        'topic',
        'tags',
        'isPublic',
        // If file re-upload is part of this, add fileUrl, fileType, fileSize, publicId, assetId
        'fileUrl', 
        'fileType',
        'fileSize',
        'publicId',
        'assetId'
    ];

    let hasChanges = false;
    for (const field of updatableFields) {
        if (noteData[field] !== undefined && noteData[field] !== (note as any)[field]) {
            (note as any)[field] = noteData[field];
            if (field === 'title') {
                // If title changes, slug should be regenerated by pre-save hook
                note.isModified('title'); // Mark title as modified for pre-save hook
            }
            hasChanges = true;
        }
    }

    if (!hasChanges) {
        // If no actual changes to updatable fields, just return the current note
        // Or, could throw an error/return specific message indicating no changes were made.
        return note;
    }

    // The pre-save hook for slug and averageRating (if ratings were part of updateData, which they are not here)
    // will run automatically upon saving.
    note = await note.save();
    
    // Optionally, populate user details after saving if needed for the response
    // await note.populate({ path: 'user', select: 'name username profileImage' });

    return note;
  }

  public async deleteNoteById(noteId: string, userId: string): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      return null; // Controller will handle 404
    }
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to delete this note', 401);
    }
    // Instead of remove, which is deprecated, use deleteOne or findByIdAndDelete
    // await note.remove(); deprecated
    await Note.findByIdAndDelete(noteId);
    return note; // Return the note that was deleted
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
            difficulty: fc.difficulty || 'medium', // Default difficulty
        } as any); // Cast to any to satisfy INoteFlashcard structure if subdocument _id is an issue
    });
    
    await note.save();
    return note;
  }

  public async searchNotes(searchTerm: string): Promise<INote[]> {
    // Basic text search, can be expanded with more specific fields or regex
    const notes = await Note.find({ 
        $text: { $search: searchTerm }, 
        isPublic: true 
    })
    .populate({ path: 'user', select: 'name username profileImage' })
    .lean();
    return notes;
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
    
    await note.save();
    return note.populate({ path: 'user', select: 'name username profileImage' });
  }

  public async getNotesByFilters(filters: any): Promise<INote[]> {
    // This is a placeholder. Implementation depends on how 'filters' string is structured.
    // Needs parsing and conversion into a Mongoose query object.
    console.log('getNotesByFilters called with:', filters);
    // Example: if filters is a JSON string of NoteQueryFilters
    try {
        const parsedFilters: NoteQueryFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        parsedFilters.isPublic = true; // Assuming only public notes
        const notes = await Note.find(parsedFilters)
                                .populate({ path: 'user', select: 'name username profileImage' })
                                .lean();
        return notes;
    } catch (error) {
        throw new ErrorResponse('Invalid filters format', 400);
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
    await note.save();
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
    await note.save();
    return note.populate({ path: 'user', select: 'name username profileImage' });
  }

  public async generateAISummaryForNote(noteId: string, userId: string): Promise<AIGenerationResponse<Partial<INote>>> {
    const note = await Note.findById(noteId);
    if (!note) {
        throw new NotFoundError('Note not found');
    }

    // Check user's AI quota
    await userService.checkUserQuota(userId, 'summary');

    // Extract text from the note's file
    const text = await extractTextFromFile(note.fileUrl);
    if (!text) {
        throw new BadRequestError('Could not extract text from file');
    }

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant that summarizes educational notes. Provide a concise but comprehensive summary.'
            },
            {
                role: 'user',
                content: `Please summarize the following educational notes:\n\n${text}`
            }
        ],
        max_tokens: 500
    });

    const summary = completion.choices[0].message.content;

    // Update note with summary
    note.aiSummary = summary;
    await note.save();

    // Increment user's AI usage
    await userService.incrementAIUsage(userId, 'summary');

    // Update user's AI streak
    const updatedUser = await userService.updateUserAIStreak(userId);

    // Check for and award badges
    const newlyAwardedSummaryBadges = await badgeService.checkAndAwardBadges(userId, 'ai_summary_generated');
    const newlyAwardedStreakBadges = await badgeService.checkAndAwardBadges(userId, 'ai_streak', { streak: updatedUser.streak.current });

    // Format response
    const allNewlyAwardedBadges = [...newlyAwardedSummaryBadges, ...newlyAwardedStreakBadges]
        .filter((v, i, a) => a.findIndex(t => t === v) === i); // Deduplicate

    let summaryStr = typeof summary === 'string' ? summary : (summary || undefined);

    return {
        data: { aiSummary: summaryStr },
        newlyAwardedBadges: (await Promise.all(allNewlyAwardedBadges.map(async badgeName => {
            const badge = await badgeService.getBadgeByName(badgeName);
            if (!badge) return undefined;
            return {
                badgeId: badge._id.toString(),
                name: badge.name,
                icon: (badge as any).icon || '',
                level: (badge as any).level || '',
                xpReward: (badge as any).xpReward || 0
            };
        }))).filter((b): b is IUserBadgeEarnedAPIResponse => !!b)
    };
  }

  public async generateAIFlashcardsForNote(noteId: string, userId: string): Promise<AIGenerationResponse<Pick<INote, 'flashcards'>>> {
    const note = await Note.findById(noteId);
    if (!note) {
        throw new NotFoundError('Note not found');
    }

    // Check user's AI quota
    await userService.checkUserQuota(userId, 'flashcard');

    // Extract text from the note's file
    const text = await extractTextFromFile(note.fileUrl);
    if (!text) {
        throw new BadRequestError('Could not extract text from file');
    }

    // Generate flashcards using OpenAI
    const completion = await openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a helpful assistant that creates educational flashcards. Create flashcards in the following JSON format:
                [
                    {
                        "question": "string",
                        "answer": "string",
                        "difficulty": "easy|medium|hard"
                    }
                ]
                Each flashcard MUST be a JSON object with "question" (string), "answer" (string), and "difficulty" (enum: '${FLASHCARD_DIFFICULTY_LEVELS.join('|')}') keys.`
            },
            {
                role: 'user',
                content: `Please create flashcards from the following educational notes:\n\n${text}`
            }
        ],
        max_tokens: 1000
    });

    const flashcardsText = completion.choices[0].message.content;
    let flashcards;
    try {
        flashcards = JSON.parse(flashcardsText);
    } catch (error) {
        throw new BadRequestError('Failed to parse AI-generated flashcards');
    }

    // Validate flashcard format
    if (!Array.isArray(flashcards)) {
        throw new BadRequestError('AI did not generate a valid array of flashcards');
    }

    // Update note with flashcards
    note.flashcards = flashcards;
    await note.save();

    // Increment user's AI usage
    await userService.incrementAIUsage(userId, 'flashcard');

    // Update user's AI streak
    const updatedUser = await userService.updateUserAIStreak(userId);

    // Check for and award badges
    const newlyAwardedFlashcardBadges = await badgeService.checkAndAwardBadges(userId, 'ai_flashcards_generated');
    const newlyAwardedStreakBadges = await badgeService.checkAndAwardBadges(userId, 'ai_streak', { streak: updatedUser.streak.current });

    // Format response
    const allNewlyAwardedBadges = [...newlyAwardedFlashcardBadges, ...newlyAwardedStreakBadges]
        .filter((v, i, a) => a.findIndex(t => t === v) === i); // Deduplicate

    return {
        data: { flashcards },
        newlyAwardedBadges: (await Promise.all(allNewlyAwardedBadges.map(async badgeName => {
            const badge = await badgeService.getBadgeByName(badgeName);
            if (!badge) return undefined;
            return {
                badgeId: badge._id.toString(),
                name: badge.name,
                icon: (badge as any).icon || '',
                level: (badge as any).level || '',
                xpReward: (badge as any).xpReward || 0
            };
        }))).filter((b): b is IUserBadgeEarnedAPIResponse => !!b)
    };
  }

  public async saveGeneratedFlashcardsToNote(noteId: string, userId: string, flashcardsToSave: Array<{ question: string; answer: string; difficulty?: string }>): Promise<INote | null> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new ErrorResponse('Note not found', 404);
    }
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to save flashcards to this note', 403);
    }

    // Validate flashcards basic structure before saving
    const validatedFlashcards = flashcardsToSave.filter(
      fc => 
        typeof fc.question === 'string' && fc.question.trim() !== '' &&
        typeof fc.answer === 'string' && fc.answer.trim() !== '' &&
        (fc.difficulty === undefined || (FLASHCARD_DIFFICULTY_LEVELS as ReadonlyArray<string>).includes(fc.difficulty))
    ).map(fc => ({
        question: fc.question.trim(),
        answer: fc.answer.trim(),
        difficulty: fc.difficulty || FLASHCARD_DIFFICULTY_LEVELS[1], // Default to medium
        // No need for createdBy, createdAt here as they are part of the Note subdocument schema if defined, or handled by Mongoose
    }));

    if (validatedFlashcards.length === 0) {
        throw new ErrorResponse('No valid flashcards provided to save.', 400);
    }

    note.flashcards = validatedFlashcards as any; // Cast needed as INoteFlashcard is a sub-document type
    // Consider adding a timestamp for when AI flashcards were last saved/confirmed by user
    // note.aiFlashcardsSavedAt = new Date(); 
    await note.save();

    // No need to increment quota here, as this is saving *already generated* cards.
    // Quota was incremented during generation.

    return note.populate({ path: 'user', select: 'name username profileImage' });
  }

  // ... other note service methods (create, update, delete, etc.)
}

export default NoteService; 