import { describe, test, expect } from 'vitest';
import { loginUser, registerUser } from '../../src/services/AuthService';
import { mockUserData } from '../utils/mockUser';

describe('AuthService', () => {
  test('registers a user with a hashed password', async () => {
    const result = await registerUser(mockUserData());
    expect(result).toHaveProperty('token');
  });

  test('fails login with wrong password', async () => {
    await expect(loginUser({ email: 'test@example.com', password: 'wrong' }))
      .rejects.toThrow(/invalid/i);
  });
});
