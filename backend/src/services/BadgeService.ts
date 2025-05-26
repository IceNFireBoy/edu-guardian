import { Badge } from '../models/Badge';
import { User } from '../models/User';
import { IBadge } from '../models/Badge';
import { IUser, IUserBadge } from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import { Types } from 'mongoose';

// Define a more specific interface for event data
interface BadgeEventData {
    noteId?: string;
    duration?: number;
    flashcardsReviewed?: number;
    streak?: number;
    [key: string]: any; // Allow for additional properties while still having type safety for common ones
}

interface BadgeCriteriaFunction {
    (user: IUser, eventData?: BadgeEventData): Promise<boolean> | boolean;
}

const BADGE_CRITERIA: Record<string, BadgeCriteriaFunction> = {
    note_created: async (user: IUser) => {
        return (user as any).totalNotes >= 5;
    },
    login_streak_3: async (user: IUser) => {
        return user.streak.current >= 3;
    },
    login_streak_7: async (user: IUser) => {
        return user.streak.current >= 7;
    },
    login_streak_30: async (user: IUser) => {
        return user.streak.current >= 30;
    },
    first_upload: async (user: IUser) => {
        const uploadCount = user.activity.filter(a => a.action === 'upload').length;
        return uploadCount >= 1;
    },
    first_comment: async (user: IUser) => {
        const commentCount = user.activity.filter(a => a.action === 'comment').length;
        return commentCount >= 1;
    },
    first_share: async (user: IUser) => {
        const shareCount = user.activity.filter(a => a.action === 'share').length;
        return shareCount >= 1;
    },
    ai_novice: async (user: IUser) => {
        const aiSummaryCount = user.activity.filter(a => a.action === 'ai_summary_generated').length;
        return aiSummaryCount >= 1;
    },
    flashcard_fanatic: async (user: IUser) => {
        const flashcardCount = user.activity.filter(a => a.action === 'ai_flashcards_generated').length;
        return flashcardCount >= 1;
    }
};

export default class BadgeService {
    public static async getBadges(): Promise<IBadge[]> {
        const badges = await Badge.find({ isActive: true }).sort({ displayOrder: 1 });
        return badges.map(badge => badge as IBadge);
    }

    public static async getBadgeById(id: string): Promise<any | null> {
        const badge = await Badge.findById(id);
        if (!badge) return null;
        const obj = badge.toObject();
        return {
            ...obj,
            _id: String(obj._id)
        };
    }

    public static async getBadgeByName(name: string): Promise<any | null> {
        const badge = await Badge.findOne({ name });
        if (!badge) return null;
        const obj = badge.toObject();
        return {
            ...obj,
            _id: String(obj._id)
        };
    }

    public static async createBadge(badgeData: Partial<IBadge>): Promise<any> {
        const badge = await Badge.create(badgeData);
        const obj = badge.toObject();
        return {
            ...obj,
            _id: String(obj._id)
        };
    }

    public static async updateBadge(id: string, badgeData: Partial<IBadge>): Promise<any | null> {
        const badge = await Badge.findByIdAndUpdate(id, badgeData, {
            new: true,
            runValidators: true
        });
        if (!badge) return null;
        const obj = badge.toObject();
        return {
            ...obj,
            _id: String(obj._id)
        };
    }

    public static async deleteBadge(id: string): Promise<any | null> {
        const badge = await Badge.findByIdAndDelete(id);
        if (!badge) return null;
        const obj = badge.toObject();
        return {
            ...obj,
            _id: String(obj._id)
        };
    }

    public static async awardBadgeToUser(userId: string, badgeId: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            throw new ErrorResponse('Badge not found', 404);
        }

        // Check if user already has the badge
        if (user.badges.some(b => b.badge.toString() === String(badge._id))) {
            return;
        }

        // Add badge to user's badges
        user.badges.push({
            badge: new Types.ObjectId(badgeId),
            earnedAt: new Date(),
            criteriaMet: 'Awarded by system'
        } as IUserBadge);

        // Add XP reward
        user.xp += badge.xpReward;

        await user.save();
    }

    public static async getBadgesByCategory(category: string): Promise<IBadge[]> {
        const badges = await Badge.find({ category, isActive: true });
        return badges.map(badge => badge as IBadge);
    }

    public static async getBadgesByRarity(rarity: string): Promise<IBadge[]> {
        const badges = await Badge.find({ rarity, isActive: true });
        return badges.map(badge => badge as IBadge);
    }

    /**
     * Checks if a user meets the criteria for any badges based on a specific event
     * and awards them if criteria are met.
     * 
     * @param userId - The ID of the user to check and award badges to
     * @param activityType - The event type that triggered the check (e.g., 'note_created', 'login_streak_3')
     * @param data - Optional data associated with the event (e.g., streak count, note details)
     * @returns An array of awarded badge IDs
     * @throws ErrorResponse if the user is not found
     */
    public static async checkAndAwardBadges(userId: string, activityType: string, data: any): Promise<string[]> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        const badges = await Badge.find({ isActive: true });
        const awardedBadgeIds: string[] = [];
        for (const badge of badges) {
            // Skip if user already has the badge
            if (user.badges.some(b => b.badge.toString() === String(badge._id))) {
                continue;
            }

            // Check if badge criteria is met
            if (this.checkBadgeCriteria(badge, activityType, data)) {
                await this.awardBadgeToUser(userId, String(badge._id));
                awardedBadgeIds.push(String(badge._id));
            }
        }
        return awardedBadgeIds;
    }

    private static checkBadgeCriteria(badge: IBadge, activityType: string, data: any): boolean {
        // Implement badge criteria checking logic here
        // This is a simplified example
        if (badge.category === 'achievement') {
            if (activityType === 'note_created') {
                return true;
            }
        }
        return false;
    }
} 