import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaStar, FaTimes, IconType } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useBadges } from '../hooks/useBadges'; // Use TS version
import Button from './ui/Button'; // Use our TSX Button

// --- Types & Interfaces ---

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
type BadgeCategory = 'notes' | 'streak' | 'xp' | 'community' | 'flashcards' | string; // Allow custom categories

interface Badge {
  _id: string;
  name: string;
  description: string;
  requirements: string | number;
  xpReward: number;
  rarity: BadgeRarity;
  category: BadgeCategory;
  // Add icon field if badges define their own icon string/component
}

interface BadgeDetailProps {
  badge: Badge | null;
  onClose: () => void;
  isEarned?: boolean; // Is this badge already earned by the user?
}

interface RarityConfigItem {
  color: string; // background color class
  icon: IconType;
  textColor: string; // text color class
  border: string; // border color class
}

// --- Configuration ---

const rarityConfig: Record<BadgeRarity, RarityConfigItem> = {
  common: { 
    color: 'bg-gray-200 dark:bg-gray-700', 
    icon: FaMedal, 
    textColor: 'text-gray-700 dark:text-gray-200',
    border: 'border-gray-400 dark:border-gray-500'
  },
  rare: { 
    color: 'bg-blue-200 dark:bg-blue-800', 
    icon: FaTrophy, 
    textColor: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-400 dark:border-blue-600'
  },
  epic: { 
    color: 'bg-purple-200 dark:bg-purple-800', 
    icon: FaStar, 
    textColor: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-400 dark:border-purple-600'
  },
  legendary: { 
    color: 'bg-yellow-200 dark:bg-yellow-800', 
    icon: FaCrown, 
    textColor: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-400 dark:border-yellow-600'
  },
};

// --- Helper Functions ---

export const getBadgeIcon = (rarity: BadgeRarity = 'common', size: string = 'text-2xl'): React.ReactElement => {
  const config = rarityConfig[rarity];
  const IconComponent = config.icon;
  return <IconComponent className={`${size} ${config.textColor}`} />;
};

const formatCategory = (cat: BadgeCategory): string => {
  if (!cat) return 'General';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

// --- Component ---

const BadgeDetail: React.FC<BadgeDetailProps> = ({ badge, onClose, isEarned = false }) => {
  const [isEarning, setIsEarning] = useState(false);
  const { earnBadge } = useBadges(); // This hook needs to be refactored to TS eventually
  
  if (!badge) return null;
  
  const { _id, name, description, requirements, xpReward, rarity = 'common', category = 'general' } = badge;
  const config = rarityConfig[rarity];
  
  const handleEarnBadge = async () => {
    if (isEarned || isEarning) return;
    
    setIsEarning(true);
    try {
      // Assuming earnBadge is refactored to handle potential errors/return values
      await earnBadge(_id);
      toast.success(`Badge "${name}" earned!`);
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error("Error earning badge:", error);
      toast.error(error.message || 'Failed to earn badge. Please try again.');
    } finally {
      setIsEarning(false);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} // Close when clicking overlay
      >
        <motion.div 
          className={`relative max-w-sm w-full p-6 rounded-lg shadow-xl ${config.color} border-2 ${config.border}`}
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-name"
          aria-describedby="badge-description"
        >
          {/* Close button */}
          <Button 
            className="btn-ghost absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 p-1"
            onClick={onClose}
            aria-label="Close badge detail"
          >
            <FaTimes size={18} />
          </Button>
          
          {/* Badge header */}
          <div className="text-center mb-5">
            <div className={`mx-auto w-20 h-20 flex items-center justify-center rounded-full ${config.color} border-4 ${config.border} shadow-inner mb-3`}>
              {getBadgeIcon(rarity, 'text-4xl')}
            </div>
            <h2 id="badge-name" className={`text-2xl font-bold ${config.textColor}`}>{name}</h2>
            <div className="flex justify-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.textColor} bg-black/10 dark:bg-white/10 font-medium`}>
                {formatCategory(category)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.textColor} bg-black/10 dark:bg-white/10 font-medium`}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Badge info section */}
          <div className={`bg-white dark:bg-gray-800 rounded-md p-4 mb-5 shadow-sm ${config.textColor.replace('text-', 'text-')} space-y-2`}>
            <p id="badge-description" className="text-sm text-gray-700 dark:text-gray-300 mb-3">{description}</p>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">Requirement:</span>
              <span className="text-gray-800 dark:text-gray-200 text-right">
                {typeof requirements === 'number' 
                  ? `${requirements} ${category === 'streak' ? 'days' : category === 'xp' ? 'XP points' : 'notes'}` // Example formatting
                  : requirements}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">XP Reward:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{xpReward} XP</span>
            </div>
          </div>
          
          {/* Badge actions (example - might not be needed if modal is just display) */}
          {!isEarned ? (
            <Button 
              className={`w-full btn-primary ${config.textColor}`}
              onClick={handleEarnBadge}
              disabled={isEarning}
            >
              {isEarning ? 'Checking...' : `Claim Reward (+${xpReward} XP)`} 
              {/* Adjust text based on context - is this modal shown only for earnable badges? */}
            </Button>
          ) : (
            <div className="w-full py-2 px-4 rounded-lg font-semibold bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-center border border-green-300 dark:border-green-600">
              Already Earned!
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BadgeDetail;

export type { Badge, BadgeRarity, BadgeCategory }; 