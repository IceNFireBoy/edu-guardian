import Badge, { IBadge } from '../models/Badge';
import User, { IUser, IUserBadge } from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';

interface BadgeCriteriaFunction {
    (user: IUser, eventData?: any): Promise<boolean> | boolean;
}

const BADGE_CRITERIA: Record<string, BadgeCriteriaFunction> = {
    note_created: async (user: IUser) => {
        return user.totalNotes >= 5;
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

export class BadgeService {
    public async getAllActiveBadges(): Promise<IBadge[]> {
        return await Badge.find({ isActive: true });
    }

    public async getBadgeByName(name: string): Promise<IBadge | null> {
        return await Badge.findOne({ name });
    }

    public async getBadgeById(id: string): Promise<IBadge> {
        const badge = await Badge.findById(id);
        if (!badge) {
            throw new ErrorResponse('Badge not found', 404);
        }
        return badge;
    }

    public async createBadge(badgeData: Partial<IBadge>): Promise<IBadge> {
        const existingBadge = await Badge.findOne({ name: badgeData.name });
        if (existingBadge) {
            throw new ErrorResponse('Badge with this name already exists', 400);
        }
        return await Badge.create(badgeData);
    }

    public async updateBadge(id: string, badgeData: Partial<IBadge>): Promise<IBadge> {
        const badge = await Badge.findByIdAndUpdate(id, badgeData, {
            new: true,
            runValidators: true
        });
        if (!badge) {
            throw new ErrorResponse('Badge not found', 404);
        }
        return badge;
    }

    public async deleteBadge(id: string): Promise<boolean> {
        const badge = await Badge.findByIdAndDelete(id);
        if (!badge) {
            throw new ErrorResponse('Badge not found', 404);
        }
        return true;
    }

    public async awardBadgeToUser(userId: string, badgeId: string): Promise<boolean> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            throw new ErrorResponse('Badge not found', 404);
        }

        // Check if user already has this badge
        if (user.badges.some(b => b.badge.toString() === badgeId)) {
            throw new ErrorResponse('User already has this badge', 400);
        }

        // Add badge to user
        const newBadge: IUserBadge = {
            badge: new mongoose.Types.ObjectId(badgeId),
            earnedAt: new Date(),
            criteriaMet: 'Awarded by system'
        } as IUserBadge;

        user.badges.push(newBadge);

        // Award XP if badge has XP reward
        if (badge.xpReward && badge.xpReward > 0) {
            user.xp += badge.xpReward;
            user.addActivity('earn_xp', `Earned badge: ${badge.name}`, badge.xpReward);
        }

        await user.save();
        return true;
    }

    public async getBadgesByCategory(categoryName: string): Promise<IBadge[]> {
        return await Badge.find({ category: categoryName, isActive: true });
    }

    public async getBadgesByRarity(rarityLevel: string): Promise<IBadge[]> {
        return await Badge.find({ rarity: rarityLevel, isActive: true });
    }

    public async checkAndAwardBadges(userId: string, event: string, eventData?: any): Promise<IBadge[]> {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }

        const awardedBadges: IBadge[] = [];

        // Get all active badges
        const badges = await Badge.find({ isActive: true });

        for (const badge of badges) {
            // Skip if user already has this badge
            if (user.badges.some(b => b.badge.toString() === badge._id.toString())) {
                continue;
            }

            // Check if badge has criteria for this event
            const criteriaFunction = BADGE_CRITERIA[event];
            if (criteriaFunction) {
                const criteriaMet = await criteriaFunction(user, eventData);
                if (criteriaMet) {
                    await this.awardBadgeToUser(userId, badge._id.toString());
                    awardedBadges.push(badge);
                }
            }
        }

        return awardedBadges;
    }
}

export default BadgeService; 