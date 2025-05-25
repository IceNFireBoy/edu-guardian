import { renderHook, act, waitFor } from '@testing-library/react';
import { http, response } from 'msw';
import { server } from '../../../mocks/server'; // MSW server
import { useUser } from '../useUser';
import { UserProfile, CompleteStudyPayload } from '../userTypes';

// Helper to wrap hook and provide context if needed (e.g., AuthContext)
// For now, useUser seems self-contained or relies on a global apiClient implicitly.

const mockProfile: UserProfile = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user',
  xp: 100,
  level: 2,
  streak: { current: 3, max: 5, lastUsed: new Date().toISOString() },
  aiUsage: { summaryUsed: 1, flashcardUsed: 2, lastReset: new Date().toISOString() },
  profileImage: 'no-photo.jpg',
  biography: 'Test bio',
  preferences: { darkMode: false, emailNotifications: true },
  badges: [],
  activity: [],
  subjects: [],
  createdAt: new Date().toISOString(),
  emailVerified: true,
  favoriteNotes: [],
  totalSummariesGenerated: 1,
  totalFlashcardsGenerated: 2,
};

describe('useUser Hook', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test to ensure a clean state
    server.resetHandlers();
    // Mock successful profile fetch by default for most tests
    server.use(
      http.get('/api/v1/auth/profile', () => {
        return HttpResponse.json({ success: true, data: mockProfile });
      })
    );
  });

  it('should fetch user profile on initial render', async () => {
    const { result } = renderHook(() => useUser());

    // Loading state should be true initially, then false
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('should handle error when fetching user profile fails', async () => {
    server.use(
      http.get('/api/v1/auth/profile', () => {
        return HttpResponse.json({ success: false, error: 'Network Error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe('Network Error');
  });

  it('should update profile successfully', async () => {
    const updates: Partial<UserProfile> = { name: 'Updated Name', biography: 'Updated Bio' };
    const updatedProfileResponse: UserProfile = { ...mockProfile, ...updates };

    server.use(
      http.put('/api/v1/auth/profile', async ({ request }) => {
        const body = await request.json() as Partial<UserProfile>;
        expect(body).toEqual(updates); // Verify payload
        return HttpResponse.json({ success: true, data: { ...mockProfile, ...body } });
      })
    );

    const { result } = renderHook(() => useUser());
    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false)); 

    let updatedProfileData: UserProfile | null = null;
    await act(async () => {
      updatedProfileData = await result.current.updateProfile(updates);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toEqual(updatedProfileResponse);
    expect(updatedProfileData).toEqual(updatedProfileResponse);
    expect(result.current.error).toBeNull();
  });

  it('should handle error when updating profile fails', async () => {
    server.use(
      http.put('/api/v1/auth/profile', () => {
        return HttpResponse.json({ success: false, error: 'Update Failed' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateProfile({ name: 'Still Fails' });
    });

    expect(result.current.error).toBe('Update Failed');
  });

  describe('completeStudy', () => {
    const studyPayload: CompleteStudyPayload = { noteId: 'note123', duration: 600, pointsEarned: 10 };
    const mockStudyResponse = {
      success: true,
      message: 'Study logged',
      data: {
        xpEarned: 10,
        currentStreak: 4,
        level: 3,
        awardedBadges: [{ badge: 'badge1', name: 'Study Badge' }],
        newBadgeCount: 1,
      },
    };

    it('should log study completion, update XP/badges, and refresh profile', async () => {
      server.use(
        http.post('/api/v1/user/study-complete', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(studyPayload);
          return HttpResponse.json(mockStudyResponse);
        }),
        // Mock the profile refresh call that happens after study completion
        http.get('/api/v1/auth/profile', () => {
            // Simulate profile update after study completion
            return HttpResponse.json({ success: true, data: { ...mockProfile, xp: mockProfile.xp + mockStudyResponse.data.xpEarned } });
          }, { once: true }) // Ensure this mock is only for the refresh call after the first successful call from the initial setup
      );

      const { result } = renderHook(() => useUser());
      // Wait for initial profile load
      await waitFor(() => expect(result.current.loading).toBe(false));
      const initialProfileCallCount = server.listens({ method: 'GET', path: '/api/v1/auth/profile' }).length;

      let success: boolean = false;
      await act(async () => {
        success = await result.current.completeStudy(studyPayload);
      });

      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.newXp).toBe(mockStudyResponse.data.xpEarned);
      expect(result.current.newBadgeIds).toEqual(['badge1']);
      
      // Check if fetchUserProfile was called again after completeStudy
      // This requires careful handling of MSW's `once` or inspecting call counts.
      // For now, we expect the profile to be updated based on the second mockProfile call.
      await waitFor(() => {
        expect(result.current.profile?.xp).toBe(mockProfile.xp + mockStudyResponse.data.xpEarned);
      });
      
      // Ensure timers are cleared eventually for newXp and newBadgeIds
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer than badge reset timeout
      expect(result.current.newXp).toBe(0);
      expect(result.current.newBadgeIds).toEqual([]);
    });

    it('should be throttled if called multiple times for the same note within cooldown', async () => {
        server.use(
            http.post('/api/v1/user/study-complete', () => HttpResponse.json(mockStudyResponse))
        );
        const { result } = renderHook(() => useUser());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let success1 = false, success2 = false;
        await act(async () => {
            success1 = await result.current.completeStudy(studyPayload);
        });
        expect(success1).toBe(true);

        // Immediately try again
        await act(async () => {
            success2 = await result.current.completeStudy(studyPayload);
        });
        expect(success2).toBe(false); // Should be throttled
    });

    // TODO: Test completeStudy failure
  });
}); 