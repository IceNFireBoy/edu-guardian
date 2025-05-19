import User, { IUser, IUserActivity, IUserBadge } from '../models/User';
import Note, { INote } from '../models/Note';
import { QuotaExceededError, NotFoundError, BadRequestError } from '../utils/customErrors';
import { AI_USAGE_LIMITS, QUOTA_RESET_HOURS, AI_USER_TIERS } from '../config/aiConfig';
import mongoose from 'mongoose';
import { IBadge } from '../models/Badge';
import ErrorResponse from '../utils/errorResponse';

interface IBadgeEarned {
    badge: IBadge;
    earnedAt: Date;
    criteriaMet: string;
}

interface UserProfileData extends Partial<IUser> {
    stats?: {
        notesCount?: number;
        // Add more stats as needed (e.g., badgesCount, averageRatingOfNotes)
    };
    // Add other specific profile fields if they differ from IUser
}

interface LeaderboardResult {
    users: Partial<IUser>[];
    total: number;
}

interface LeaderboardQueryOptions {
    limit?: number;
    sortBy?: 'xp' | 'level' | 'currentStreak' | 'longestStreak'; // Limit to valid sort options
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime'; // Optional future enhancement
}

interface PaginatedActivityResult {
    activities: IUserActivity[];
    count: number;
    totalPages: number;
    currentPage: number;
}

interface UserActivityQueryOptions {
    page?: number;
    limit?: number;
    type?: string; // Filter by activity type e.g. 'login', 'upload_note'
    sortBy?: string; // e.g., 'timestamp'
    sortOrder?: 'asc' | 'desc';
}

interface PaginatedNotesResult {
    notes: INote[];
    count: number;
    totalPages: number;
    currentPage: number;
}

interface UserNotesQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // Add other note filters if necessary e.g. by subject, grade for user's notes
}

export class UserService {
    public async getUsers(): Promise<IUser[]> {
        // TODO: Implement pagination and filtering if necessary for admin views
        return User.find().select('-password').lean();
    }

    public async getUserById(userId: string): Promise<IUser | null> {
        // Ensure to fetch the full user document for updates, not lean() if we need to save.
        // For methods that modify and save, we should fetch the Mongoose document.
        // For read-only, .lean() is fine.
        return User.findById(userId).select('-password').lean(); 
    }

    private async findUserForUpdate(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }

    public async createUser(userData: Partial<IUser>): Promise<IUser> {
        // Password hashing is handled by pre-save hook in User model
        const user = new User(userData);
        await user.save();
        // Return user without password
        const userObject = user.toObject();
        delete userObject.password;
        return userObject as IUser;
    }

