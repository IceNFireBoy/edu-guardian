import { UserActivityFeed } from '../models/UserActivityFeed';
import { User } from '../models/User';
import { IUser } from '../models/User';

export class UserActivityFeedService {
  public static async getUserActivityFeed(userId: string, options: any) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const activities = await UserActivityFeed.find({ user: userId })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await UserActivityFeed.countDocuments({ user: userId });

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  public static async addActivity(userId: string, type: string, description: string, metadata?: any) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const activity = new UserActivityFeed({
      user: userId,
      type,
      description,
      metadata
    });

    await activity.save();

    // Update user's last activity
    user.lastActivity = new Date();
    await user.save();

    return activity;
  }

  public static async clearActivityLog(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await UserActivityFeed.deleteMany({ user: userId });
    return { message: 'Activity log cleared successfully' };
  }

  public static async logBadgeEarned(user: IUser, badge: any) {
    return this.addActivity(
      user._id.toString(),
      'badge_earned',
      `Earned badge: ${badge.name}`,
      {
        badgeId: badge._id,
        badgeName: badge.name,
        badgeCategory: badge.category,
        badgeRarity: badge.rarity,
        xpReward: badge.xpReward
      }
    );
  }

  public static async logNoteUpload(user: IUser, note: any) {
    return this.addActivity(
      user._id.toString(),
      'note_upload',
      `Uploaded a new note: ${note.title}`,
      {
        noteId: note._id,
        noteTitle: note.title,
        subject: note.subject,
        grade: note.grade,
        topic: note.topic
      }
    );
  }

  public static async logNoteView(user: IUser, note: any) {
    return this.addActivity(
      user._id.toString(),
      'note_view',
      `Viewed note: ${note.title}`,
      {
        noteId: note._id,
        noteTitle: note.title,
        viewCount: note.viewCount
      }
    );
  }

  public static async logNoteRating(user: IUser, note: any, rating: number) {
    return this.addActivity(
      user._id.toString(),
      'note_rating',
      `Rated note: ${note.title}`,
      {
        noteId: note._id,
        noteTitle: note.title,
        rating,
        averageRating: note.rating
      }
    );
  }
} 