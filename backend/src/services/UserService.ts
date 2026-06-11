import User, { IUser, IUserActivity, IUserBadge } from '../models/User';
import Note, { INote } from '../models/Note';
import { QuotaExceededError, NotFoundError, BadRequestError } from '../utils/customErrors';
import mongoose, { SortOrder } from 'mongoose';
import { IBadge } from '../models/Badge';
import ErrorResponse from '../utils/errorResponse';
import bcrypt from 'bcryptjs';

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

export default class UserService {
    public static async getUsers(): Promise<IUser[]> {
        return await User.find();
    }

    public static async getUserById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    public static async getUserByUsername(username: string): Promise<IUser | null> {
        return await User.findOne({ username });
    }

    public static async createUser(userData: Partial<IUser>): Promise<IUser> {
        return await User.create(userData);
    }

    public static async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        return await User.findByIdAndUpdate(id, userData, {
            new: true,
            runValidators: true
        });
    }

    public static async deleteUser(id: string): Promise<IUser | null> {
        return await User.findByIdAndDelete(id);
    }

    public static async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(id).select('+password');
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        if (!user.password) {
            throw new ErrorResponse('User password not set', 400);
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new ErrorResponse('Current password is incorrect', 401);
        }

        user.password = newPassword;
        await user.save();
    }

    public static async getUserBadges(userId: string): Promise<IUserBadge[]> {
        const user = await User.findById(userId).populate('badges.badge');
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        return user.badges;
    }

    public static async getLeaderboard(options: LeaderboardQueryOptions): Promise<IUser[]> {
        const { timeframe, category, limit = 10 } = options as any;
        const sortOptions: Record<string, SortOrder> = { xp: -1 };

        let query: any = {};
        if (category) {
            query = { 'badges.badge.category': category };
        }

        return await User.find(query)
            .sort(sortOptions)
            .limit(limit);
    }

    private static async findUserForUpdate(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }

    public static async getUserPublicProfile(username: string): Promise<Partial<IUser> | null> {
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
    
    /**
     * Get user activity log with pagination and filtering
     * 
     * @param userId - The ID of the user whose activity to retrieve
     * @param queryOptions - Pagination and filtering options
     * @returns Paginated activity log with count and page information
     * @throws NotFoundError if the user doesn't exist
     */
    public static async getUserActivityLog(userId: string, queryOptions: UserActivityQueryOptions): Promise<PaginatedActivityResult> {
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
        
        // Filter by activity type if specified (accepts a comma-separated list)
        let filteredActivities = user.activity;
        if (queryOptions.type) {
            const types = queryOptions.type.split(',').map(t => t.trim()).filter(Boolean);
            filteredActivities = filteredActivities.filter(activity =>
                types.includes(activity.action)
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
    public static async getUserUploadedNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<PaginatedNotesResult> {
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
        const sortOptions: Record<string, SortOrder> = { [sortField]: sortOrder };

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
    public static async getUserFavoriteNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<PaginatedNotesResult> {
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
        const sortOptions: Record<string, SortOrder> = { [sortField]: sortOrder };

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
     * Update a user's study streak (consecutive days with completed study sessions)
     * @param userId - The ID of the user to update streak for
     * @returns The updated user object
     */
    public static async updateStudyStreak(userId: string): Promise<IUser> {
        const user = await this.findUserForUpdate(userId);
        const today = new Date();
        
        // Initialize streak on first study session
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
            // Same-day usage keeps the streak, but a fresh account starts
            // with current=0 and lastUsed defaulted to today - being active
            // today must still count as a 1-day streak.
            if ((user.streak.current ?? 0) < 1) {
                user.streak.current = 1;
                user.streak.max = Math.max(user.streak.max ?? 0, 1);
            }
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

    public static async addNoteToFavorites(userId: string, noteId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        // Ensure favoriteNotes exists
        if (!Array.isArray((user as any).favoriteNotes)) {
            (user as any).favoriteNotes = [];
        }
        // Add noteId if not already present
        if (!(user as any).favoriteNotes.some((id: any) => id.toString() === noteId)) {
            (user as any).favoriteNotes.push(noteId);
            await user.save();
        }
        return user;
    }

    public static async removeNoteFromFavorites(userId: string, noteId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        if (Array.isArray((user as any).favoriteNotes)) {
            (user as any).favoriteNotes = (user as any).favoriteNotes.filter((id: any) => id.toString() !== noteId);
            await user.save();
        }
        return user;
    }
} 