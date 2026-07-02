import { useState, useCallback, useEffect, useRef } from 'react';
// Use the envelope-returning client (ApiResponse<T> with success/data/error) —
// this hook consumes response.success/.data. It wraps the same shared axios
// instance under the hood.
import { callAuthenticatedApi } from '../../api/notes';
import { UserProfile, CompleteStudyPayload, StudyCompletionResult } from './userTypes';

export type { StudyCompletionResult };
import { toast } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Module-level profile cache shared by EVERY useUser() instance. Several
// components mount this hook at once (pages, header, useStreak); without
// sharing, each fired its own GET /auth/me — painful on a cold-starting
// free-tier backend. One request serves all subscribers, and components that
// mount later render instantly from the cached profile.
// ---------------------------------------------------------------------------
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let sharedProfile: UserProfile | null = null;
let sharedProfileAt = 0;
let profileRequest: Promise<UserProfile> | null = null;
let badgesRequest: Promise<any[]> | null = null;

/** Reset the shared cache — call on login/register/logout so a new session
 *  never sees the previous user's data. */
export const clearProfileCache = (): void => {
  sharedProfile = null;
  sharedProfileAt = 0;
  profileRequest = null;
  badgesRequest = null;
};

export const useUser = () => {
  // Seed from the shared cache so late mounts render immediately.
  const [profile, setProfile] = useState<UserProfile | null>(() => sharedProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newXp, setNewXp] = useState(0); // Track newly earned XP for animations
  const [newBadgeIds, setNewBadgeIds] = useState<string[]>([]);

  // Refs for debouncing study completion
  const studyCompletionTimers = useRef<Record<string, number>>({});

  const fetchUserProfile = useCallback(async (force = false): Promise<UserProfile | null> => {
    if (!force && sharedProfile && Date.now() - sharedProfileAt < PROFILE_CACHE_TTL) {
      setProfile(sharedProfile);
      return sharedProfile;
    }

    setLoading(true);
    setError(null);

    // Only the first caller starts a request; everyone else joins it.
    const isInitiator = !profileRequest;
    if (!profileRequest) {
      profileRequest = (async (): Promise<UserProfile> => {
        try {
          const response = await callAuthenticatedApi<UserProfile>('/auth/me', 'GET');
          if (response.success && response.data) {
            sharedProfile = response.data;
            sharedProfileAt = Date.now();
            return response.data;
          }
          throw new Error(response.error || response.message || 'Failed to fetch user profile');
        } finally {
          profileRequest = null;
        }
      })();
    }

    try {
      const data = await profileRequest;
      setProfile(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch user profile';
      setError(errorMessage);
      if (isInitiator) toast.error(errorMessage); // one toast, not one per subscriber
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBadges = useCallback(async (force = false) => {
    if (!force && profile?.badges && Date.now() - sharedProfileAt < PROFILE_CACHE_TTL) {
      return profile.badges;
    }

    setLoading(true);
    setError(null);
    try {
      // Backend: GET /users/me/badges -> { success, count, data: Badge[] }.
      // Deduped across hook instances like the profile fetch.
      if (!badgesRequest) {
        badgesRequest = (async (): Promise<any[]> => {
          try {
            const res = await callAuthenticatedApi<any[]>('/users/me/badges', 'GET');
            if (res.success && Array.isArray(res.data)) return res.data;
            throw new Error(res.error || res.message || 'Failed to fetch user badges');
          } finally {
            badgesRequest = null;
          }
        })();
      }
      const badges = await badgesRequest;
      const newBadges = badges.filter(badge =>
        !profile?.badges?.some(existingBadge => existingBadge._id === badge._id)
      );
      if (newBadges.length > 0) {
        setNewBadgeIds(newBadges.map(badge => badge._id));
        toast.success(`Earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`);
      }
      return badges;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch user badges';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.badges]);

  // Log note study completion
  const completeStudy = useCallback(async (payload: CompleteStudyPayload): Promise<StudyCompletionResult | null> => {
    // Prevent XP farming by checking if study was already completed recently
    const noteId = payload.noteId;
    const now = Date.now();

    // Check if there's a cooldown timer for this note
    if (studyCompletionTimers.current[noteId]) {
      const timeSinceLastCompletion = now - studyCompletionTimers.current[noteId];

      // If less than 5 minutes (300000ms) have passed, prevent completion
      if (timeSinceLastCompletion < 300000) {
        console.log(`Study completion for note ${noteId} throttled. Try again later.`);
        return null;
      }
    }

    // Set loading state
    setLoading(true);
    setError(null);

    try {
      // Backend: POST /users/study-complete -> { success, data: { message,
      // xpEarned, user: { streak, xp, level }, studiedNote, newBadges } }
      const response = await callAuthenticatedApi<{
        message?: string;
        user?: { streak?: any; xp?: number; level?: number; lastActive?: string };
        xpEarned?: number;
        studiedNote?: StudyCompletionResult['studiedNote'];
        newBadges?: unknown[];
      }>(
        '/users/study-complete',
        'POST',
        payload
      );

      if (response.success) {
        // Set cooldown timer for this note
        studyCompletionTimers.current[noteId] = now;

        // Track new XP for animations (when provided by the backend)
        const xpEarned = response.data?.xpEarned ?? 0;
        if (xpEarned > 0) {
          setNewXp(xpEarned);
          setTimeout(() => setNewXp(0), 5000); // Reset after animation completes
        }

        const newBadges = response.data?.newBadges ?? [];
        if (newBadges.length > 0) {
          setNewBadgeIds(newBadges.map((b: any) => (typeof b === 'string' ? b : b?.badge)));
          setTimeout(() => setNewBadgeIds([]), 10000); // Reset after animation completes
        }

        // Refresh user profile to get updated XP, badges, streak and the
        // studiedNotes list (which marks cards as studied).
        await fetchUserProfile(true);
        return {
          xpEarned,
          streak: response.data?.user?.streak ?? null,
          newBadges,
          studiedNote: response.data?.studiedNote ?? null
        };
      }

      throw new Error(response.error || 'Failed to log study completion');
    } catch (err: any) {
      setError(err.message || 'Failed to log study completion');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<UserProfile>('/auth/me', 'PUT', updates);
      if (response.success && response.data) {
        // Keep the shared cache in sync so other useUser() instances see the update
        sharedProfile = response.data;
        sharedProfileAt = Date.now();
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

  useEffect(() => {
    // Don't fire authenticated requests when nobody is logged in
    if (!localStorage.getItem('token')) {
      return;
    }
    fetchUserProfile();
    fetchUserBadges();
  }, []);

  return {
    profile,
    loading,
    error,
    newXp,
    newBadgeIds,
    fetchUserProfile,
    fetchUserBadges,
    completeStudy,
    updateProfile,
    setNewBadgeIds
  };
}; 