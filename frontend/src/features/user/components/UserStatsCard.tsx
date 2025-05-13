import React, { useState, useEffect } from 'react';
import { FaFire, FaBolt, FaTrophy, FaCalendarCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStreak } from '../userTypes'; // Import UserStreak type

interface UserStatsCardProps {
  xp: number;
  level: number;
  streak: UserStreak | undefined; // Changed from currentStreak and longestStreak
  className?: string;
  newXp?: number; // New XP that was just earned
}

// Calculate XP needed for the next level - simple geometric progression
const calculateNextLevelXP = (level: number): number => {
  return level * 100; // For level 1->2: 100 XP, level 2->3: 200 XP, etc.
};

const UserStatsCard: React.FC<UserStatsCardProps> = ({ 
  xp, 
  level, 
  streak, // Changed prop name
  newXp = 0,
  className = '' 
}) => {
  const [showXpGain, setShowXpGain] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(xp - newXp);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const xpForCurrentLevel = (level - 1) * 100; // XP required to reach current level
  const xpForNextLevel = calculateNextLevelXP(level); // XP required for next level
  const xpProgress = animatedXp - xpForCurrentLevel; // XP progress towards next level
  const progressPercentage = Math.min(100, Math.round((xpProgress / xpForNextLevel) * 100));
  
  // Handle XP animation when new XP is earned
  useEffect(() => {
    if (newXp > 0) {
      // Show the XP gain indicator
      setShowXpGain(true);
      
      // Animate XP value counting up
      const startXp = xp - newXp;
      const increment = Math.max(1, Math.floor(newXp / 30)); // Divide animation into ~30 steps or 1, whichever is larger
      let currentXp = startXp;
      
      // Start with a clean progress animation
      setAnimatedProgress(0);
      
      const animateXp = () => {
        if (currentXp < xp) {
          currentXp = Math.min(xp, currentXp + increment);
          setAnimatedXp(currentXp);
          requestAnimationFrame(animateXp);
        } else {
          // Finished XP animation
          setTimeout(() => {
            setShowXpGain(false);
          }, 3000); // Hide XP gain after 3 seconds
        }
      };
      
      // Stagger the animation starts slightly
      setTimeout(() => {
        requestAnimationFrame(animateXp);
        
        // Animate progress bar after a slight delay
        setTimeout(() => {
          setAnimatedProgress(progressPercentage);
        }, 500);
      }, 500);
    } else {
      // No new XP, set animated values to actual values
      setAnimatedXp(xp);
      setAnimatedProgress(progressPercentage);
    }
  }, [xp, newXp, progressPercentage]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
        {/* XP and Level */}
        <div className="p-4">
          <div className="flex items-center mb-2">
            <FaBolt className="text-yellow-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">XP & Level</h3>
          </div>
          
          <div className="text-center mb-2 relative">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{level}</div>
            <div className="text-sm text-gray-500">Current Level</div>
            
            <AnimatePresence>
              {showXpGain && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: -10 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 right-10 text-green-500 font-bold"
                >
                  +{newXp} XP
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>{xpProgress} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mb-1 overflow-hidden">
            <motion.div 
              className="bg-blue-600 h-2 rounded-full origin-left"
              initial={{ width: 0 }}
              animate={{ width: `${animatedProgress}%` }}
              transition={{ 
                duration: newXp > 0 ? 1.5 : 0.5,
                ease: "easeOut",
                delay: newXp > 0 ? 0.5 : 0 
              }}
            />
          </div>
          
          <div className="text-center text-xs text-gray-500">
            {xpForNextLevel - xpProgress} XP until level {level + 1}
          </div>
          
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total: <span className="text-blue-600 dark:text-blue-400">{animatedXp}</span> XP
            </span>
          </div>
        </div>
        
        {/* Streak */}
        <div className="p-4">
          <div className="flex items-center mb-2">
            <FaFire className="text-red-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Streak</h3>
          </div>
          
          <div className="text-center">
            <motion.div 
              className="text-4xl font-bold text-red-500 mb-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            >
              {streak?.current ?? 0} {/* Use streak.current */}
            </motion.div>
            <div className="text-sm text-gray-500 mb-4">Current Streak</div>
            
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaTrophy className="text-yellow-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {streak?.max ?? 0} days {/* Use streak.max */}
              </span>
            </div>
            <div className="text-xs text-gray-500">Longest Streak</div>
          </div>
          
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <FaCalendarCheck className="text-green-500" />
              <span>Keep learning daily to maintain your streak!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard; 