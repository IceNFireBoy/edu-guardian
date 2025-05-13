import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTrophy, FaCheckCircle } from 'react-icons/fa';
import { useBadges } from '../hooks/useBadges'; // Use TS version
import BadgeDetail, { getBadgeIcon } from './BadgeDetail'; // TSX version
import LoadingSpinner from './LoadingSpinner'; // TSX version
import type { Badge, BadgeRarity, BadgeCategory } from './BadgeDetail'; // Import types from BadgeDetail

// Define types for filter options
type FilterOptionValue = 'all' | BadgeCategory | BadgeRarity;

interface FilterOption {
  value: FilterOptionValue;
  label: string;
}

const BadgeGallery: React.FC = () => {
  const { earnedBadges, unearnedBadges, loading, error, fetchBadges } = useBadges();
  const [categoryFilter, setCategoryFilter] = useState<FilterOptionValue>('all');
  const [rarityFilter, setRarityFilter] = useState<FilterOptionValue>('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]); // fetchBadges should be stable if wrapped in useCallback in useBadges
  
  const allAvailableBadges = useMemo(() => {
    // Create a Set of earned badge IDs for quick lookup
    const earnedIds = new Set(earnedBadges.map(b => b._id));
    // Combine, ensuring unearned are only added if not already in earned (shouldn't happen with backend logic but safe)
    return [
      ...earnedBadges,
      ...unearnedBadges.filter(b => !earnedIds.has(b._id))
    ];
  }, [earnedBadges, unearnedBadges]);

  const filteredBadges = useMemo(() => {
    let badgesToFilter = showEarnedOnly ? earnedBadges : allAvailableBadges;
    
    if (categoryFilter !== 'all') {
      badgesToFilter = badgesToFilter.filter(badge => badge.category === categoryFilter);
    }
    if (rarityFilter !== 'all') {
      badgesToFilter = badgesToFilter.filter(badge => badge.rarity === rarityFilter);
    }
    return badgesToFilter;
  }, [allAvailableBadges, earnedBadges, showEarnedOnly, categoryFilter, rarityFilter]);
  
  const isBadgeEarned = (badgeId: string): boolean => {
    return earnedBadges.some(badge => badge._id === badgeId);
  };
  
  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
  };
  
  const handleCloseDetail = () => {
    setSelectedBadge(null);
  };
  
  const categories: FilterOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'notes', label: 'Notes' },
    { value: 'streak', label: 'Streak' },
    { value: 'xp', label: 'XP' },
    { value: 'community', label: 'Community' },
    { value: 'flashcards', label: 'Flashcards' },
    // Add other categories dynamically if needed
  ];
  
  const rarities: FilterOption[] = [
    { value: 'all', label: 'All Rarities' },
    { value: 'common', label: 'Common' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' }
  ];
  
  if (loading && allAvailableBadges.length === 0) { // Show full page loader only on initial load
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <LoadingSpinner size="lg" color="primary" />
        <p className="ml-3 text-gray-600 dark:text-gray-300">Loading Badges...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/30 rounded-lg">
        Error loading badges: {error}. Please try refreshing.
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaTrophy className="mr-3 text-yellow-500" />
          Badge Collection
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Filters can be extracted into a sub-component if they grow more complex */}
          <select
            className="select select-bordered select-sm w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as FilterOptionValue)}
            aria-label="Filter by category"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          <select
            className="select select-bordered select-sm w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as FilterOptionValue)}
            aria-label="Filter by rarity"
          >
            {rarities.map(rarity => (
              <option key={rarity.value} value={rarity.value}>
                {rarity.label}
              </option>
            ))}
          </select>
          
          <button
            className={`btn btn-sm w-full sm:w-auto flex items-center justify-center transition-colors ${showEarnedOnly ? 'btn-primary' : 'btn-outline btn-neutral dark:btn-outline-secondary'}`}
            onClick={() => setShowEarnedOnly(!showEarnedOnly)}
            aria-pressed={showEarnedOnly}
          >
            <FaFilter className="mr-2" />
            Earned Only
          </button>
        </div>
      </div>
      
      {loading && allAvailableBadges.length > 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">Updating badges...</div>
      )}

      {filteredBadges.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {filteredBadges.map(badge => {
              const isEarned = isBadgeEarned(badge._id);
              return (
                <motion.div
                  layout
                  key={badge._id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out 
                    border ${isEarned 
                      ? 'bg-white dark:bg-gray-700 shadow-lg border-green-300 dark:border-green-600' 
                      : 'bg-gray-100 dark:bg-gray-800 opacity-70 hover:opacity-100 border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => handleBadgeClick(badge)}
                  role="button"
                  aria-label={`View details for ${badge.name} badge`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-2 rounded-full ${isEarned ? 'bg-green-100 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      {getBadgeIcon(badge.rarity, 'text-2xl sm:text-3xl')}
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white truncate w-full" title={badge.name}>
                      {badge.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                      {badge.category}
                    </span>
                    {isEarned && (
                      <div className="absolute top-1 right-1 sm:-top-1 sm:-right-1 text-green-500 dark:text-green-400 bg-white dark:bg-gray-700 p-0.5 rounded-full shadow">
                        <FaCheckCircle size={16} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <FaTrophy className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-3" />
          No badges found matching your criteria.
        </div>
      )}
      
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetail 
            badge={selectedBadge} 
            onClose={handleCloseDetail} 
            isEarned={isBadgeEarned(selectedBadge._id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgeGallery; 