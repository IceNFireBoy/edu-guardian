import { useState, useEffect } from 'react';
import { useUser } from '../features/user/useUser';

interface Activity {
  type: string;
  description: string;
  xp: number;
  timestamp: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastVisit: string | null;
  xp: number;
  level: number;
  activities: Activity[];
}

interface UseStreakReturn {
  streak: StreakData;
  recordActivity: (type: string, description?: string, xpAmount?: number) => boolean;
  resetStreak: () => void;
  getXpForNextLevel: () => number;
}

/**
 * Hook for managing user streaks and XP
 * 
 * @returns {UseStreakReturn} streak and xp data and functions
 */
export const useStreak = (): UseStreakReturn => {
  const { profile } = useUser();
  const [streak, setStreak] = useState<StreakData>(() => {
    if (profile) {
      return {
        currentStreak: profile.streak?.current || 0,
        longestStreak: profile.streak?.longest || 0,
        lastVisit: profile.lastVisit || null,
        xp: profile.xp || 0,
        level: profile.level || 1,
        activities: profile.activities || []
      };
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVisit: null,
      xp: 0,
      level: 1,
      activities: []
    };
  });

  useEffect(() => {
    if (profile) {
      setStreak({
        currentStreak: profile.streak?.current || 0,
        longestStreak: profile.streak?.longest || 0,
        lastVisit: profile.lastVisit || null,
        xp: profile.xp || 0,
        level: profile.level || 1,
        activities: profile.activities || []
      });
    }
  }, [profile]);

  // Calculate level based on XP
  const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 10)) + 1;
  };

  // Record a user activity and award XP
  const recordActivity = (type: string, description: string = '', xpAmount: number = 1): boolean => {
    try {
      // Create a new streak object to update
      const newStreak: StreakData = { ...streak };
      
      // Add XP
      newStreak.xp += xpAmount;
      
      // Calculate new level
      const newLevel = calculateLevel(newStreak.xp);
      const leveledUp = newLevel > newStreak.level;
      newStreak.level = newLevel;
      
      // Add activity to history (limit to last 50)
      const activity: Activity = {
        type,
        description,
        xp: xpAmount,
        timestamp: new Date().toISOString()
      };
      
      newStreak.activities = [activity, ...newStreak.activities.slice(0, 49)];
      
      // Save to state
      setStreak(newStreak);
      
      // Return if user leveled up
      return leveledUp;
    } catch (err) {
      console.error('Error recording activity:', err);
      return false;
    }
  };

  // Get XP needed for next level
  const getXpForNextLevel = (): number => {
    const currentLevel = streak.level;
    const nextLevel = currentLevel + 1;
    const xpNeeded = nextLevel * nextLevel * 10;
    return xpNeeded - streak.xp;
  };

  // Reset streak and progress (for testing)
  const resetStreak = (): void => {
    try {
      const resetData: StreakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastVisit: null,
        xp: 0,
        level: 1,
        activities: []
      };
      
      setStreak(resetData);
    } catch (err) {
      console.error('Error resetting streak:', err);
    }
  };

  return {
    streak,
    recordActivity,
    resetStreak,
    getXpForNextLevel
  };
};

export default useStreak; 