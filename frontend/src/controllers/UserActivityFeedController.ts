import { Request, Response } from 'express';
import { UserActivityFeedService } from '../services/UserActivityFeedService';
import { BadgeService } from '../services/BadgeService';
import { asyncHandler } from '../middleware/asyncHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export class UserActivityFeedController {
  public static getActivityFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: req.query.sort as string || '-createdAt'
    };

    const feed = await UserActivityFeedService.getUserActivityFeed(userId, options);
    return res.json(feed);
  });

  public static addActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { type, description, metadata } = req.body;
    const activity = await UserActivityFeedService.addActivity(userId, type, description, metadata);
    return res.status(201).json(activity);
  });

  public static clearActivityLog = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await UserActivityFeedService.clearActivityLog(userId);
    return res.json({ message: 'Activity log cleared successfully' });
  });

  public static checkAndAwardBadges = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { event, eventData } = req.body;
    const awardedBadges = await BadgeService.checkAndAwardBadges(userId, event, eventData);
    return res.json(awardedBadges);
  });

  public static logStudyCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { duration, subject, topic } = req.body;
    const activity = await UserActivityFeedService.addActivity(
      userId,
      'study_completion',
      `Completed study session in ${subject} - ${topic}`,
      { duration, subject, topic }
    );

    const awardedBadges = await BadgeService.checkAndAwardBadges(userId, 'complete_study', {
      duration,
      subject,
      topic
    });

    return res.json({ activity, awardedBadges });
  });
} 