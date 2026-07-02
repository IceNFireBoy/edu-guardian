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

// Ordering used when sorting by rarity. Falls back to the UI tier (level) when a
// badge has no backend rarity, so every badge still ranks deterministically.
const rarityRank: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const levelRank: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
const rankOf = (b: UserBadge): number =>
  rarityRank[(b.rarity || '').toLowerCase()] ?? levelRank[b.level] ?? 0;

type SortKey = 'rarity_desc' | 'date_desc' | 'date_asc' | 'xp_desc';

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, newBadgeIds = [], showToast }) => {
  const toast = useToast();
  const showToastFn = showToast || toast.showToast;
  const [highlightedBadges, setHighlightedBadges] = useState<Set<string>>(new Set(newBadgeIds));
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('rarity_desc');

  useEffect(() => {
    // Show toast notifications for new badges
    newBadgeIds.forEach(badgeId => {
        const badge = badges.find(b => b._id === badgeId);
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

  const filteredBadges = badges
    .filter(badge => {
      const matchesLevel = levelFilter === 'all' || badge.level === levelFilter;
      const matchesCategory = categoryFilter === 'all' || badge.category === categoryFilter;
      return matchesLevel && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
        case 'date_asc':
          return new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime();
        case 'xp_desc':
          return (b.xpReward ?? 0) - (a.xpReward ?? 0);
        case 'rarity_desc':
        default:
          return rankOf(b) - rankOf(a);
      }
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

          <select
          data-testid="badge-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 border rounded-md ml-auto"
          aria-label="Sort badges"
          >
            <option value="rarity_desc">Rarest first</option>
          <option value="date_desc">Newest earned</option>
          <option value="date_asc">Oldest earned</option>
          <option value="xp_desc">Most XP</option>
          </select>
      </div>

      {filteredBadges.length === 0 ? (
        <div data-testid="badge-grid-no-matches" className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">No Matching Badges</h3>
          <p className="text-gray-600">Try adjusting your filters or earn more badges!</p>
         </div>
      ) : (
        <div data-testid="badge-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const badgeId = badge._id;
            const level = badge.level && badge.level in levelColorMap ? badge.level : 'bronze';
            return (
            <motion.div
              key={badgeId}
              data-testid={`badge-item-${badgeId}`}
              data-badge-level={level}
              data-badge-category={badge.category}
              data-badge-highlighted={highlightedBadges.has(badgeId)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-4 rounded-lg border-2 ${levelColorMap[level]} 
                ${highlightedBadges.has(badgeId) ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {highlightedBadges.has(badgeId) && (
                <span
                  data-testid={`badge-new-tag-${badgeId}`}
                  className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded"
                >
                  New!
                </span>
              )}
              <div className="flex items-center gap-3">
                {/* icon may be a URL or an emoji string */}
                {badge.icon && /^https?:\/\//.test(badge.icon) ? (
                  <img src={badge.icon} alt={badge.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="w-12 h-12 flex items-center justify-center text-3xl" aria-hidden="true">
                    {badge.icon || '🏅'}
                  </span>
                )}
                <div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span data-testid={`badge-level-${badgeId}`} className="text-xs font-medium">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                    <span className="text-xs text-green-600">+{badge.xpReward ?? 0} XP</span>
                  </div>
                  {badge.earnedAt && !Number.isNaN(new Date(badge.earnedAt).getTime()) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
            );
          })}
      </div>
      )}
    </div>
  );
};

export default BadgeGrid; 