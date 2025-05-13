import Badge, { IBadge } from '../models/Badge';
import User, { IUser, IBadgeEarned } from '../models/User';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';
import { NotFoundError } from '../utils/errorResponse';

interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // Add other common query params as needed
}

interface AwardResult {
    success: boolean;
    message: string;
    badge?: IBadge;
    alreadyAwarded?: boolean;
}

// Badge criteria functions - strategy pattern
type BadgeCriteriaFunction = (user: IUser, eventData?: any) => Promise<boolean>;

// Badge criteria map - mapping specific badge types to their evaluation functions
const BadgeCriteriaMap: Record<string, BadgeCriteriaFunction> = {
    // Login-related badges
    'first_login': async (user: IUser) => {
        // Badge for first login is always true since the user exists
        return true;
    },
    'login_streak_3': async (user: IUser) => {
        return user.streak.current >= 3; // Assuming streak.current is the relevant login streak
    },
    'login_streak_7': async (user: IUser) => {
        return user.streak.current >= 7;
    },
    'login_streak_30': async (user: IUser) => {
        return user.streak.current >= 30;
    },
    
    // Note-related badges
    'upload_first_note': async (user: IUser, eventData?: any) => {
        if (eventData?.noteId && eventData.action === 'upload') {
            return true;
        }
        const notesCount = await mongoose.model('Note').countDocuments({ user: user._id });
        return notesCount >= 1;
    },
    'upload_5_notes': async (user: IUser) => {
        const notesCount = await mongoose.model('Note').countDocuments({ user: user._id });
        return notesCount >= 5;
    },
    'upload_10_notes': async (user: IUser) => {
        const notesCount = await mongoose.model('Note').countDocuments({ user: user._id });
        return notesCount >= 10;
    },
    
    // Existing AI-related badges (to be potentially refactored or replaced)
    'first_ai_summary': async (user: IUser, eventData?: any) => {
        // This will likely be covered by 'AI Novice' or specific count badges.
        // For now, let's assume it's if totalSummariesGenerated >= 1
        return user.totalSummariesGenerated >= 1;
    },
    'first_flashcard_generation': async (user: IUser, eventData?: any) => {
        // This will likely be covered by 'Flashcard Fanatic' or specific count badges.
        // For now, let's assume it's if totalFlashcardsGenerated >= 1
        return user.totalFlashcardsGenerated >= 1;
    },
    'ai_power_user': async (user: IUser) => {
        // This could be a good candidate for a higher-tier badge or combined with new ones.
        // Let's assume it checks total counts for now.
        return user.totalSummariesGenerated >= 10 && user.totalFlashcardsGenerated >= 10;
    },

    // New AI-Specific Badges (Task 11)
    // Requirements: { type: 'summaries_in_days', count: 3, days: 3 }
    'ai_novice': async (user: IUser, eventData?: any) => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const summaryActivities = user.activity.filter(
            (act) => act.action === 'ai_summary_generated' && act.createdAt >= threeDaysAgo
        );
        return summaryActivities.length >= 3;
    },
    // Requirements: { type: 'flashcards_in_days', count: 5, days: 5 }
    'flashcard_fanatic': async (user: IUser, eventData?: any) => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const flashcardActivities = user.activity.filter(
            (act) => act.action === 'ai_flashcards_generated' && act.createdAt >= fiveDaysAgo
        );
        return flashcardActivities.length >= 5;
    },
    // Requirements: { type: 'ai_streak', days: 5 }
    'ai_streaker': async (user: IUser) => {
        // Assuming user.streak.current tracks AI usage streak from UserService.updateUserAIStreak
        return user.streak.current >= 5;
    },
    // Requirements: { type: 'total_summaries', count: 15 }
    'summarizer_master': async (user: IUser) => {
        return user.totalSummariesGenerated >= 15;
    },
    // Requirements: { type: 'total_flashcards', count: 25 }
    'flashcard_legend': async (user: IUser) => {
        return user.totalFlashcardsGenerated >= 25;
    },
    
    // Study-related badges
    'first_study_session': async (user: IUser, eventData?: any) => {
        if (eventData?.action === 'complete_study' && eventData?.duration) {
            return true;
        }
        // Check activity history for study completions if not triggered by direct event
        return user.activity.some(a => a.action === 'study');
    },
    'study_marathon': async (user: IUser, eventData?: any) => {
        // Check if user completed a long study session (30+ minutes)
        if (eventData?.action === 'complete_study' && eventData?.duration >= 30) {
            return true;
        }
        // Check activity history for long study sessions
        return user.activity.some(a => a.action === 'study' && 
            a.description?.includes('30 minutes') || a.description?.includes('hour'));
    },
    
    // XP-related badges
    'xp_100': async (user: IUser) => {
        return user.xp >= 100;
    },
    'xp_500': async (user: IUser) => {
        return user.xp >= 500;
    },
    'xp_1000': async (user: IUser) => {
        return user.xp >= 1000;
    },
    
    // Level-related badges
    'reach_level_5': async (user: IUser) => {
        return user.level >= 5;
    },
    'reach_level_10': async (user: IUser) => {
        return user.level >= 10;
    }
};

