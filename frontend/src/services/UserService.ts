import { User } from '../models/User';
import { Note } from '../models/Note';
import { IUser } from '../models/User';
import bcrypt from 'bcryptjs';

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

class UserService {
  async getUsers(query: PaginationOptions): Promise<PaginatedResponse<IUser>> {
    const { page = 1, limit = 10, sortBy = 'xp' } = query;
    const skip = (page - 1) * limit;

    const sortOptions: { [key: string]: number } = {
      xp: -1,
      level: -1,
      createdAt: -1
    };

    const users = await User.find()
      .select('-password')
      .sort(sortOptions[sortBy])
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return {
      data: users.map(user => user.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await User.findById(id).select('-password');
    return user ? user.toObject() : null;
  }

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { password, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password as string, 10);

    const user = new User({
      ...rest,
      password: hashedPassword
    });

    const savedUser = await user.save();
    const createdUser = await this.getUserById(savedUser._id.toString());
    if (!createdUser) {
      throw new Error('Failed to create user');
    }
    return createdUser;
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    const { password, ...rest } = userData;
    const updateData: any = { ...rest };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password');
    return user ? user.toObject() : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async getUserPublicProfile(username: string): Promise<IUser | null> {
    const user = await User.findOne({ username })
      .select('-password -email -role')
      .populate('badges.badge');
    return user ? user.toObject() : null;
  }

  async getUserBadges(userId: string): Promise<Array<{ badge: any; earnedAt: Date; criteriaMet: string }>> {
    const user = await User.findById(userId)
      .populate('badges.badge');

    if (!user) {
      throw new Error('User not found');
    }

    return user.badges.map(badge => ({
      badge: badge.badge.toObject(),
      earnedAt: badge.earnedAt,
      criteriaMet: badge.criteriaMet
    }));
  }

  async getUserActivityLog(userId: string, query: PaginationOptions): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const activities = await user.getActivityLog()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await user.getActivityLog().countDocuments();

    return {
      data: activities.map(activity => activity.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserUploadedNotes(userId: string, query: PaginationOptions): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const notes = await Note.find({ user: userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments({ user: userId });

    return {
      data: notes.map(note => note.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserFavoriteNotes(userId: string, query: PaginationOptions): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const notes = await Note.find({ _id: { $in: user.favoriteNotes } })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = user.favoriteNotes.length;

    return {
      data: notes.map(note => note.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async addNoteToFavorites(userId: string, noteId: string): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.favoriteNotes.includes(noteId)) {
      user.favoriteNotes.push(noteId);
      await user.save();
    }

    return { message: 'Note added to favorites successfully' };
  }

  async removeNoteFromFavorites(userId: string, noteId: string): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.favoriteNotes = user.favoriteNotes.filter(id => id.toString() !== noteId);
    await user.save();

    return { message: 'Note removed from favorites successfully' };
  }

  async getLeaderboard(options: PaginationOptions): Promise<PaginatedResponse<IUser>> {
    const { page = 1, limit = 10, sortBy = 'xp' } = options;
    const skip = (page - 1) * limit;

    const sortOptions: { [key: string]: number } = {
      xp: -1,
      level: -1,
      streak: -1
    };

    const users = await User.find()
      .select('username avatar xp level currentStreak')
      .sort(sortOptions[sortBy])
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return {
      data: users.map(user => user.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserStreak(user: IUser): Promise<IUser> {
    const now = new Date();
    const lastActivity = user.lastActivity || new Date(0);
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity === 1) {
      user.currentStreak += 1;
    } else if (daysSinceLastActivity > 1) {
      user.currentStreak = 1;
    }

    user.lastActivity = now;
    const updatedUser = await user.save();
    return updatedUser.toObject();
  }

  async updateUserXP(user: IUser, xpAmount: number): Promise<IUser> {
    user.xp += xpAmount;
    const newLevel = Math.floor(user.xp / 1000) + 1;

    if (newLevel > user.level) {
      user.level = newLevel;
      // TODO: Add level up notification or event
    }

    const updatedUser = await user.save();
    return updatedUser.toObject();
  }
}

export default new UserService(); 