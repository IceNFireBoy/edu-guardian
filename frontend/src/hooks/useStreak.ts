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
// Map the backend profile fields onto this hook's legacy shape. The profile
// stores streak.max (not "longest"), streak.lastUsed (not "lastVisit") and
// activity entries as { action, xpEarned } (not { type, xp }).
const fromProfile = (profile: NonNullable<ReturnType<typeof useUser>['profile']>): StreakData => ({
  currentStreak: profile.streak?.current || 0,
  longestStreak: profile.streak?.max || 0,
  lastVisit: profile.streak?.lastUsed || null,
  xp: profile.xp || 0,
  level: profile.level || 1,
  activities: (profile.activity || []).map(a => ({
    type: a.action,
    description: a.description,
    xp: a.xpEarned,
    timestamp: a.timestamp,
  })),
});

const EMPTY_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastVisit: null,
  xp: 0,
  level: 1,
  activities: []
};

export const useStreak = (): UseStreakReturn => {
  const { profile } = useUser();
  const [streak, setStreak] = useState<StreakData>(() =>
    profile ? fromProfile(profile) : EMPTY_STREAK
  );

  useEffect(() => {
    if (profile) {
      setStreak(fromProfile(profile));
    }
  }, [profile]);

  // Level formula must match the backend (User.calculateLevel):
  // level = 1 + floor(xp / 100)
  const calculateLevel = (xp: number): number => {
    return 1 + Math.floor(xp / 100);
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

  // Get XP needed for next level (backend leveling: next level starts at
  // level * 100 XP)
  const getXpForNextLevel = (): number => {
    return Math.max(streak.level * 100 - streak.xp, 0);
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