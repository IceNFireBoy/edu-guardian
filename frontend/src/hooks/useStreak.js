import { useState, useEffect } from 'react';
import { 
  initializeStreakData, 
  checkAndUpdateStreak, 
  getStreakData, 
  logActivity
} from '../utils/streak';

/**
 * Hook for managing user streaks and XP
 * 
 * @returns {Object} streak and xp data and functions
 */
export const useStreak = () => {
  const [streakData, setStreakData] = useState({ streak: 0, xp: 0 });
  
  useEffect(() => {
    // Initialize streak data when the hook is first used
    initializeStreakData();
    
    // Check and update streak on component mount
    const data = checkAndUpdateStreak();
    setStreakData(data);
    
    // Log daily login activity
    logActivity('DAILY_LOGIN');
    
    // Set up interval to periodically update the streak data
    // This is useful for when users leave the tab open for a long time
    const intervalId = setInterval(() => {
      const updatedData = getStreakData();
      setStreakData(updatedData);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to record activity and update streak
  const recordActivity = (activityType) => {
    const updatedData = logActivity(activityType);
    setStreakData(updatedData);
    return updatedData;
  };
  
  return {
    ...streakData,
    recordActivity
  };
};

export default useStreak; 