import User, { IUser } from '../models/User';
import ErrorResponse from '../utils/errorResponse';

interface ActivityFeedItem {
  itemType: 'activity' | 'badge';
  action: string;
  description: string;
  xpEarned?: number;
  createdAt: Date;
    user: {
    name: string;
        _id: string;
  };
}

interface ActivityFeedResponse {
        items: ActivityFeedItem[];
        totalCount: number;
        hasMore: boolean;
}

class UserActivityFeedService {
  public async getUserFeed(userId: string, page: number = 1, limit: number = 20): Promise<ActivityFeedResponse> {
        const skip = (page - 1) * limit;
        
                const user = await User.findById(userId)
      .select('name activity badges')
      .populate('badges.badge', 'name imageUrl');
                
                if (!user) {
                    throw new ErrorResponse('User not found', 404);
                }
                
    // Process user activities
    const activities = this.processUserActivities(user);

    // Sort activities by timestamp
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate results
    const paginatedActivities = activities.slice(skip, skip + limit);
    const hasMore = activities.length > skip + limit;
                
                return {
      items: paginatedActivities,
      totalCount: activities.length,
      hasMore
    };
  }

  private processUserActivities(user: IUser): ActivityFeedItem[] {
        const activities: ActivityFeedItem[] = [];
        
        // Process regular activities
    user.activity.forEach(activity => {
                activities.push({
        itemType: 'activity',
        action: activity.action,
        description: activity.description,
        xpEarned: activity.xpEarned,
        createdAt: activity.timestamp,
                    user: {
          name: user.name,
          _id: user._id.toString()
                    }
                });
            });

    // Process badge activities
    user.badges.forEach(badge => {
      if (badge.badge && typeof badge.badge !== 'string') {
                    activities.push({
                        itemType: 'badge',
          action: 'badge_earned',
          description: `Earned badge: ${badge.badge.name}`,
          createdAt: badge.earnedAt,
                        user: {
            name: user.name,
            _id: user._id.toString()
                        }
                    });
                }
            });

    return activities;
  }

  public async logStudyCompletion(
    userId: string,
    duration: number,
    subject: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    // Calculate XP based on study duration (1 XP per minute, max 100 XP per session)
    const xpEarned = Math.min(Math.floor(duration / 60), 100);

    // Update user streak
    const today = new Date();
    const lastActive = user.lastActive ? new Date(user.lastActive) : null;
    
    if (lastActive) {
      const daysSinceLastActive = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActive === 1) {
        user.streak.current += 1;
        if (user.streak.current > user.streak.max) {
          user.streak.max = user.streak.current;
        }
      } else if (daysSinceLastActive > 1) {
        user.streak.current = 1;
      }
    } else {
      user.streak.current = 1;
    }

    // Update last active timestamp
    user.lastActive = today;

    // Add activity
    user.addActivity(
      'study',
      `Completed ${duration} minutes of study in ${subject}`,
      xpEarned
    );

    await user.save();
    }
}

export default new UserActivityFeedService(); 