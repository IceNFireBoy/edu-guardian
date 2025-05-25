import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserBadge } from '../userTypes';
import { useToast } from '../../../hooks/useToast';

interface BadgeGridProps {
  badges: UserBadge[];
  newBadgeIds?: string[];
  showToast?: (args: { title: string; message: string; type: string }) => void;
}

const levelColorMap = {
  bronze: 'border-yellow-600',
  silver: 'border-gray-400',
  gold: 'border-yellow-400',
  platinum: 'border-blue-400',
};

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, newBadgeIds = [], showToast }) => {
  const toast = useToast();
  const showToastFn = showToast || toast.showToast;
  const [highlightedBadges, setHighlightedBadges] = useState<Set<string>>(new Set(newBadgeIds));
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Show toast notifications for new badges
    newBadgeIds.forEach(badgeId => {
        const badge = badges.find(b => b.id === badgeId);
        if (badge) {
        showToastFn({
            title: 'New Badge Unlocked!',
            message: `You've earned the ${badge.name} badge!`,
            type: 'success',
          });
        }
      });

    // Clear highlighting after 10 seconds
    const timeout = setTimeout(() => {
      setHighlightedBadges(new Set());
      }, 10000);

    return () => clearTimeout(timeout);
  }, [newBadgeIds, badges, showToastFn]);

  const filteredBadges = badges.filter(badge => {
    const matchesLevel = levelFilter === 'all' || badge.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || badge.category === categoryFilter;
    return matchesLevel && matchesCategory;
  });

  if (badges.length === 0) {
    return (
      <div data-testid="badge-grid-empty" className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">No Badges Yet</h3>
        <p className="text-gray-600">Complete activities to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div data-testid="badge-filters" className="flex gap-4 mb-6">
          <select 
          data-testid="badge-level-filter"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Levels</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          </select>

          <select 
          data-testid="badge-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Categories</option>
          <option value="upload">Upload</option>
          <option value="ai">AI</option>
          <option value="streak">Streak</option>
          <option value="achievement">Achievement</option>
          </select>
      </div>

      {filteredBadges.length === 0 ? (
        <div data-testid="badge-grid-no-matches" className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">No Matching Badges</h3>
          <p className="text-gray-600">Try adjusting your filters or earn more badges!</p>
         </div>
      ) : (
        <div data-testid="badge-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => (
            <motion.div
              key={badge.id}
              data-testid={`badge-item-${badge.id}`}
              data-badge-level={badge.level}
              data-badge-category={badge.category}
              data-badge-highlighted={highlightedBadges.has(badge.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-4 rounded-lg border-2 ${levelColorMap[badge.level]} 
                ${highlightedBadges.has(badge.id) ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {highlightedBadges.has(badge.id) && (
                <span
                  data-testid={`badge-new-tag-${badge.id}`}
                  className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded"
                >
                  New!
                </span>
              )}
              <div className="flex items-center gap-3">
                <img
                  src={badge.icon}
                  alt={badge.name}
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span data-testid={`badge-level-${badge.id}`} className="text-xs font-medium">
                      {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                    </span>
                    <span className="text-xs text-green-600">+{badge.xpReward} XP</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
      )}
    </div>
  );
};

export default BadgeGrid; 