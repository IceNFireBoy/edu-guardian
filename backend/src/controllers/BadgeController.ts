import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import BadgeService from '../services/BadgeService';
import { CustomRequest } from '../middleware/auth'; // For req.user

export default class BadgeController {
  // @desc    Get all active badges
  // @route   GET /api/v1/badges
  // @access  Public
  public getBadges = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getAllActiveBadges(req.query);
      res.status(200).json({
        success: true,
        count: badges.length, // Or badges.count if service returns pagination
        data: badges // Or badges.data
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get single badge by ID
  // @route   GET /api/v1/badges/:id
  // @access  Public
  public getBadgeById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badge = await BadgeService.getBadgeById(req.params.id);
      if (!badge) {
        return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: badge
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Create new badge
  // @route   POST /api/v1/badges
  // @access  Admin
  public createBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badge = await BadgeService.createBadge(req.body);
      res.status(201).json({
        success: true,
        data: badge
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Update badge
  // @route   PUT /api/v1/badges/:id
  // @access  Admin
  public updateBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badge = await BadgeService.updateBadge(req.params.id, req.body);
      if (!badge) {
        return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: badge
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Delete badge
  // @route   DELETE /api/v1/badges/:id
  // @access  Admin
  public deleteBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const success = await BadgeService.deleteBadge(req.params.id);
       if (!success) {
        // This case might be redundant if service throws error for not found
        return next(new ErrorResponse(`Badge not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  });
  
  // @desc    Award badge to a user (manual award by admin)
  // @route   POST /api/v1/badges/:badgeId/award/:userId
  // @access  Admin 
  public awardBadgeToUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { badgeId, userId } = req.params;
    try {
      const result = await BadgeService.awardBadgeToUser(userId, badgeId, req.body.criteria); // criteria can be optional
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get badges by category
  // @route   GET /api/v1/badges/category/:categoryName
  // @access  Public
  public getBadgesByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getBadgesByCategory(req.params.categoryName, req.query);
      res.status(200).json({
        success: true,
        count: badges.length, // or badges.count
        data: badges // or badges.data
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get badges by rarity
  // @route   GET /api/v1/badges/rarity/:rarityLevel
  // @access  Public
  public getBadgesByRarity = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getBadgesByRarity(req.params.rarityLevel, req.query);
      res.status(200).json({
        success: true,
        count: badges.length, // or badges.count
        data: badges // or badges.data
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Check user eligibility for badges and award if met (called internally or by specific events)
  // @route   POST /api/v1/badges/check-eligibility
  // @access  Private (System or specific user actions triggering this)
  public checkAndAwardBadges = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('User context required for checking badge eligibility', 400));
    }
    try {
      const event = req.body.event; // e.g., 'note_created', 'user_login_streak_updated'
      const eventData = req.body.data; // optional data related to the event
      const awardedBadges = await BadgeService.checkAndAwardBadges(req.user.id, event, eventData);
      res.status(200).json({
        success: true,
        data: { 
            message: 'Badge eligibility checked.',
            awardedBadges 
        }
      });
    } catch (error) {
      next(error);
    }
  });
} 