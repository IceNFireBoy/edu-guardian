import React from 'react';
import Achievements, { UserAchievement } from './Achievements'; // Import TSX component and type
import { FaLevelUpAlt, FaFire, FaListAlt, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';

// --- Types & Interfaces ---

interface RecentActivity {
  _id: string; // Assuming activities have IDs
  description: string;
  xpGained: number;
  timestamp: string; // ISO date string
}

interface UserStatsData {
  xp: number;
  currentStreak: number; // Renamed for clarity
  recentActivity?: RecentActivity[]; // Optional and potentially paginated
  achievements?: UserAchievement[]; // Use imported type
  // Add other user fields if needed: name, level (if calculated backend), etc.
}

interface UserStatsProps {
  user: UserStatsData | null; // Allow null if user data might not be loaded
  isLoading?: boolean; // Optional loading state
}

// --- Helper Functions ---

const calculateLevel = (xp: number): number => {
  // Consistent level calculation (ensure this matches backend/other frontend parts)
  return Math.floor(xp / 1000) + 1;
};

const calculateProgress = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  if (xpForNextLevel === xpForCurrentLevel) return 0; // Avoid division by zero if levels are 0 XP apart
  const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  return Math.min(100, Math.max(0, progress)); // Clamp between 0 and 100
};

const xpToNextLevel = (xp: number): number => {
    const nextLevelThreshold = calculateLevel(xp) * 1000;
    return Math.max(0, nextLevelThreshold - xp);
}

// --- UserStats Component ---

const UserStats: React.FC<UserStatsProps> = ({ user, isLoading = false }) => {

  if (isLoading) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
        User data not available.
      </div>
    );
  }

  const level = calculateLevel(user.xp);
  const progressPercent = calculateProgress(user.xp);
  const xpNeeded = xpToNextLevel(user.xp);

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Your Progress</h2>

        {/* Level and XP */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <FaLevelUpAlt className="mr-2 text-indigo-500" /> Level {level}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{user.xp.toLocaleString()} XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 text-right">
            {xpNeeded.toLocaleString()} XP to Level {level + 1}
          </p>
        </div>

        {/* Streak */}
        <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200 flex items-center">
            <FaFire className="mr-2 text-red-500" /> Current Streak
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{user.currentStreak || 0}</span>
            <span className="text-gray-600 dark:text-gray-300">days</span>
          </div>
          {user.currentStreak === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start studying consistently to build your streak!</p>
          )}
          {user.currentStreak > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keep the fire going! 🔥</p>
          )}
        </div>

        {/* Recent Activity - Keep it concise */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
              <FaListAlt className="mr-2 text-green-500" /> Recent Activity
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {user.recentActivity && user.recentActivity.length > 0 ? (
              user.recentActivity.slice(0, 5).map((activity) => ( // Limit to latest 5 for this card
                <div key={activity._id} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{activity.description}</span>
                  <span className="font-medium text-green-600 dark:text-green-400 whitespace-nowrap">+{activity.xpGained} XP</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No recent activity logged.</p>
            )}
          </div>
           {user.recentActivity && user.recentActivity.length > 5 && (
               <Link to="/home" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 block">View full activity feed...</Link>
           )}
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
      >
        <Achievements userAchievements={user.achievements} />
      </motion.div>
    </div>
  );
};

export default UserStats; 