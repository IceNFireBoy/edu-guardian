import { useState, useCallback, useEffect, useRef } from 'react';
import { callAuthenticatedApi } from '../../api/apiClient';
import { UserProfile, CompleteStudyPayload } from './userTypes';

export const useUser = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newXp, setNewXp] = useState(0); // Track newly earned XP for animations
  const [newBadgeIds, setNewBadgeIds] = useState<string[]>([]); // Track newly earned badges
  
  // Refs for debouncing study completion
  const studyCompletionTimers = useRef<Record<string, number>>({});

  // Fetch user profile
  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<{ success: boolean, data: UserProfile }>('auth/me', 'GET');
      if (response.success && response.data) {
        setProfile(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch user profile');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Log note study completion
  const completeStudy = useCallback(async (payload: CompleteStudyPayload): Promise<boolean> => {
    // Prevent XP farming by checking if study was already completed recently
    const noteId = payload.noteId;
    const now = Date.now();
    
    // Check if there's a cooldown timer for this note
    if (studyCompletionTimers.current[noteId]) {
      const timeSinceLastCompletion = now - studyCompletionTimers.current[noteId];
      
      // If less than 5 minutes (300000ms) have passed, prevent completion
      if (timeSinceLastCompletion < 300000) {
        console.log(`Study completion for note ${noteId} throttled. Try again later.`);
        return false;
      }
    }
    
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Call API to log completion
      const response = await callAuthenticatedApi<{ 
        success: boolean;
        message: string;
        data: { 
          xpEarned: number;
          currentStreak: number;
          level: number;
          awardedBadges: any[];
          newBadgeCount: number;
        };
      }>(
        `/api/v1/user/study-complete`,
        'POST',
        payload
      );
      
      if (response.success) {
        // Set cooldown timer for this note
        studyCompletionTimers.current[noteId] = now;
        
        // Track new XP for animations
        if (response.data.xpEarned > 0) {
          setNewXp(response.data.xpEarned);
          setTimeout(() => setNewXp(0), 5000); // Reset after animation completes
        }
        
        // Track newly awarded badges
        if (response.data.awardedBadges && response.data.awardedBadges.length > 0) {
          const badgeIds = response.data.awardedBadges.map((badge: any) => badge.badge);
          setNewBadgeIds(badgeIds);
          setTimeout(() => setNewBadgeIds([]), 10000); // Reset after animation completes
        }
        
        // Refresh user profile to get updated XP, badges, etc.
        await fetchUserProfile();
        return true;
      }
      
      throw new Error(response.error || 'Failed to log study completion');
    } catch (err: any) {
      setError(err.message || 'Failed to log study completion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<{ success: boolean, data: UserProfile }>('auth/me', 'PUT', updates);
      if (response.success && response.data) {
        setProfile(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Failed to update profile');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch the profile when hook is first used
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    profile,
    loading,
    error,
    newXp,
    newBadgeIds,
    fetchUserProfile,
    completeStudy,
    updateProfile
  };
}; 