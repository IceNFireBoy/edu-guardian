import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import BadgeService from '../services/BadgeService';
import { IBadge } from '../models/Badge';

export default class BadgeController {
  // @desc    Get all badges
  // @route   GET /api/v1/badges
  // @access  Public
  public static getBadges = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getBadges();
      res.status(200).json({
        success: true,
        count: badges.length,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get single badge
  // @route   GET /api/v1/badges/:id
  // @access  Public
  public static getBadgeById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  // @access  Private/Admin
  public static createBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  // @access  Private/Admin
  public static updateBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  // @access  Private/Admin
  public static deleteBadge = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badge = await BadgeService.deleteBadge(req.params.id);
      if (!badge) {
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

  // @desc    Award badge to user
  // @route   POST /api/v1/badges/:id/award
  // @access  Private/Admin
  public static awardBadgeToUser = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    try {
      await BadgeService.awardBadgeToUser(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Badge awarded successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get badges by category
  // @route   GET /api/v1/badges/category/:category
  // @access  Public
  public static getBadgesByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getBadgesByCategory(req.params.category);
      res.status(200).json({
        success: true,
        count: badges.length,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get badges by rarity
  // @route   GET /api/v1/badges/rarity/:rarity
  // @access  Public
  public static getBadgesByRarity = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await BadgeService.getBadgesByRarity(req.params.rarity);
      res.status(200).json({
        success: true,
        count: badges.length,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Check and award badges based on user activity
  // @route   POST /api/v1/badges/check
  // @access  Private
  public static checkAndAwardBadges = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    const { event, eventData } = req.body;
    if (!event) {
      return next(new ErrorResponse('Event type is required', 400));
    }
    try {
      await BadgeService.checkAndAwardBadges(req.user.id, event, eventData);
      res.status(200).json({
        success: true,
        message: 'Badge check completed'
      });
    } catch (error) {
      next(error);
    }
  });
} 