import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../api/notes', () => ({
  callAuthenticatedApi: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

import { useUser, clearProfileCache } from '../useUser';
import { callAuthenticatedApi } from '../../../api/notes';

const apiMock = callAuthenticatedApi as unknown as ReturnType<typeof vi.fn>;

const profileFixture = {
  _id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user' as const,
  xp: 150,
  level: 2,
  streak: { current: 3, max: 5, lastUsed: new Date().toISOString() },
  badges: [],
  activity: [],
  subjects: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  emailVerified: true,
  favoriteNotes: [],
};

describe('useUser profile fetching (shared cache + dedupe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearProfileCache();
    apiMock.mockResolvedValue({ success: true, data: profileFixture });
  });

  it('two hook instances fetching concurrently share ONE request', async () => {
    const a = renderHook(() => useUser());
    const b = renderHook(() => useUser());

    await act(async () => {
      await Promise.all([
        a.result.current.fetchUserProfile(),
        b.result.current.fetchUserProfile(),
      ]);
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(a.result.current.profile?.username).toBe('testuser');
    expect(b.result.current.profile?.username).toBe('testuser');
  });

  it('later calls are served from the shared cache without a new request', async () => {
    const a = renderHook(() => useUser());
    await act(async () => {
      await a.result.current.fetchUserProfile();
    });

    const b = renderHook(() => useUser());
    await act(async () => {
      await b.result.current.fetchUserProfile();
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
    // A hook mounted after the cache is warm seeds its state immediately
    expect(b.result.current.profile?.username).toBe('testuser');
  });

  it('clearProfileCache forces the next fetch to hit the API again', async () => {
    const a = renderHook(() => useUser());
    await act(async () => {
      await a.result.current.fetchUserProfile();
    });

    clearProfileCache();

    await act(async () => {
      await a.result.current.fetchUserProfile();
    });

    expect(apiMock).toHaveBeenCalledTimes(2);
  });

  it('force=true bypasses the cache', async () => {
    const a = renderHook(() => useUser());
    await act(async () => {
      await a.result.current.fetchUserProfile();
      await a.result.current.fetchUserProfile(true);
    });

    expect(apiMock).toHaveBeenCalledTimes(2);
  });
});
