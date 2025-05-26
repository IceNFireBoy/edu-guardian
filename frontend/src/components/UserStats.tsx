import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../features/user/userTypes';
import { Trophy, Star, BookOpen, Clock } from 'lucide-react';
import Achievements from './Achievements';
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
  profile: UserProfile;
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

const UserStats: React.FC<UserStatsProps> = ({ profile, className }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center">
          <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Level</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.level}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-blue-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">XP</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.xp}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center">
          <BookOpen className="w-6 h-6 text-green-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.notes?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center">
          <Clock className="w-6 h-6 text-purple-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.streak?.current || 0} days</p>
          </div>
        </div>
      </div>

      <div className="col-span-full">
        <Achievements achievements={profile.achievements || []} />
      </div>
    </div>
  );
};

export default UserStats; 