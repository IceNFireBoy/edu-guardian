import { describe, test, expect } from 'vitest';
import { checkAndAwardBadges } from '../../src/services/BadgeService';
import { mockUser } from '../utils/mockUser';

describe('BadgeService', () => {
  test('awards AI Novice badge at 1 summary', async () => {
    const user = mockUser({ totalSummariesGenerated: 1 });
    const awarded = await checkAndAwardBadges(user);
    expect(awarded).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'AI Novice' })
    ]));
  });

  test('does not award badge for zero summaries', async () => {
    const user = mockUser({ totalSummariesGenerated: 0 });
    const awarded = await checkAndAwardBadges(user);
    expect(awarded).toEqual([]);
  });
});
