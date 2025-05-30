import React from 'react';
import { motion } from 'framer-motion';
import { FaAward, FaInfoCircle, FaArrowUp } from 'react-icons/fa';
import BadgeGallery from '../components/BadgeGallery';
import { useAuthContext } from '../features/auth/AuthContext';

// Basic User type, adjust if useAuth provides a more specific type
interface User {
  xp?: number;
  // Add other user properties if accessed here
}

const Badges: React.FC = () => {
  const { user } = useAuthContext(); // Use the correct context
  
  // Page fade-in animation
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="py-6 px-4 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaAward className="mr-3 text-yellow-500" />
          Badges & Achievements
        </h1>
        
        {user && (
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm flex items-center">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 dark:text-gray-400">Your XP</span>
              <span className="text-xl font-bold text-gray-800 dark:text-white">{user.xp || 0}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Info card */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-800 dark:text-blue-200">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-500 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium mb-1">About Badges</h3>
            <p className="text-sm">
              Badges are awarded for various achievements in your academic journey. Collect badges by 
              maintaining streaks, uploading notes, earning XP, and completing other achievements.
              Each badge earns you additional XP to help you progress.
            </p>
          </div>
        </div>
      </div>
      
      {/* XP Level Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaArrowUp className="mr-2 text-green-500" />
          XP Level Guide
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">Beginner Levels</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Novice</span>
                <span className="font-medium">0-100 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Apprentice</span>
                <span className="font-medium">101-500 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Scholar</span>
                <span className="font-medium">501-1000 XP</span>
              </li>
            </ul>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">Intermediate Levels</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Academic</span>
                <span className="font-medium">1001-2000 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Professor</span>
                <span className="font-medium">2001-3500 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Expert</span>
                <span className="font-medium">3501-5000 XP</span>
              </li>
            </ul>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">Advanced Levels</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Master</span>
                <span className="font-medium">5001-7500 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Sage</span>
                <span className="font-medium">7501-10000 XP</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Guardian</span>
                <span className="font-medium">10001+ XP</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Badge Gallery */}
      <BadgeGallery />
      
      {/* How to earn badges */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">How to Earn More Badges</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-800 dark:text-white">Daily Streaks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Log in consistently to build your streak. Badges are awarded at 3, 7, 14, 30, 60, and 100 days.
            </p>
            
            <h3 className="font-medium text-gray-800 dark:text-white mt-4">XP Milestones</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Earn XP by uploading notes, maintaining streaks, and completing tasks. XP badges are awarded
              at various milestones from 100 to 10,000 XP.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-800 dark:text-white">Notes Collection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload study notes to earn badges. Note badges are awarded for uploading 5, 15, 30, 50, and 100 notes.
            </p>
            
            <h3 className="font-medium text-gray-800 dark:text-white mt-4">Special Achievements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Complete special tasks like sharing notes, achieving perfect scores on quizzes, 
              or contributing high-quality content to earn achievement badges.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Badges; 