import { Request, Response } from 'express';
import BadgeService from '../services/BadgeService';
import { asyncHandler } from '../middleware/asyncHandler';

class BadgeController {
  async getAllActiveBadges(req: Request, res: Response) {
    const badges = await BadgeService.getAllActiveBadges(req.query);
    return res.json(badges);
  }

  async getBadgeById(req: Request, res: Response) {
    const badge = await BadgeService.getBadgeById(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    return res.json(badge);
  }

  async createBadge(req: Request, res: Response) {
    const badge = await BadgeService.createBadge(req.body);
    return res.status(201).json(badge);
  }

  async updateBadge(req: Request, res: Response) {
    const badge = await BadgeService.updateBadge(req.params.id, req.body);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    return res.json(badge);
  }

  async deleteBadge(req: Request, res: Response) {
    const success = await BadgeService.deleteBadge(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    return res.json({ message: 'Badge deleted successfully' });
  }

  async awardBadgeToUser(req: Request, res: Response) {
    const { userId, badgeId } = req.params;
    const result = await BadgeService.awardBadgeToUser(userId, badgeId, req.body.criteria);
    return res.json(result);
  }

  async getBadgesByCategory(req: Request, res: Response) {
    const badges = await BadgeService.getBadgesByCategory(req.params.categoryName, req.query);
    return res.json(badges);
  }

  async getBadgesByRarity(req: Request, res: Response) {
    const badges = await BadgeService.getBadgesByRarity(req.params.rarityLevel, req.query);
    return res.json(badges);
  }

  async checkAndAwardBadges(req: Request, res: Response) {
    const { userId } = req.params;
    const { event, eventData } = req.body;
    const awardedBadges = await BadgeService.checkAndAwardBadges(userId, event, eventData);
    return res.json(awardedBadges);
  }
}

const badgeController = new BadgeController();

// Wrap all methods with asyncHandler
Object.keys(badgeController).forEach(key => {
  if (typeof badgeController[key as keyof BadgeController] === 'function') {
    badgeController[key as keyof BadgeController] = asyncHandler(badgeController[key as keyof BadgeController] as any);
  }
});

export default badgeController; 