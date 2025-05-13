import { useState, useEffect } from 'react';

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
  // Initialize streak data from localStorage or with defaults
  const [streak, setStreak] = useState<StreakData>(() => {
    try {
      const saved = localStorage.getItem('user_streak');
      if (saved) {
        return JSON.parse(saved);
      }
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastVisit: null,
        xp: 0,
        level: 1,
        activities: []
      };
    } catch (err) {
      console.error('Error loading streak data:', err);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastVisit: null,
        xp: 0,
        level: 1,
        activities: []
      };
    }
  });

  // Update streak on component mount
  useEffect(() => {
    updateStreak();
  }, []);

  // Calculate level based on XP
  const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 10)) + 1;
  };

  // Update streak data
  const updateStreak = (): void => {
    try {
      const today = new Date().toDateString();
      
      // Create a new streak object to update
      const newStreak: StreakData = { ...streak };
      
      if (streak.lastVisit) {
        const lastVisitDate = new Date(streak.lastVisit);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisitDate.toDateString() === yesterday.toDateString()) {
          // User visited yesterday, increment streak
          newStreak.currentStreak += 1;
          
          // Check if this is a new longest streak
          if (newStreak.currentStreak > newStreak.longestStreak) {
            newStreak.longestStreak = newStreak.currentStreak;
          }
        } else if (lastVisitDate.toDateString() !== today) {
          // User didn't visit yesterday, reset streak
          newStreak.currentStreak = 1;
        }
      } else {
        // First visit
        newStreak.currentStreak = 1;
      }
      
      // Update last visit
      newStreak.lastVisit = today;
      
      // Save to state and localStorage
      setStreak(newStreak);
      localStorage.setItem('user_streak', JSON.stringify(newStreak));
    } catch (err) {
      console.error('Error updating streak:', err);
    }
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
      
      // Save to state and localStorage
      setStreak(newStreak);
      localStorage.setItem('user_streak', JSON.stringify(newStreak));
      
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
      localStorage.setItem('user_streak', JSON.stringify(resetData));
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