    public async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        // Ensure password is not updated directly through this admin route
        // If password reset is needed for admin, create a separate secure method
        if (updateData.password) {
            delete updateData.password;
        }
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password').lean();
        return user;
    }

    public async deleteUser(userId: string): Promise<boolean> {
        const user = await User.findById(userId);
        if (!user) {
            return false;
        }
        // Consider what to do with user's content (notes, etc.) - soft delete or reassign?
        // For now, hard delete user document.
        await user.deleteOne(); 
        return true;
    }

    public async getUserPublicProfile(username: string): Promise<Partial<IUser> | null> {
        // Fetch user by username, select only public fields
        const user = await User.findOne({ username })
            .select('username name profileImage biography badges activity level xp currentStreak longestStreak createdAt subjects') // Customize fields
            .populate({
                path: 'badges.badge',
                select: 'name description icon rarity'
            })
            .lean();
        if (!user) {
            return null;
        }
        // Potentially further process or limit activity data shown on public profile
        if (user.activity && user.activity.length > 0) {
            user.activity = user.activity.slice(0, 5); // Example: show last 5 public activities
        }
        return user;
    }
    
    public async getUserBadges(userId: string): Promise<IBadgeEarned[]> {
        const user = await User.findById(userId)
            .select('badges')
            .populate({
                path: 'badges.badge',
                select: 'name description icon rarity level xpReward' // Ensure Badge model fields
            })
            .lean();
        if (!user || !user.badges) return [];
        // Map badges to IBadgeEarned
        return user.badges.map((b: IUserBadge & { badge: IBadge }) => ({
            badge: b.badge,
            earnedAt: b.earnedAt,
            criteriaMet: b.criteriaMet
        }));
    }
    
    /**
     * Get user activity log with pagination and filtering
     * 
     * @param userId - The ID of the user whose activity to retrieve
     * @param queryOptions - Pagination and filtering options
     * @returns Paginated activity log with count and page information
     * @throws NotFoundError if the user doesn't exist
     */
    public async getUserActivityLog(userId: string, queryOptions: UserActivityQueryOptions): Promise<PaginatedActivityResult> {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorResponse('Invalid user ID format', 400);
        }
        
        // Find user with activities
        const user = await User.findById(userId).select('activity');
        if (!user) {
            throw new NotFoundError('User not found');
        }
        
        // If user has no activities, return empty result
        if (!user.activity?.length) {
            return { 
                activities: [], 
                count: 0, 
                totalPages: 1, 
                currentPage: 1 
            };
        }
        
        // Apply pagination with validation
        const page = Math.max(queryOptions.page ?? 1, 1); // Ensure minimum page is 1
        const limit = Math.min(queryOptions.limit ?? 20, 100); // Cap max limit at 100
        
        // Filter by activity type if specified
        let filteredActivities = user.activity;
        if (queryOptions.type) {
            filteredActivities = filteredActivities.filter(activity => 
                activity.action === queryOptions.type
            );
        }
        
        // Sort activities
        const sortField = queryOptions.sortBy ?? 'timestamp';
        const sortOrder = queryOptions.sortOrder === 'asc' ? 1 : -1;
        
        filteredActivities.sort((a, b) => {
            const aValue = sortField === 'timestamp' ? new Date(a.timestamp).getTime() : (a as any)[sortField];
            const bValue = sortField === 'timestamp' ? new Date(b.timestamp).getTime() : (b as any)[sortField];
            return (aValue > bValue ? 1 : -1) * sortOrder;
        });
        
        // Get total count
        const count = filteredActivities.length;
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, count);
        const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
        
        return {
            activities: paginatedActivities,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    /**
     * Get notes uploaded by a specific user with pagination
     * 
     * @param userId - The ID of the user whose notes to retrieve
     * @param queryOptions - Pagination and filtering options
     * @returns Paginated notes with count and page information
     * @throws NotFoundError if the user doesn't exist
     */
    public async getUserUploadedNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<PaginatedNotesResult> {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorResponse('Invalid user ID format', 400);
        }
        
        // Verify user exists
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            throw new NotFoundError('User not found');
        }
        
        // Apply pagination with validation
        const page = Math.max(queryOptions.page ?? 1, 1); // Ensure minimum page is 1
        const limit = Math.min(queryOptions.limit ?? 10, 50); // Cap max limit at 50
        const skip = (page - 1) * limit;
        
        // Determine sort options
        const sortField = queryOptions.sortBy ?? 'createdAt';
        const sortOrder = queryOptions.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        // Query for notes
        const notes = await Note.find({ user: userId })
                              .sort(sortOptions)
                              .skip(skip)
                              .limit(limit)
                              .populate({ path: 'user', select: 'name username profileImage' })
                              .lean();
                              
        // Get total count
        const count = await Note.countDocuments({ user: userId });
        
        return { 
            notes, 
            count, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page 
        };
    }

    /**
     * Get notes favorited by a specific user with pagination
     * 
     * @param userId - The ID of the user whose favorite notes to retrieve
     * @param queryOptions - Pagination and filtering options
     * @returns Paginated notes with count and page information
     * @throws NotFoundError if the user doesn't exist
     */
    public async getUserFavoriteNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<PaginatedNotesResult> {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorResponse('Invalid user ID format', 400);
        }
        
        // Find user and get favorite notes
        const user = await User.findById(userId).select('favoriteNotes');
        if (!user) {
            throw new NotFoundError('User not found');
        }
        
        // If user has no favorites, return empty result
        if (!user.favoriteNotes?.length) {
            return { 
                notes: [], 
                count: 0, 
                totalPages: 1, 
                currentPage: 1 
            };
        }
        
        // Apply pagination with validation
        const page = Math.max(queryOptions.page ?? 1, 1); // Ensure minimum page is 1
        const limit = Math.min(queryOptions.limit ?? 10, 50); // Cap max limit at 50
        const skip = (page - 1) * limit;
        
        // Determine sort options
        const sortField = queryOptions.sortBy ?? 'createdAt';
        const sortOrder = queryOptions.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        // Query for notes, ensuring only public or user-owned notes are returned
        // This addresses potential privacy concerns if a note was made private after being favorited
        const notes = await Note.find({ 
            _id: { $in: user.favoriteNotes },
            $or: [
                { isPublic: true },
                { user: userId }
            ]
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'user', select: 'name username profileImage' })
        .lean();
        
        // Get total count of accessible favorite notes
        const count = await Note.countDocuments({ 
            _id: { $in: user.favoriteNotes },
            $or: [
                { isPublic: true },
                { user: userId }
            ]
        });
        
        return { 
            notes, 
            count, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page 
        };
    }

    /**
     * Add a note to a user's favorites list
     * 
     * @param userId - The ID of the user adding the note to favorites
     * @param noteId - The ID of the note to add to favorites
     * @throws ErrorResponse if the note is not found or not accessible
     */
    public async addNoteToFavorites(userId: string, noteId: string): Promise<void> {
        // Validate that noteId exists, is a valid ObjectId, and the note is public or owned by the user
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            throw new ErrorResponse('Invalid note ID format', 400);
        }
        
        const note = await Note.findById(noteId);
        if (!note) {
            throw new ErrorResponse('Note not found', 404);
        }
        
        // Check if the note is public or owned by the user
        if (!note.isPublic && note.user.toString() !== userId) {
            throw new ErrorResponse('Cannot add private note of another user to favorites', 403);
        }
        
        // Use findUserForUpdate to ensure user exists
        const user = await this.findUserForUpdate(userId);
        
        // Add to favorites if not already there
        if (!user.favoriteNotes.some(id => id.toString() === noteId)) {
            user.favoriteNotes.push(new mongoose.Types.ObjectId(noteId));
            await user.save();
        }
    }

    /**
     * Remove a note from a user's favorites list
     * 
     * @param userId - The ID of the user removing the note from favorites
     * @param noteId - The ID of the note to remove from favorites
     * @throws ErrorResponse if the user or note ID is invalid
     */
    public async removeNoteFromFavorites(userId: string, noteId: string): Promise<void> {
        // Validate noteId format
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            throw new ErrorResponse('Invalid note ID format', 400);
        }
        
        // Use findUserForUpdate to ensure user exists
        const user = await this.findUserForUpdate(userId);
        
        // Remove from favorites if present
        const noteIndex = user.favoriteNotes.findIndex(id => id.toString() === noteId);
        if (noteIndex !== -1) {
            user.favoriteNotes.splice(noteIndex, 1);
            await user.save();
        }
        // No error if note wasn't in favorites - operation is idempotent
    }
    
    /**
     * Get a leaderboard of users sorted by achievements
     * 
     * @param options - Leaderboard query options (limit, sortBy, timeframe)
     * @returns An object containing the leaderboard users and total count
     */
    public async getLeaderboard(options: LeaderboardQueryOptions): Promise<LeaderboardResult> {
        // Validate and sanitize options
        const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 10; // Cap max at 100
        const sortBy = options.sortBy || 'xp';
        
        // Create sort criteria object for MongoDB
        const sortCriteria: { [key: string]: 1 | -1 } = { [sortBy]: -1 }; // Always descending for leaderboard
        
        // For tie-breaking and consistent ordering, add a secondary sort by _id
        sortCriteria._id = 1;
        
        // Build query - only include users with public profiles
        const query = { emailVerified: true }; // Only include verified users
        
        // Count total users that match the query
        const total = await User.countDocuments(query);
        
        // Select fields relevant for leaderboard display
        const users = await User.find(query)
            .sort(sortCriteria)
            .limit(limit)
            .select('username name profileImage xp level streak.current streak.max createdAt')
            .lean();
            
        return {
            users,
            total
        };
    }

    // New AI Quota and Streak Methods

    /**
     * Helper method to check if a user's AI quota should be reset
     * @param user - The user object to check
     * @returns - True if quota should be reset, false otherwise
     */
    private isQuotaResetDue(user: IUser): boolean {
        const now = new Date();
        const lastReset = user.aiUsage.lastReset || new Date(0);
        const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastReset >= QUOTA_RESET_HOURS;
    }
    
    /**
     * Reset a user's AI quota
     * @param user - The user object to reset quota for
     */
    private resetUserQuota(user: IUser): void {
        user.aiUsage.summaryUsed = 0;
        user.aiUsage.flashcardUsed = 0;
        user.aiUsage.lastReset = new Date();
    }

    /**
     * Check if a user has exceeded their AI quota
     * @param userId - The ID of the user to check
     * @param type - The type of AI feature to check (summary or flashcard)
     * @throws QuotaExceededError if the user has exceeded their quota
     */
    public async checkUserQuota(userId: string, type: 'summary' | 'flashcard'): Promise<void> {
        const user = await this.findUserForUpdate(userId);

        // Admin/Premium bypass
        if (user.role === AI_USER_TIERS.ADMIN /* || user.subscription === AI_USER_TIERS.PREMIUM */) {
            return;
        }

        // Check if quota reset is due and reset if necessary
        if (this.isQuotaResetDue(user)) {
            this.resetUserQuota(user);
            await user.save();
        }

        // Check if quota is exceeded based on type
        if (type === 'summary' && user.aiUsage.summaryUsed >= AI_USAGE_LIMITS.SUMMARY_PER_DAY) {
            throw new QuotaExceededError('Daily summary generation limit reached.');
        }

        if (type === 'flashcard' && user.aiUsage.flashcardUsed >= AI_USAGE_LIMITS.FLASHCARDS_PER_DAY) {
            throw new QuotaExceededError('Daily flashcard generation limit reached.');
        }
    }

    /**
     * Increment a user's AI usage counter
     * @param userId - The ID of the user to increment usage for
     * @param type - The type of AI feature to increment (summary or flashcard)
     */
    public async incrementAIUsage(userId: string, type: 'summary' | 'flashcard'): Promise<void> {
        const user = await this.findUserForUpdate(userId);

        // Check if quota reset is due and reset if necessary
        if (this.isQuotaResetDue(user)) {
            this.resetUserQuota(user);
        }

        // Increment usage based on type
        if (type === 'summary') {
            user.aiUsage.summaryUsed += 1;
            user.totalSummariesGenerated += 1;
        } else if (type === 'flashcard') {
            user.aiUsage.flashcardUsed += 1;
            user.totalFlashcardsGenerated += 1;
        } else {
            throw new BadRequestError('Invalid AI usage type specified.');
        }

        await user.save();
    }

    /**
     * Update a user's AI streak
     * @param userId - The ID of the user to update streak for
     * @returns The updated user object
     */
    public async updateUserAIStreak(userId: string): Promise<IUser> {
        const user = await this.findUserForUpdate(userId);
        const today = new Date();
        
        // Initialize streak if it's the first AI usage
        if (!user.streak.lastUsed) {
            user.streak.current = 1;
            user.streak.max = 1;
            user.streak.lastUsed = today;
            await user.save();
            return user.toObject({ virtuals: true }) as IUser;
        }

        // Calculate days since last use
        const lastUsed = new Date(user.streak.lastUsed);
        
        // Normalize dates to compare date part only
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const lastUsedDateOnly = new Date(lastUsed.getFullYear(), lastUsed.getMonth(), lastUsed.getDate());
        
        const diffTime = todayDateOnly.getTime() - lastUsedDateOnly.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Update streak based on days difference
        if (diffDays === 0) {
            // Same day usage, no streak change
        } else if (diffDays === 1) {
            // Used yesterday, increment streak
            user.streak.current = (user.streak.current ?? 0) + 1;
            user.streak.max = Math.max(user.streak.max ?? 0, user.streak.current);
        } else {
            // Gap in usage, reset streak
            user.streak.current = 1;
        }
        
        user.streak.lastUsed = today;
        await user.save();
        return user.toObject({ virtuals: true }) as IUser;
    }
}

export default UserService; 