import { Badge } from '../models/Badge';
import { User } from '../models/User';
import { IBadge, IUser } from '../models/Badge';
import { Types } from 'mongoose';

class BadgeService {
  async getAllActiveBadges(query: Partial<IBadge>): Promise<IBadge[]> {
    const badges = await Badge.find({ isActive: true, ...query });
    return badges.map(badge => badge.toObject());
  }

  async getBadgeById(id: string): Promise<IBadge | null> {
    const badge = await Badge.findById(id);
    return badge ? badge.toObject() : null;
  }

  async createBadge(badgeData: Partial<IBadge>): Promise<IBadge> {
    const badge = new Badge(badgeData);
    const savedBadge = await badge.save();
    return savedBadge.toObject();
  }

  async updateBadge(id: string, badgeData: Partial<IBadge>): Promise<IBadge | null> {
    const badge = await Badge.findByIdAndUpdate(id, badgeData, { new: true });
    return badge ? badge.toObject() : null;
  }

  async deleteBadge(id: string): Promise<boolean> {
    const result = await Badge.findByIdAndDelete(id);
    return !!result;
  }

  async awardBadgeToUser(userId: string, badgeId: string, criteria?: any): Promise<{ message: string }> {
    const user = await User.findById(userId);
    const badge = await Badge.findById(badgeId);

    if (!user || !badge) {
      throw new Error('User or badge not found');
    }

    if (user.badges.some(b => b.badge.toString() === badge._id.toString())) {
      return { message: 'User already has this badge' };
    }

    user.badges.push({
      badge: badge._id,
      earnedAt: new Date(),
      criteriaMet: criteria || 'Manual award'
    });

    user.xp += badge.xpReward;
    await user.save();

    return { message: 'Badge awarded successfully' };
  }

  async getBadgesByCategory(categoryName: string, query: Partial<IBadge>): Promise<IBadge[]> {
    const badges = await Badge.find({ category: categoryName, isActive: true, ...query });
    return badges.map(badge => badge.toObject());
  }

  async getBadgesByRarity(rarityLevel: string, query: Partial<IBadge>): Promise<IBadge[]> {
    const badges = await Badge.find({ rarity: rarityLevel, isActive: true, ...query });
    return badges.map(badge => badge.toObject());
  }

  async checkAndAwardBadges(userId: string, event: string, eventData: any): Promise<IBadge[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const activeBadges = await Badge.find({ isActive: true });
    const awardedBadges: IBadge[] = [];

    for (const badge of activeBadges) {
      if (this.checkBadgeCriteria(user, badge, event, eventData)) {
        if (!user.badges.some(b => b.badge.toString() === badge._id.toString())) {
          await this.awardBadgeToUser(userId, badge._id.toString());
          awardedBadges.push(badge.toObject());
        }
      }
    }

    return awardedBadges;
  }

  private checkBadgeCriteria(user: IUser, badge: IBadge, event: string, eventData: any): boolean {
    const { type, threshold } = badge.criteria;

    switch (type) {
      case 'note_count':
        return (user as any).totalNotes >= threshold;
      case 'streak_days':
        return (user as any).currentStreak >= threshold;
      case 'shared_notes':
        return (user as any).sharedNotes >= threshold;
      case 'ai_usage':
        return (user as any).aiUsageCount >= threshold;
      case 'xp_level':
        return user.level >= threshold;
      case 'view_count':
        return eventData.viewCount >= threshold;
      case 'rating':
        return eventData.rating >= threshold;
      default:
        return false;
    }
  }
}

export default new BadgeService(); 