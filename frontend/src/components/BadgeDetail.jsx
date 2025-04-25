import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaStar, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useBadges } from '../hooks/useBadges';

// Map badge rarities to colors and styles
const rarityConfig = {
  common: { 
    color: 'bg-gray-300 dark:bg-gray-600', 
    icon: FaMedal, 
    textColor: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-400 dark:border-gray-500'
  },
  rare: { 
    color: 'bg-blue-300 dark:bg-blue-700', 
    icon: FaTrophy, 
    textColor: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-400 dark:border-blue-600'
  },
  epic: { 
    color: 'bg-purple-300 dark:bg-purple-700', 
    icon: FaStar, 
    textColor: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-400 dark:border-purple-600'
  },
  legendary: { 
    color: 'bg-yellow-300 dark:bg-yellow-700', 
    icon: FaCrown, 
    textColor: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-400 dark:border-yellow-600'
  },
};

// Get icon component for badge
export const getBadgeIcon = (name, rarity = 'common', size = 'text-2xl') => {
  const IconComponent = rarityConfig[rarity].icon;
  return <IconComponent className={`${size} ${rarityConfig[rarity].textColor}`} />;
};

// Badge detail modal
const BadgeDetail = ({ badge, onClose, isEarned = false }) => {
  const [isEarning, setIsEarning] = useState(false);
  const { earnBadge } = useBadges();
  
  if (!badge) return null;
  
  const { name, description, requirements, xpReward, rarity, category } = badge;
  const { color, textColor, border } = rarityConfig[rarity || 'common'];
  
  // Format category for display
  const formatCategory = (cat) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };
  
  // Handle earning a badge
  const handleEarnBadge = async () => {
    if (isEarned) return;
    
    setIsEarning(true);
    try {
      await earnBadge(badge._id);
      onClose();
    } catch (error) {
      toast.error('Failed to earn badge');
    } finally {
      setIsEarning(false);
    }
  };
  
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={`relative max-w-md w-full p-6 rounded-lg shadow-xl ${color} border-2 ${border}`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          className="absolute top-2 right-2 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        
        {/* Badge header */}
        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 mb-2">
            {getBadgeIcon(name, rarity, 'text-4xl')}
          </div>
          <h2 className={`text-xl font-bold ${textColor}`}>{name}</h2>
          <div className="flex justify-center gap-2 mt-1">
            <span className={`text-sm px-2 py-0.5 rounded-full ${textColor} bg-white bg-opacity-20 dark:bg-opacity-10`}>
              {formatCategory(category)}
            </span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${textColor} bg-white bg-opacity-20 dark:bg-opacity-10`}>
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </span>
          </div>
        </div>
        
        {/* Badge info */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 ${textColor.replace('text-', 'text-')}`}>
          <p className="mb-2">{description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Requirement:</span>
              <span>
                {typeof requirements === 'number' 
                  ? `${requirements} ${category === 'streak' ? 'days' : category === 'xp' ? 'XP points' : 'notes'}`
                  : requirements}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">XP Reward:</span>
              <span>{xpReward} XP</span>
            </div>
          </div>
        </div>
        
        {/* Badge actions */}
        {!isEarned ? (
          <button 
            className={`w-full py-2 px-4 rounded-lg font-medium bg-white dark:bg-gray-800 ${textColor} hover:bg-opacity-80 dark:hover:bg-opacity-80 disabled:opacity-50`}
            onClick={handleEarnBadge}
            disabled={isEarning}
          >
            {isEarning ? 'Earning...' : `Earn Badge (+${xpReward} XP)`}
          </button>
        ) : (
          <div className="w-full py-2 px-4 rounded-lg font-medium bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 text-center">
            Earned
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BadgeDetail; 