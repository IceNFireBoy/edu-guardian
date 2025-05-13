import React, { useState, useEffect } from 'react';
import { UserBadge } from '../userTypes';
import { FaTrophy, FaMedal, FaAward, FaStar, FaShieldAlt, FaCrown, FaFilter } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useToast } from '../../../hooks/useToast';

interface BadgeGridProps {
  badges: UserBadge[];
  className?: string;
  newBadgeIds?: string[]; // IDs of newly unlocked badges to highlight
}

const BADGE_LEVELS: UserBadge['level'][] = ['bronze', 'silver', 'gold', 'platinum'];
const BADGE_CATEGORIES = ['upload', 'engagement', 'streak', 'achievement', 'special', 'ai', 'all']; // 'all' for no filter

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, className = '', newBadgeIds = [] }) => {
  const [highlightedBadges, setHighlightedBadges] = useState<string[]>(newBadgeIds || []);
  const { showToast } = useToast();

  const [filterLevel, setFilterLevel] = useState<UserBadge['level'] | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (newBadgeIds && newBadgeIds.length > 0) {
      setHighlightedBadges(newBadgeIds);
      newBadgeIds.forEach((badgeId) => {
        const badge = badges.find(b => b.id === badgeId);
        if (badge) {
          showToast({
            title: 'New Badge Unlocked!',
            message: `You've earned the ${badge.name} badge!`,
            type: 'success',
            icon: <FaAward className="text-yellow-500" />
          });
        }
      });
      const timer = setTimeout(() => {
        setHighlightedBadges([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [newBadgeIds, badges, showToast]);

  const filteredBadges = badges.filter(badge => {
    const levelMatch = filterLevel === 'all' || badge.level === filterLevel;
    const categoryMatch = filterCategory === 'all' || badge.category === filterCategory;
    return levelMatch && categoryMatch;
  });

  const levelColorMap: Record<string, { bg: string; text: string; border: string; icon?: React.ReactElement }> = {
    bronze: { bg: 'bg-yellow-600/10 dark:bg-yellow-700/20', text: 'text-yellow-700 dark:text-yellow-500', border: 'border-yellow-600 dark:border-yellow-700', icon: <FaMedal /> },
    silver: { bg: 'bg-gray-400/10 dark:bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500 dark:border-gray-600', icon: <FaShieldAlt /> },
    gold: { bg: 'bg-amber-400/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500 dark:border-amber-600', icon: <FaTrophy /> },
    platinum: { bg: 'bg-indigo-500/10 dark:bg-indigo-600/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500 dark:border-indigo-600', icon: <FaCrown /> },
    default: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' }
  };

  if (!badges || badges.length === 0) {
    return (
      <div className={`text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <FaTrophy className="text-gray-400 text-4xl mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-500">No Badges Yet</h3>
        <p className="text-sm text-gray-400 mt-1">
          Complete activities to earn your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center">
        <FaFilter className="text-primary text-lg hidden sm:block"/>
        <div className="flex-grow w-full sm:w-auto">
          <label htmlFor="badge-level-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
          <select 
            id="badge-level-filter"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as UserBadge['level'] | 'all')}
            className="input input-bordered w-full"
          >
            <option value="all">All Levels</option>
            {BADGE_LEVELS.map(level => (
              <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex-grow w-full sm:w-auto">
          <label htmlFor="badge-category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select 
            id="badge-category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input input-bordered w-full"
          >
            <option value="all">All Categories</option>
            {BADGE_CATEGORIES.filter(cat => cat !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredBadges.length === 0 && (
         <div className={`text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
            <FaTrophy className="text-gray-400 text-4xl mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">No Matching Badges</h3>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or earn more badges!
            </p>
         </div>
      )}

      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}>
        {filteredBadges.map((badge) => {
          const isHighlighted = highlightedBadges.includes(badge.id);
          const levelInfo = levelColorMap[badge.level] || levelColorMap.default;
          
          return (
            <motion.div
              key={badge.id}
              className={`${
                isHighlighted 
                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400' 
                  : `${levelInfo.bg} ${levelInfo.border}`
              } rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-300 border flex flex-col items-center relative`}
              whileHover={{ y: -5, scale: 1.03 }}
              animate={isHighlighted ? {
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 0px #FCD34D', '0 0 15px #FCD34D', '0 0 0px #FCD34D'],
              } : {}}
              transition={{ duration: 0.5, repeat: isHighlighted ? 2 : 0 }}
            >
              {isHighlighted && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-lg"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  New!
                </motion.div>
              )}

              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${levelInfo.bg} ${levelInfo.text} border ${levelInfo.border}`}>
                {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
              </div>
            
              {badge.icon ? (
                <img
                  src={badge.icon}
                  alt={badge.name}
                  className="w-16 h-16 mb-3 object-contain mt-4"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full ${
                  isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/50' : levelInfo.bg
                } flex items-center justify-center mb-3 mt-4`}> 
                  <span className={`${levelInfo.text} text-3xl`}>{levelInfo.icon || <FaAward />}</span>
                </div>
              )}
              <h3 className={`font-bold text-gray-900 dark:text-gray-100 text-center ${levelInfo.text}`}>{badge.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {badge.description}
              </p>
              <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 mt-2">
                +{badge.xpReward} XP
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGrid; 