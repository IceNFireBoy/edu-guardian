import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../features/auth/AuthContext';
import { callAuthenticatedApi } from '../api/notes';
import type { ApiResponse } from '../api/notes';
import { toast } from 'react-hot-toast';
import type { Badge, BadgeRarity, BadgeCategory } from '../components/BadgeDetail';
import { debug } from '../components/DebugPanel'; // Assuming debug is available

// --- Types for API Responses ---

interface UserBadgeData {
  earned: Badge[];
  unearned: Badge[];
}

interface EarnBadgeData {
  badge: Badge; // Assuming the earned badge data is returned
  // Potentially other data like updated XP, level, etc.
}

// --- Hook Implementation ---

export const useBadges = () => {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [unearnedBadges, setUnearnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthContext(); // Use the correct context

  // Fetch all badges (earned and unearned)
  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      setEarnedBadges([]);
      setUnearnedBadges([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      debug('[useBadges] Fetching user badges...');
      // The backend returns { success, count, data: Badge[] }
      const response = await callAuthenticatedApi<{ success: boolean, count: number, data: Badge[] }>(
        '/api/v1/users/me/badges',
        'GET'
      );

      if (response.success && Array.isArray(response.data)) {
        setEarnedBadges(response.data);
        setUnearnedBadges([]); // No unearned badges from this endpoint
        debug(`[useBadges] Fetched ${response.data.length} earned badges.`);
      } else {
        throw new Error(response.error || response.message || 'Failed to fetch badges: API error');
      }
    } catch (err: any) {
      console.error('Error fetching badges:', err);
      setError(err.message || 'An unexpected error occurred');
      setEarnedBadges([]);
      setUnearnedBadges([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Earn a badge
  const earnBadge = useCallback(async (badgeId: string): Promise<EarnBadgeData | null> => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to earn badges');
      return null;
    }
    
    // Consider adding loading/error state specific to this action if needed
    // setLoading(true); 
    // setError(null);
    try {
      debug('[useBadges] Attempting to earn badge:', badgeId);
      const response = await callAuthenticatedApi<EarnBadgeData>('/api/v1/users/me/badges', 'POST', { badgeId });

      if (response.success && response.data?.badge) {
        // Refresh badges
        await fetchBadges();
        
        // Show success toast
        toast.success(`Badge earned: ${response.data.badge.name} (+${response.data.badge.xpReward} XP)`);
        debug('[useBadges] Badge earned successfully:', response.data.badge.name);
        return response.data;
      } else {
        throw new Error(response.error || response.message || 'Failed to earn badge: API error');
      }
    } catch (err: any) {
      console.error('Error earning badge:', err);
      toast.error(err.message || 'Could not earn badge');
      setError(err.message); // Set hook-level error as well
      return null;
    } 
    // finally {
    //   setLoading(false);
    // }
  }, [isAuthenticated, fetchBadges]);

  // Get badges by category (Note: This fetches *all* badges of a category, not user-specific usually)
  const getBadgesByCategory = useCallback(async (category: string): Promise<Badge[]> => {
    // No loading/error state management here, just return data or empty array
    try {
      debug('[useBadges] Fetching badges by category:', category);
      const response = await callAuthenticatedApi<Badge[]>(`/api/v1/badges/category/${category}`, 'GET');
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      // Throw error even if success is true but data is not array
      throw new Error(response.error || response.message || 'Invalid data format for category badges');
    } catch (err: any) {
      console.error(`Error fetching ${category} badges:`, err);
      toast.error(`Could not fetch badges for category: ${category}`);
      return [];
    }
  }, []);

  // Get badges by rarity (Note: Similar to category, fetches all badges of a rarity)
  const getBadgesByRarity = useCallback(async (rarity: string): Promise<Badge[]> => {
    try {
      debug('[useBadges] Fetching badges by rarity:', rarity);
      const response = await callAuthenticatedApi<Badge[]>(`/api/v1/badges/rarity/${rarity}`, 'GET');
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.error || response.message || 'Invalid data format for rarity badges');
    } catch (err: any) {
      console.error(`Error fetching ${rarity} badges:`, err);
      toast.error(`Could not fetch badges for rarity: ${rarity}`);
      return [];
    }
  }, []);

  // Fetch badges on mount and when auth state changes
  useEffect(() => {
    fetchBadges(); // Call the memoized fetchBadges
  }, [fetchBadges]); // Dependency is now fetchBadges itself

  return {
    earnedBadges,
    unearnedBadges,
    loading,
    error,
    fetchBadges,
    earnBadge,
    getBadgesByCategory,
    getBadgesByRarity
  };
}; 