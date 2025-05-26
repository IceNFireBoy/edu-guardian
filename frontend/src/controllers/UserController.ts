import { Request, Response } from 'express';
import UserService from '../services/UserService';
import { asyncHandler } from '../middleware/asyncHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

class UserController {
  async getUsers(req: Request, res: Response) {
    const users = await UserService.getUsers(req.query);
    return res.json(users);
  }

  async getUserById(req: Request, res: Response) {
    const user = await UserService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  }

  async createUser(req: Request, res: Response) {
    const user = await UserService.createUser(req.body);
    return res.status(201).json(user);
  }

  async updateUser(req: Request, res: Response) {
    const user = await UserService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  }

  async deleteUser(req: Request, res: Response) {
    const success = await UserService.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'User deleted successfully' });
  }

  async getUserPublicProfile(req: Request, res: Response) {
    const userProfile = await UserService.getUserPublicProfile(req.params.username);
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(userProfile);
  }

  async getUserBadges(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const badges = await UserService.getUserBadges(userId);
    return res.json(badges);
  }

  async getUserBadgesById(req: Request, res: Response) {
    const badges = await UserService.getUserBadges(req.params.userId);
    return res.json(badges);
  }

  async getUserActivityLog(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const activityLog = await UserService.getUserActivityLog(userId, req.query);
    return res.json(activityLog);
  }

  async getUserUploadedNotes(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const notes = await UserService.getUserUploadedNotes(userId, req.query);
    return res.json(notes);
  }

  async getUserFavoriteNotes(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const notes = await UserService.getUserFavoriteNotes(userId, req.query);
    return res.json(notes);
  }

  async addNoteToFavorites(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { noteId } = req.params;
    await UserService.addNoteToFavorites(userId, noteId);
    return res.json({ message: 'Note added to favorites successfully' });
  }

  async removeNoteFromFavorites(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { noteId } = req.params;
    await UserService.removeNoteFromFavorites(userId, noteId);
    return res.json({ message: 'Note removed from favorites successfully' });
  }

  async getLeaderboard(req: Request, res: Response) {
    const leaderboard = await UserService.getLeaderboard({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as string || 'xp'
    });
    return res.json(leaderboard);
  }
}

const userController = new UserController();

// Wrap all methods with asyncHandler
Object.keys(userController).forEach(key => {
  if (typeof userController[key as keyof UserController] === 'function') {
    userController[key as keyof UserController] = asyncHandler(userController[key as keyof UserController] as any);
  }
});

export default userController; 