import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTrophy } from 'react-icons/fa';
import { useBadges } from '../hooks/useBadges';
import BadgeDetail, { getBadgeIcon } from './BadgeDetail';
import LoadingSpinner from './LoadingSpinner';

const BadgeGallery = () => {
  const { earnedBadges, unearnedBadges, loading, error, fetchBadges } = useBadges();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Fetch badges on mount
  useEffect(() => {
    fetchBadges();
  }, []);
  
  // Apply filters to badges
  const getFilteredBadges = () => {
    // Combine earned and unearned badges
    let allBadges = [...earnedBadges];
    
    // Add unearned badges if not showing earned only
    if (!showEarnedOnly) {
      allBadges = [...allBadges, ...unearnedBadges];
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      allBadges = allBadges.filter(badge => badge.category === categoryFilter);
    }
    
    // Apply rarity filter
    if (rarityFilter !== 'all') {
      allBadges = allBadges.filter(badge => badge.rarity === rarityFilter);
    }
    
    return allBadges;
  };
  
  // Check if a badge is earned
  const isBadgeEarned = (badgeId) => {
    return earnedBadges.some(badge => badge._id === badgeId);
  };
  
  // Handle badge click
  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
  };
  
  // Close badge detail modal
  const handleCloseDetail = () => {
    setSelectedBadge(null);
  };
  
  // List of all categories and rarities for filters
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'streak', label: 'Streak' },
    { value: 'xp', label: 'XP' },
    { value: 'notes', label: 'Notes' },
    { value: 'achievement', label: 'Achievement' }
  ];
  
  const rarities = [
    { value: 'all', label: 'All Rarities' },
    { value: 'common', label: 'Common' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' }
  ];
  
  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-4">
        Error loading badges: {error}
      </div>
    );
  }
  
  const filteredBadges = getFilteredBadges();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Filters */}
      <div className="mb-6 space-y-3 md:space-y-0 md:flex md:justify-between md:items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaTrophy className="mr-2 text-yellow-500" />
          Badge Collection
        </h2>
        
        <div className="flex flex-col md:flex-row gap-2">
          {/* Category filter */}
          <select
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-0 focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          {/* Rarity filter */}
          <select
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-0 focus:ring-2 focus:ring-blue-500"
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
          >
            {rarities.map(rarity => (
              <option key={rarity.value} value={rarity.value}>
                {rarity.label}
              </option>
            ))}
          </select>
          
          {/* Show earned only toggle */}
          <button
            className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
              showEarnedOnly 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
            onClick={() => setShowEarnedOnly(!showEarnedOnly)}
          >
            <FaFilter className="mr-2" />
            Earned Only
          </button>
        </div>
      </div>
      
      {/* Badge grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBadges.map(badge => {
            const isEarned = isBadgeEarned(badge._id);
            
            return (
              <motion.div
                key={badge._id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-4 rounded-lg cursor-pointer transition-all ${
                  isEarned 
                    ? 'bg-white dark:bg-gray-700 shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-900 opacity-60'
                }`}
                onClick={() => handleBadgeClick(badge)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    {getBadgeIcon(badge.name, badge.rarity, 'text-3xl')}
                  </div>
                  <h3 className="text-sm font-medium text-center text-gray-800 dark:text-white">
                    {badge.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
                  </span>
                  {isEarned && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No badges found matching the selected filters.
        </div>
      )}
      
      {/* Badge detail modal */}
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