import { Request, Response } from 'express';
import { UserActivityFeedService } from '../services/UserActivityFeedService';
import { BadgeService } from '../services/BadgeService';
import { asyncHandler } from '../middleware/asyncHandler';
import { callAuthenticatedApi } from '../api/apiClient';
import { handleApiError } from '../utils/errorHandler';
import { UserActivity } from '../features/user/userTypes';

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export interface ActivityFeedResponse {
  success: boolean;
  data: {
    activities: UserActivity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
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

  /**
   * Get user activity feed
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @param sort Sort criteria
   */
  public static async getUserActivityFeed(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sort: string = '-timestamp'
  ): Promise<ActivityFeedResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort
      }).toString();

      const response = await callAuthenticatedApi<ActivityFeedResponse>(
        `/users/${userId}/activity?${queryParams}`,
        'GET'
      );
      
      return response;
    } catch (error) {
      const { message } = handleApiError(error, {
        customMessage: 'Failed to load activity feed'
      });
      throw new Error(message);
    }
  }

  /**
   * Log a user activity
   * @param userId User ID
   * @param action Activity action
   * @param description Activity description
   * @param xpEarned XP earned (optional)
   * @param metadata Additional metadata (optional)
   */
  public static async logActivity(
    userId: string,
    action: string,
    description: string,
    xpEarned: number = 0,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; data: UserActivity }> {
    try {
      return await callAuthenticatedApi(
        `/users/${userId}/activity`,
        'POST',
        {
          action,
          description,
          xpEarned,
          metadata
        }
      );
    } catch (error) {
      const { message } = handleApiError(error, {
        customMessage: 'Failed to log activity',
        showToast: false
      });
      throw new Error(message);
    }
  }

  /**
   * Clear a user's activity log
   * @param userId User ID
   */
  public static async clearActivityLog(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await callAuthenticatedApi(
        `/users/${userId}/activity`,
        'DELETE'
      );
    } catch (error) {
      const { message } = handleApiError(error, {
        customMessage: 'Failed to clear activity log'
      });
      throw new Error(message);
    }
  }
} 