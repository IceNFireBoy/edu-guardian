import { describe, test, expect } from 'vitest';
import { incrementXP, getUserStreak } from '../../src/services/UserService';
import { mockUser } from '../utils/mockUser';

describe('UserService', () => {
  test('increments XP correctly', () => {
    const user = mockUser({ xp: 100 });
    incrementXP(user, 50);
    expect(user.xp).toBe(150);
  });

  test('returns current user streak', () => {
    const user = mockUser({ streak: 4 });
    expect(getUserStreak(user)).toBe(4);
  });
});
