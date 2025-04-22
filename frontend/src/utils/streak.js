/**
 * Streak utility functions for tracking user activity
 */

const STREAK_KEY = 'edu_guardian_streak';
const XP_KEY = 'edu_guardian_xp';
const LAST_ACTIVE_KEY = 'edu_guardian_last_active';

// Initialize streak data in localStorage if not present
export const initializeStreakData = () => {
  if (!localStorage.getItem(STREAK_KEY)) {
    localStorage.setItem(STREAK_KEY, '0');
  }
  
  if (!localStorage.getItem(XP_KEY)) {
    localStorage.setItem(XP_KEY, '0');
  }
  
  if (!localStorage.getItem(LAST_ACTIVE_KEY)) {
    localStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString());
  }
};

// Check if user is still on streak or if it's broken
export const checkAndUpdateStreak = () => {
  const lastActive = new Date(localStorage.getItem(LAST_ACTIVE_KEY));
  const now = new Date();
  
  // Get the date without time for comparison
  const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate the difference in days
  const diffTime = today.getTime() - lastActiveDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Update streak based on activity
  if (diffDays === 1) {
    // User was active yesterday, increment streak
    const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    localStorage.setItem(STREAK_KEY, (currentStreak + 1).toString());
    
    // Add bonus XP for continuing streak
    addXP(10 * (currentStreak + 1)); // Increase bonus for longer streaks
  } else if (diffDays > 1) {
    // Streak broken, reset to 1 (today)
    localStorage.setItem(STREAK_KEY, '1');
    
    // Add base XP for new streak
    addXP(10);
  } else if (diffDays === 0 && lastActiveDate.getTime() !== today.getTime()) {
    // First visit today, but not a new day from last active, just update timestamp
    localStorage.setItem(LAST_ACTIVE_KEY, now.toISOString());
  }

  // Update the last active time
  localStorage.setItem(LAST_ACTIVE_KEY, now.toISOString());
  
  return {
    streak: parseInt(localStorage.getItem(STREAK_KEY) || '0', 10),
    xp: parseInt(localStorage.getItem(XP_KEY) || '0', 10)
  };
};

// Add XP for various actions
export const addXP = (amount) => {
  const currentXP = parseInt(localStorage.getItem(XP_KEY) || '0', 10);
  localStorage.setItem(XP_KEY, (currentXP + amount).toString());
  return currentXP + amount;
};

// Get current streak and XP
export const getStreakData = () => {
  return {
    streak: parseInt(localStorage.getItem(STREAK_KEY) || '0', 10),
    xp: parseInt(localStorage.getItem(XP_KEY) || '0', 10)
  };
};

// Activity types and their XP rewards
export const ACTIVITY_REWARDS = {
  VIEW_NOTE: 5,
  UPLOAD_NOTE: 50,
  DAILY_LOGIN: 10,
  COMPLETE_PROFILE: 100
};

// Log activity and award XP
export const logActivity = (activityType) => {
  if (ACTIVITY_REWARDS[activityType]) {
    addXP(ACTIVITY_REWARDS[activityType]);
  }
  
  // Ensure we update the streak
  return checkAndUpdateStreak();
}; 