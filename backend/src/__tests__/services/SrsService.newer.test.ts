import { describe, it, expect } from 'vitest';
import { review, initialSchedule } from '../../services/SrsService';

// Pure SM-2 scheduling — no database required.
describe('SRS scheduling (SM-2)', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('schedules the first two good reviews at 1 then 6 days', () => {
    const s0 = initialSchedule(now);
    const s1 = review(s0, 5, now);
    expect(s1.interval).toBe(1);
    expect(s1.repetitions).toBe(1);

    const s2 = review(s1, 5, now);
    expect(s2.interval).toBe(6);
    expect(s2.repetitions).toBe(2);

    const s3 = review(s2, 5, now);
    expect(s3.interval).toBe(Math.round(6 * s2.easeFactor));
  });

  it('resets the interval and records a lapse on a poor answer (q < 3)', () => {
    let s = initialSchedule(now);
    s = review(s, 5, now); // interval 1
    s = review(s, 5, now); // interval 6
    const lapsed = review(s, 1, now);
    expect(lapsed.interval).toBe(1);
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.lapses).toBe(1);
  });

  it('never lets the ease factor drop below 1.3', () => {
    let s = initialSchedule(now);
    for (let i = 0; i < 10; i++) s = review(s, 0, now);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('sets dueDate interval days ahead of the review time', () => {
    const s = review(initialSchedule(now), 4, now);
    const expected = new Date(now.getTime() + s.interval * 24 * 60 * 60 * 1000);
    expect(s.dueDate.getTime()).toBe(expected.getTime());
  });
});
