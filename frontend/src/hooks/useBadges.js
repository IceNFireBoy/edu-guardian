import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export const useBadges = () => {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [unearnedBadges, setUnearnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch all badges (earned and unearned)
  const fetchBadges = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/users/me/badges', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch badges');
      }

      setEarnedBadges(data.data.earned || []);
      setUnearnedBadges(data.data.unearned || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Earn a badge
  const earnBadge = async (badgeId) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to earn badges');
      return null;
    }

    try {
      const response = await fetch('/api/v1/users/me/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ badgeId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to earn badge');
      }

      // Refresh badges
      await fetchBadges();
      
      // Show success toast
      toast.success(`Badge earned: ${data.data.badge.name} (+${data.data.badge.xpReward} XP)`);
      
      return data.data;
    } catch (err) {
      console.error('Error earning badge:', err);
      toast.error(err.message);
      return null;
    }
  };

  // Get badges by category
  const getBadgesByCategory = async (category) => {
    try {
      const response = await fetch(`/api/v1/badges/category/${category}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch badges by category');
      }

      return data.data;
    } catch (err) {
      console.error(`Error fetching ${category} badges:`, err);
      return [];
    }
  };

  // Get badges by rarity
  const getBadgesByRarity = async (rarity) => {
    try {
      const response = await fetch(`/api/v1/badges/rarity/${rarity}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch badges by rarity');
      }

      return data.data;
    } catch (err) {
      console.error(`Error fetching ${rarity} badges:`, err);
      return [];
    }
  };

  // Fetch badges on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchBadges();
    }
  }, [isAuthenticated]);

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