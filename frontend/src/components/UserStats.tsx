import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, UserAchievement } from '../features/user/userTypes';
import { Trophy, Star, BookOpen, Clock } from 'lucide-react';
import Achievements, { UserAchievement as AchievementsUserAchievement } from './Achievements'; // Import TSX component and type
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
  achievements?: AchievementsUserAchievement[]; // Use imported type
  // Add other user fields if needed: name, level (if calculated backend), etc.
}

interface UserStatsProps {
  user: UserProfile;
  className?: string;
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

const UserStats: React.FC<UserStatsProps> = ({ user, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.level}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.xp}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">XP</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.streak.current}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Day Streak</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.badges.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Badges</div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link 
          to="/profile/achievements" 
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          View all achievements →
        </Link>
      </div>
    </div>
  );
};

export default UserStats; 