import User, { IUser, IUserActivity } from '../models/User';
import Note, { INote } from '../models/Note';
import { QuotaExceededError, NotFoundError, BadRequestError } from '../utils/customErrors';
import { AI_USAGE_LIMITS, QUOTA_RESET_HOURS, AI_USER_TIERS } from '../config/aiConfig';
import mongoose from 'mongoose';

interface UserProfileData extends Partial<IUser> {
    stats?: {
        notesCount?: number;
        // Add more stats as needed (e.g., badgesCount, averageRatingOfNotes)
    };
    // Add other specific profile fields if they differ from IUser
}

interface LeaderboardQueryOptions {
    limit?: number;
    sortBy?: string; // e.g., 'xp', 'level', 'currentStreak'
    // Potentially add time period filters e.g. 'weekly', 'monthly'
}

interface UserActivityQueryOptions {
    page?: number;
    limit?: number;
    type?: string; // Filter by activity type e.g. 'login', 'upload_note'
    sortBy?: string; // e.g., 'createdAt'
    sortOrder?: 'asc' | 'desc';
}

interface UserNotesQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // Add other note filters if necessary e.g. by subject, grade for user's notes
}

class UserService {
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
        if (user.activity) {
            (user as any).activity = user.activity.slice(0, 5); // Example: show last 5 public activities
        }
        return user;
    }
    
    public async getUserBadges(userId: string): Promise<IBadgeEarned[]> {
        const user = await User.findById(userId)
            .select('badges')
            .populate({
                path: 'badges.badge',
                select: 'name description icon rarity' // Ensure Badge model fields
            })
            .lean();
        return user ? user.badges : [];
    }
    
    public async getUserActivityLog(userId: string, queryOptions: UserActivityQueryOptions): Promise<IUserActivity[]> {
        // TODO: Implement actual fetching of activity logs with pagination and filtering.
        // This should interact with User.activity or a separate ActivityLog collection.
        const user = await User.findById(userId).select('activity').lean();
        if (!user) return [];
        // Basic sort and limit for placeholder
        let activities = user.activity.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if(queryOptions.limit) {
            activities = activities.slice(0, queryOptions.limit);
        }
        return activities;
    }

    public async getUserUploadedNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<any> { // Return type to be defined based on pagination structure
        // TODO: Query the Note model for notes where user field matches userId.
        // Apply pagination and filtering from queryOptions.
        const page = queryOptions.page || 1;
        const limit = queryOptions.limit || 10;
        const skip = (page - 1) * limit;

        const notes = await Note.find({ user: userId })
                                .sort({ createdAt: -1 }) // Example sort
                                .skip(skip)
                                .limit(limit)
                                .populate({path: 'user', select: 'name username'})
                                .lean();
        const count = await Note.countDocuments({ user: userId });
        return { notes, count, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    public async getUserFavoriteNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<any> { // Return type to be defined
        // TODO: Assuming User model has a 'favorites' array of Note IDs.
        // Fetch notes whose IDs are in the user's favorites list.
        // Apply pagination and filtering.
        const user = await User.findById(userId).select('favoriteNotes').lean();
        if (!user || !user.favoriteNotes || user.favoriteNotes.length === 0) {
            return { notes: [], count: 0, totalPages: 1, currentPage: 1 };
        }
        const page = queryOptions.page || 1;
        const limit = queryOptions.limit || 10;
        const skip = (page - 1) * limit;

        const notes = await Note.find({ _id: { $in: user.favoriteNotes } })
                                .sort({ createdAt: -1 }) // Example sort
                                .skip(skip)
                                .limit(limit)
                                .populate({path: 'user', select: 'name username'})
                                .lean();
        const count = await Note.countDocuments({ _id: { $in: user.favoriteNotes } });
        return { notes, count, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    public async addNoteToFavorites(userId: string, noteId: string): Promise<void> {
        // TODO: Validate noteId exists and is public/accessible if necessary
        const note = await Note.findById(noteId);
        if (!note) {
            throw new ErrorResponse('Note not found', 404);
        }
        // Add to $addToSet to avoid duplicates
        await User.findByIdAndUpdate(userId, { $addToSet: { favoriteNotes: noteId } });
    }

    public async removeNoteFromFavorites(userId: string, noteId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { $pull: { favoriteNotes: noteId } });
    }
    
    public async getLeaderboard(options: LeaderboardQueryOptions): Promise<Partial<IUser>[]> {
        const { limit = 10, sortBy = 'xp' } = options;
        const sortCriteria: { [key: string]: 1 | -1 } = {};
        if (sortBy === 'xp' || sortBy === 'level' || sortBy === 'currentStreak' || sortBy === 'longestStreak') {
            sortCriteria[sortBy] = -1; // Descending for these fields
        } else {
            sortCriteria['xp'] = -1; // Default to XP if sortBy is invalid
        }

        // Select fields relevant for leaderboard display
        const users = await User.find()
            .sort(sortCriteria)
            .limit(limit)
            .select('username name profileImage xp level currentStreak longestStreak') // Customize as needed
            .lean();
        return users;
    }

    // New AI Quota and Streak Methods

    public async checkUserQuota(userId: string, type: 'summary' | 'flashcard'): Promise<void> {
        const user = await this.findUserForUpdate(userId);

        // Admin/Premium bypass (Example - assuming 'premium' role or a subscription field)
        if (user.role === AI_USER_TIERS.ADMIN /* || user.subscription === AI_USER_TIERS.PREMIUM */) {
            return; // Bypass quota for admins or premium users
        }

        const now = new Date();
        const lastReset = user.aiUsage.lastReset || new Date(0); // Handle if lastReset is null/undefined
        const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastReset >= QUOTA_RESET_HOURS) {
            user.aiUsage.summaryUsed = 0;
            user.aiUsage.flashcardUsed = 0;
            user.aiUsage.lastReset = now;
        }

        if (type === 'summary' && user.aiUsage.summaryUsed >= AI_USAGE_LIMITS.SUMMARY_PER_DAY) {
            throw new QuotaExceededError('Daily summary generation limit reached.');
        }

        if (type === 'flashcard' && user.aiUsage.flashcardUsed >= AI_USAGE_LIMITS.FLASHCARDS_PER_DAY) {
            throw new QuotaExceededError('Daily flashcard generation limit reached.');
        }
        
        // Save user if quota was reset
        if (hoursSinceLastReset >= QUOTA_RESET_HOURS) {
            await user.save();
        }
    }

    public async incrementAIUsage(userId: string, type: 'summary' | 'flashcard'): Promise<void> {
        const user = await this.findUserForUpdate(userId);

        if (type === 'summary') {
            user.aiUsage.summaryUsed += 1;
            user.totalSummariesGenerated += 1; // Increment lifetime count
        } else if (type === 'flashcard') {
            user.aiUsage.flashcardUsed += 1;
            user.totalFlashcardsGenerated += 1; // Increment lifetime count
        } else {
            // Should not happen if types are correctly passed
            throw new BadRequestError('Invalid AI usage type specified.');
        }
        
        // Ensure lastReset is current if this is the first usage in a reset cycle
        // This check could be redundant if checkUserQuota is always called first and resets it
        const now = new Date();
        const lastReset = user.aiUsage.lastReset || new Date(0);
        const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReset >= QUOTA_RESET_HOURS) {
             // This implies checkUserQuota wasn't called or didn't save.
             // To be safe, reset here too if a long time has passed.
            user.aiUsage.summaryUsed = type === 'summary' ? 1 : 0;
            user.aiUsage.flashcardUsed = type === 'flashcard' ? 1 : 0;
            user.aiUsage.lastReset = now;
        }


        await user.save();
    }

    public async updateUserAIStreak(userId: string): Promise<IUser> {
        const user = await this.findUserForUpdate(userId);
        const today = new Date();
        const lastUsed = user.streak.lastUsed ? new Date(user.streak.lastUsed) : null;

        // Normalize dates to compare date part only
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (!lastUsed) { // First time AI usage or streak was never initiated
            user.streak.current = 1;
        } else {
            const lastUsedDateOnly = new Date(lastUsed.getFullYear(), lastUsed.getMonth(), lastUsed.getDate());
            const diffTime = todayDateOnly.getTime() - lastUsedDateOnly.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) { // Used yesterday
                user.streak.current = (user.streak.current || 0) + 1;
            } else if (diffDays > 1) { // Gap of more than one day
                user.streak.current = 1; // Reset streak, starting new one today
            } else if (diffDays === 0) {
                // Used today already, streak count doesn't change for multiple uses on the same day.
                // No change to user.streak.current needed.
            } else { 
                 // This case (diffDays < 0) should ideally not happen if system time is correct.
                 // Or if lastUsed is in the future. Treat as a new streak or log an anomaly.
                 user.streak.current = 1; 
            }
        }

        if (user.streak.current > (user.streak.max || 0)) {
            user.streak.max = user.streak.current;
        }
        
        user.streak.lastUsed = today;
        await user.save();
        return user.toObject({ virtuals: true }) as IUser; // Return updated user
    }
}

export default new UserService(); 