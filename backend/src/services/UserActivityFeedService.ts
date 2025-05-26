import { User } from '../models/User';
import { IUser, IUserActivity } from '../models/User';
import { Types } from 'mongoose';
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

export default class UserActivityFeedService {
  public static async getUserActivityLog(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ activities: IUserActivity[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { _id: new Types.ObjectId(userId) };
    if (options.type) {
      query['activity.action'] = options.type;
    }

    const sort: any = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.timestamp = -1;
    }

    const [activities, total] = await Promise.all([
      User.find(query)
        .select('activity')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    return {
      activities: activities.flatMap(user => user.activity),
      total,
      page,
      pages
    };
  }

  public static async addActivity(
    userId: string,
    type: import('../models/User').IUserActivity['action'],
    description: string,
    xpEarned?: number
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const activity = {
      action: type,
      description,
      timestamp: new Date(),
      xpEarned: xpEarned || 0
    };

    user.activity.push(activity as any);
    await user.save();
  }

  public static async logBadgeEarned(userId: string, badgeName: string): Promise<void> {
    await this.addActivity(
      userId,
      'earn_badge',
      `Earned badge: ${badgeName}`,
      0
    );
  }

  public static async logStudySession(userId: string, duration: number): Promise<void> {
    await this.addActivity(
      userId,
      'study',
      `Completed study session of ${duration} minutes`,
      Math.floor(duration / 5) // 1 XP per 5 minutes
    );
  }

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
          _id: user._id?.toString() || ''
        }
      });
    });
    // Process badge activities
    user.badges.forEach(badge => {
      if (badge.badge && typeof badge.badge !== 'string') {
        activities.push({
          itemType: 'badge',
          action: 'earn_badge',
          description: `Earned badge: ${(badge.badge as any).name}`,
          createdAt: badge.earnedAt,
          user: {
            name: user.name,
            _id: user._id?.toString() || ''
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