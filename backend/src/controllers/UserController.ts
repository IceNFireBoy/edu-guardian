import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import UserService from '../services/UserService';
import { IUser } from '../models/User'; // Assuming IUser is in User.ts
import { LeaderboardQueryOptions } from '../interfaces/User';

export default class UserController {
  // @desc    Get all users
  // @route   GET /api/v1/users
  // @access  Private/Admin
  public static getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getUsers();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get single user
  // @route   GET /api/v1/users/:id
  // @access  Private/Admin
  public static getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.getUserById(req.params.id);
      if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Create new user
  // @route   POST /api/v1/users
  // @access  Private/Admin
  public static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Update user
  // @route   PUT /api/v1/users/:id
  // @access  Private/Admin
  public static updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Delete user
  // @route   DELETE /api/v1/users/:id
  // @access  Private/Admin
  public static deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.deleteUser(req.params.id);
      if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
      }
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get current logged in user
  // @route   GET /api/v1/users/me
  // @access  Private
  public static getMe = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return next(new ErrorResponse('Not authorized', 401));
      }
      const user = await UserService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Update user details
  // @route   PUT /api/v1/users/updatedetails
  // @access  Private
  public static updateDetails = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return next(new ErrorResponse('Not authorized', 401));
      }
      const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
      };

      const user = await UserService.updateUser(req.user.id, fieldsToUpdate);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Update password
  // @route   PUT /api/v1/users/updatepassword
  // @access  Private
  public static updatePassword = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return next(new ErrorResponse('Not authorized', 401));
      }
      const { currentPassword, newPassword } = req.body;
      await UserService.updateUserPassword(req.user.id, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get user profile
  // @route   GET /api/v1/users/profile
  // @access  Private
  public static getUserProfile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }

    const user = await UserService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  });

  // @desc    Get user badges
  // @route   GET /api/v1/users/badges
  // @access  Private
  public static getUserBadges = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }

    const user = await UserService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user?.badges || []
    });
  });

  // @desc    Get leaderboard
  // @route   GET /api/v1/users/leaderboard
  // @access  Public
  public static getLeaderboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { timeframe = 'allTime', category } = req.query;
      const options: LeaderboardQueryOptions = {
        timeframe: timeframe as 'daily' | 'weekly' | 'monthly' | 'allTime',
        category: category as string | undefined
      };
      const leaderboard = await UserService.getLeaderboard(options);
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get user's public profile (e.g. for viewing other users)
  // @route   GET /api/v1/users/:username/profile
  // @access  Public
  public static getUserPublicProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userProfile = await UserService.getUserPublicProfile(req.params.username);
      if (!userProfile) {
        return next(new ErrorResponse(`User profile not found for username ${req.params.username}`, 404));
      }
      res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get user badges for the currently authenticated user
  // @route   GET /api/v1/users/me/badges
  // @access  Private (Authenticated user)
  public static getMyBadges = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    try {
      const badges = await UserService.getUserBadges(req.user.id);
      res.status(200).json({
        success: true,
        count: badges.length,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  });

  // @desc    Get badges for a specific user by their ID (publicly viewable badges)
  // @route   GET /api/v1/users/:userId/badges
  // @access  Public
  public static getUserBadgesById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const badges = await UserService.getUserBadges(req.params.userId);
      // No 404 check here, an empty array is a valid response if user has no badges or user not found (service might handle user existence)
      res.status(200).json({
        success: true,
        count: badges.length,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  });
  
  // @desc    Get user activity log for the currently authenticated user
  // @route   GET /api/v1/users/me/activity
  // @access  Private
  public static getMyActivityLog = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    try {
        const activityLog = await UserService.getUserActivityLog(req.user.id, req.query);
        res.status(200).json({
            success: true,
            // count: activityLog.length, // Service should return pagination data if applicable
            data: activityLog
        });
    } catch (error) {
        next(error);
    }
  });

  // @desc    Get user's uploaded notes (for the currently authenticated user)
  // @route   GET /api/v1/users/me/notes
  // @access  Private
  public static getMyUploadedNotes = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    try {
        // Assuming NoteService.getMyNotes(userId) handles this or a similar method in UserService
        const notes = await UserService.getUserUploadedNotes(req.user.id, req.query); // Pass query for pagination
        res.status(200).json({
            success: true,
            // count: notes.length, // Service should return pagination data
            data: notes
        });
    } catch (error) {
        next(error);
    }
  });

  // @desc    Get user's favorite notes (for the currently authenticated user)
  // @route   GET /api/v1/users/me/favorites
  // @access  Private
  public static getMyFavoriteNotes = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    try {
        const notes = await UserService.getUserFavoriteNotes(req.user.id, req.query); // Pass query for pagination
        res.status(200).json({
            success: true,
            // count: notes.length, // Service should return pagination data
            data: notes
        });
    } catch (error) {
        next(error);
    }
  });

  // @desc    Add a note to user's favorites
  // @route   POST /api/v1/users/me/favorites/:noteId
  // @access  Private
  public static addNoteToFavorites = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    const { noteId } = req.params;
    try {
        await UserService.addNoteToFavorites(req.user.id, noteId);
        res.status(200).json({
            success: true,
            data: { message: 'Note added to favorites' } 
        });
    } catch (error) {
        next(error);
    }
  });

  // @desc    Remove a note from user's favorites
  // @route   DELETE /api/v1/users/me/favorites/:noteId
  // @access  Private
  public static removeNoteFromFavorites = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }
    const { noteId } = req.params;
    try {
        await UserService.removeNoteFromFavorites(req.user.id, noteId);
        res.status(200).json({
            success: true,
            data: { message: 'Note removed from favorites' }
        });
    } catch (error) {
        next(error);
    }
  });
} 