class BadgeService {

    public async getAllActiveBadges(query: QueryOptions): Promise<IBadge[]> { 
        // TODO: Implement proper pagination and filtering based on query
        return Badge.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    }

    public async getBadgeById(badgeId: string): Promise<IBadge | null> {
        return Badge.findById(badgeId).lean();
    }

    public async createBadge(badgeData: Partial<IBadge>): Promise<IBadge> {
        const badge = new Badge(badgeData);
        await badge.save();
        return badge;
    }

    public async updateBadge(badgeId: string, updateData: Partial<IBadge>): Promise<IBadge | null> {
        // Ensure criteria structure is valid if updated
        const badge = await Badge.findByIdAndUpdate(badgeId, updateData, { new: true, runValidators: true }).lean();
        return badge;
    }

    public async deleteBadge(badgeId: string): Promise<boolean> {
        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return false;
        }
        // Also consider removing this badge from all users who have earned it, or mark as inactive?
        // For now, a hard delete of the badge definition.
        await badge.deleteOne();
        // Additionally, remove this badge from all users' earned badges
        await User.updateMany({}, { $pull: { badges: { badge: badgeId } } });
        return true;
    }

    public async awardBadgeToUser(userId: string, badgeId: string, manualCriteriaMet?: string): Promise<AwardResult> {
        const user = await User.findById(userId);
        const badge = await Badge.findById(badgeId);

        if (!user) throw new ErrorResponse('User not found', 404);
        if (!badge) throw new ErrorResponse('Badge not found', 404);
        if (!badge.isActive) throw new ErrorResponse('This badge is currently not active', 400);

        const alreadyEarned = user.badges.some(b => b.badge.toString() === badgeId);
        if (alreadyEarned) {
            return { success: false, message: 'Badge already awarded to this user.', badge, alreadyAwarded: true };
        }

        const earnedBadgeEntry: IBadgeEarned = {
            badge: badge._id,
            earnedAt: new Date(),
            criteriaMet: manualCriteriaMet || badge.criteria.description || 'Manually awarded by admin'
        };

        user.badges.push(earnedBadgeEntry);
        // Potentially award XP for earning a badge
        if (badge.xpAward && badge.xpAward > 0) {
            user.xp += badge.xpAward;
            user.addActivity('earn_xp', `Earned badge: ${badge.name}`, badge.xpAward);
            user.calculateLevel(); 
        }
        await user.save();
        
        return { success: true, message: `Badge "${badge.name}" awarded successfully.`, badge };
    }

    public async getBadgesByCategory(categoryName: string, query: QueryOptions): Promise<IBadge[]> {
        return Badge.find({ category: categoryName, isActive: true }).sort({ displayOrder: 1 }).lean();
    }

    public async getBadgesByRarity(rarityLevel: string, query: QueryOptions): Promise<IBadge[]> {
        return Badge.find({ rarity: rarityLevel, isActive: true }).sort({ displayOrder: 1 }).lean();
    }

    public async checkAndAwardBadges(userId: string, eventType: string, eventData?: any): Promise<IBadgeEarned[]> {
        const user = await User.findById(userId).populate('activity'); // Populate activity for criteria checks
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const earnedBadgeIds = user.badges.map(b => b.badge.toString());

        // Fetch all active badges the user hasn't earned yet,
        // and potentially filter by a category related to the eventType if applicable.
        // For simplicity now, checking all non-earned active badges.
        // A more optimized approach might involve tags or categories on badges to link them to eventTypes.
        const candidateBadges = await Badge.find({ 
            isActive: true, 
            _id: { $nin: earnedBadgeIds } 
        }).lean();

        const newlyEarnedBadges: IBadgeEarned[] = [];
        let userModified = false;

        for (const badge of candidateBadges) {
            // Use badge.slug or a dedicated 'criteriaKey' field if BadgeCriteriaMap keys are based on that.
            // Assuming badge.slug matches keys in BadgeCriteriaMap (e.g., "ai-novice" slug for 'ai_novice' key)
            // Or, if badge.requirements.type is the key:
            // const criteriaFnKey = badge.requirements?.type; 
            // For now, let's assume a mapping convention (e.g. badge.slug or a predefined key on the badge)

            const criteriaFnKey = badge.slug; // Example: using slug as key
            const criteriaFunction = BadgeCriteriaMap[criteriaFnKey];

            if (criteriaFunction) {
                try {
                    const criteriaMet = await criteriaFunction(user, { ...eventData, eventType });
                    if (criteriaMet) {
                        const earnedBadgeEntry: IBadgeEarned = {
                            badge: badge._id,
                            earnedAt: new Date(),
                            // criteriaMet can be a more descriptive string if needed, for now using badge description
                            // criteriaMet: badge.description 
                        };

                        user.badges.push(earnedBadgeEntry);
                        newlyEarnedBadges.push(earnedBadgeEntry); // Add the full entry or just ID/name

                        if (badge.xpReward > 0) {
                            user.xp += badge.xpReward;
                            // The addActivity method in User model handles XP and level calculation
                            user.addActivity('earn_xp', `XP for badge: ${badge.name}`, badge.xpReward);
                        }
                        
                        user.addActivity('earn_badge', `Earned badge: ${badge.name}`);
                        user.calculateLevel(); // Recalculate level after XP gain

                        userModified = true;
                        console.log(`User ${userId} earned badge: ${badge.name}`);
                    }
                } catch (error) {
                    console.error(`Error checking criteria for badge ${badge.name} for user ${userId}:`, error);
                    // Decide if a single badge error should stop the process or just be logged
                }
            }
        }

        if (userModified) {
            await user.save();
        }

        // Populate badge details for the newly earned badges before returning
        const populatedNewlyEarnedBadges = await Promise.all(
            newlyEarnedBadges.map(async (earnedBadge) => {
                const fullBadge = await Badge.findById(earnedBadge.badge).select('name icon description level xpReward category rarity').lean();
                return {
                    ...earnedBadge, // Contains badge ID and earnedAt
                    badge: fullBadge as IBadge // Replace ObjectId with populated badge details
                };
            })
        );

        return populatedNewlyEarnedBadges.map(eb => ({
            badge: eb.badge, // This is now the populated IBadge object
            earnedAt: eb.earnedAt,
            // criteriaMet: eb.criteriaMet // if you decide to include this field
        })) as IBadgeEarned[]; // Cast back to IBadgeEarned[], though structure of .badge is now populated IBadge
    }
}

export default BadgeService; 