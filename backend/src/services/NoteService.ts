import Note, { INote } from '../models/Note';
import { IUser } from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import BadgeService from './BadgeService';
import UserService from './UserService';
import { Types } from 'mongoose';
import { NotFoundError, BadRequestError, QuotaExceededError } from '../utils/customErrors'; // Import if needed directly
import { FilterQuery, PopulateOptions } from 'mongoose';
import { extractTextFromFile } from '../utils/extractTextFromFile';
import OpenAI from 'openai';
import { OPENAI_CHAT_MODEL, AI_FEATURE_TYPES, FLASHCARD_DIFFICULTY_LEVELS, IUserBadgeEarnedAPIResponse } from '../config/constants'; // Import constants & new type

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

  public async generateAISummary(noteId: string, userId: string): Promise<string> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new ErrorResponse('Note not found', 404);
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    await UserService.checkUserQuota(userId, 'summary');

    // Simulate AI summary generation
    const summary = `AI-generated summary for note: ${note.title}`;

    note.aiSummary = summary;
    await note.save();

    await UserService.incrementAIUsage(userId, 'summary');
    await UserService.updateUserAIStreak(userId);

    return summary;
  }

  public async generateAIFlashcards(noteId: string, userId: string): Promise<Array<{ question: string; answer: string; difficulty: string }>> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new ErrorResponse('Note not found', 404);
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    await UserService.checkUserQuota(userId, 'flashcard');

    // Simulate AI flashcard generation
    const flashcards = [
      {
        question: 'Sample question 1',
        answer: 'Sample answer 1',
        difficulty: 'easy'
      },
      {
        question: 'Sample question 2',
        answer: 'Sample answer 2',
        difficulty: 'medium'
      }
    ];

    note.flashcards = flashcards as any; // Cast to any to satisfy INoteFlashcard[]
    await note.save();

    await UserService.incrementAIUsage(userId, 'flashcard');
    await UserService.updateUserAIStreak(userId);

    return flashcards;
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
    
    await note.save();
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
    
    await note.save();
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

  /**
   * Common helper to process badge awards after AI processing
   * @param userId - ID of the user to process badges for
   * @param aiFeatureType - Type of AI feature used (summary or flashcard)
   * @param updatedUser - User object after streak update
   * @returns Array of newly awarded badges
   */
  private async processAIFeatureBadges(
    userId: string, 
    aiFeatureType: 'ai_summary_generated' | 'ai_flashcards_generated', 
    updatedUser: IUser
  ): Promise<IUserBadgeEarnedAPIResponse[]> {
    // Check for and award badges
    const newlyAwardedFeatureBadges = await BadgeService.checkAndAwardBadges(userId, aiFeatureType, {});
    const newlyAwardedStreakBadges = await BadgeService.checkAndAwardBadges(
      userId, 
      'ai_streak', 
      { streak: updatedUser.streak.current }
    );

    // Combine and deduplicate badges
    const allNewlyAwardedBadges = [...newlyAwardedFeatureBadges, ...newlyAwardedStreakBadges]
      .filter((v, i, a) => a.findIndex(t => t === v) === i);

    // Format for API response
    return (await Promise.all(allNewlyAwardedBadges.map(async badgeName => {
      const badge = await BadgeService.getBadgeByName(badgeName);
      if (!badge) return undefined;
      return {
        badgeId: badge._id.toString(),
        name: badge.name,
        icon: (badge as any).icon ?? '',
        level: (badge as any).level ?? '',
        xpReward: (badge as any).xpReward ?? 0
      };
    }))).filter((b): b is IUserBadgeEarnedAPIResponse => !!b);
  }

  /**
   * Common validation for AI generation methods
   * @param noteId - ID of the note to validate
   * @param userId - ID of the user requesting AI processing
   * @returns The validated note object
   */
  private async validateNoteForAIProcessing(noteId: string, userId: string): Promise<INote> {
    // Validate note exists
    const note = await Note.findById(noteId);
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    // Validate note has file URL
    if (!note.fileUrl) {
      throw new BadRequestError('Note has no associated file');
    }

    return note;
  }

  /**
   * Generate an AI summary for a note
   * @param noteId - ID of the note to generate summary for
   * @param userId - ID of the user requesting summary
   * @returns Summary data and any newly awarded badges
   */
  public async generateAISummaryForNote(noteId: string, userId: string): Promise<AIGenerationResponse<Partial<INote>>> {
    const note = await this.validateNoteForAIProcessing(noteId, userId);

    // Check user's AI quota
    await UserService.checkUserQuota(userId, 'summary');

    // Extract text from the note's file
    const text = await extractTextFromFile(note.fileUrl);
    if (!text) {
      throw new BadRequestError('Could not extract text from file');
    }

    try {
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
      note.aiSummary = summary ?? undefined;
      await note.save();

      // Increment user's AI usage
      await UserService.incrementAIUsage(userId, 'summary');

      // Update user's AI streak
      const updatedUser = await UserService.updateUserAIStreak(userId);

      // Process badges
      const badges = await this.processAIFeatureBadges(userId, 'ai_summary_generated', updatedUser);

      // Format string summary
      let summaryStr = typeof summary === 'string' ? summary : (summary ?? undefined);

      return {
        data: { aiSummary: summaryStr },
        newlyAwardedBadges: badges
      };
    } catch (error) {
      // Handle OpenAI API errors specifically
      if (error.response?.status) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error?.message || 'Error communicating with AI service';
        throw new BadRequestError(`AI Service Error (${status}): ${errorMessage}`);
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Generate AI flashcards for a note
   * @param noteId - ID of the note to generate flashcards for
   * @param userId - ID of the user requesting flashcards
   * @returns Flashcard data and any newly awarded badges
   */
  public async generateAIFlashcardsForNote(noteId: string, userId: string): Promise<AIGenerationResponse<Pick<INote, 'flashcards'>>> {
    const note = await this.validateNoteForAIProcessing(noteId, userId);

    // Check user's AI quota
    await UserService.checkUserQuota(userId, 'flashcard');

    // Extract text from the note's file
    const text = await extractTextFromFile(note.fileUrl);
    if (!text) {
      throw new BadRequestError('Could not extract text from file');
    }

    try {
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
      let flashcards: { question: string; answer: string; difficulty: string }[] = [];
      
      try {
        flashcards = this.parseAndValidateFlashcards(flashcardsText || '');
      } catch (parseError) {
        throw new BadRequestError(`Failed to parse flashcards: ${parseError.message}`);
      }

      // Store the generated flashcards for later confirmation
      const result = await this.saveGeneratedFlashcardsToNote(noteId, userId, flashcards);
      
      if (!result) {
        throw new NotFoundError('Note not found after flashcard generation');
      }

      // Increment user's AI usage
      await UserService.incrementAIUsage(userId, 'flashcard');

      // Update user's AI streak
      const updatedUser = await UserService.updateUserAIStreak(userId);

      // Process badges
      const badges = await this.processAIFeatureBadges(userId, 'ai_flashcards_generated', updatedUser);

      return {
        data: { flashcards: result.flashcards },
        newlyAwardedBadges: badges
      };
    } catch (error) {
      // Handle OpenAI API errors specifically
      if (error.response?.status) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error?.message || 'Error communicating with AI service';
        throw new BadRequestError(`AI Service Error (${status}): ${errorMessage}`);
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Parse and validate flashcards from JSON string
   * @param flashcardsText - JSON string containing flashcards
   * @returns Array of validated flashcards
   */
  private parseAndValidateFlashcards(flashcardsText: string): { question: string; answer: string; difficulty: string }[] {
    // Try to parse JSON, with multiple fallback strategies
    let parsed;
    try {
      parsed = JSON.parse(flashcardsText);
    } catch (e) {
      // Try to extract JSON from text (if OpenAI included markdown or explanation)
      const jsonMatch = flashcardsText.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch (e2) {
          throw new Error('Could not parse JSON from response');
        }
      } else {
        throw new Error('Invalid JSON format');
      }
    }

    // Validate array structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array of flashcards');
    }

    // Validate each flashcard
    return parsed.map((fc, index) => {
      if (!fc.question || typeof fc.question !== 'string') {
        throw new Error(`Flashcard ${index + 1} is missing a valid question`);
      }
      if (!fc.answer || typeof fc.answer !== 'string') {
        throw new Error(`Flashcard ${index + 1} is missing a valid answer`);
      }
      
      // Validate difficulty or use default
      const validDifficulties = ['easy', 'medium', 'hard'];
      let difficulty = 'medium';
      
      if (fc.difficulty && typeof fc.difficulty === 'string') {
        const normalizedDifficulty = fc.difficulty.toLowerCase();
        if (validDifficulties.includes(normalizedDifficulty)) {
          difficulty = normalizedDifficulty;
        }
      }
      
      return {
        question: fc.question,
        answer: fc.answer,
        difficulty
      };
    });
  }

  /**
   * Save generated flashcards to a note
   * 
   * @param noteId - ID of the note to save flashcards to
   * @param userId - ID of the user saving the flashcards
   * @param flashcardsToSave - Array of flashcards to save
   * @returns The updated note with flashcards, or null if note not found
   */
  public async saveGeneratedFlashcardsToNote(
    noteId: string, 
    userId: string, 
    flashcardsToSave: Array<{ question: string; answer: string; difficulty?: string }>
  ): Promise<INote | null> {
    // Validate note exists and user has permission
    const note = await Note.findById(noteId);
    if (!note) {
      return null;
    }
    
    // Check if user has permission to modify note
    if (note.user.toString() !== userId) {
      throw new ErrorResponse('User not authorized to modify this note', 403);
    }
    
    // Validate flashcards
    if (!Array.isArray(flashcardsToSave) || flashcardsToSave.length === 0) {
      throw new BadRequestError('No valid flashcards provided');
    }
    
    // Clear existing flashcards and add new ones
    note.flashcards = [];
    
    // Add each flashcard with validation
    flashcardsToSave.forEach(fc => {
      if (!fc.question || !fc.answer) {
        return; // Skip invalid flashcards
      }
      
      // Normalize difficulty
      const validDifficulties = ['easy', 'medium', 'hard'];
      let difficulty = 'medium'; // Default
      
      if (fc.difficulty && typeof fc.difficulty === 'string') {
        const normalizedDifficulty = fc.difficulty.toLowerCase();
        if (validDifficulties.includes(normalizedDifficulty)) {
          difficulty = normalizedDifficulty;
        }
      }
      
      // Add to note
      note.flashcards.push({
        question: fc.question,
        answer: fc.answer,
        difficulty: difficulty as 'easy' | 'medium' | 'hard'
      } as any);
    });
    
    // Save note
    try {
      await note.save();
      return note;
    } catch (error) {
      throw new BadRequestError(`Failed to save flashcards: ${error.message}`);
    }
  }
} 