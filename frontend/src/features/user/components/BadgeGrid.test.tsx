import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  const passthrough =
    (tag: string) =>
    ({ children, initial, animate, exit, transition, whileHover, whileTap, layout, ...rest }: any) =>
      React.createElement(tag, rest, children);
  return {
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    motion: new Proxy({}, { get: (_t, prop: string) => passthrough(prop) }),
  };
});

import BadgeGrid from './BadgeGrid';

const badges: any[] = [
  { _id: 'b1', name: 'Common', description: '', icon: '🥉', level: 'bronze', category: 'upload', rarity: 'common', earnedAt: '2026-03-01', xpReward: 10 },
  { _id: 'b2', name: 'Legendary', description: '', icon: '🏆', level: 'platinum', category: 'ai', rarity: 'legendary', earnedAt: '2026-01-01', xpReward: 100 },
  { _id: 'b3', name: 'Rare', description: '', icon: '🥈', level: 'gold', category: 'streak', rarity: 'rare', earnedAt: '2026-02-01', xpReward: 50 },
];

const renderedOrder = (): string[] =>
  Array.from(document.querySelectorAll('[data-testid^="badge-item-"]')).map(
    (el) => el.getAttribute('data-testid')!.replace('badge-item-', '')
  );

describe('BadgeGrid sorting', () => {
  it('defaults to rarest-first order', () => {
    render(<BadgeGrid badges={badges} newBadgeIds={[]} />);
    expect(renderedOrder()).toEqual(['b2', 'b3', 'b1']); // legendary > rare > common
  });

  it('reorders by newest earned when the sort is changed', () => {
    render(<BadgeGrid badges={badges} newBadgeIds={[]} />);
    fireEvent.change(screen.getByTestId('badge-sort'), { target: { value: 'date_desc' } });
    expect(renderedOrder()).toEqual(['b1', 'b3', 'b2']); // Mar > Feb > Jan
  });

  it('reorders by most XP', () => {
    render(<BadgeGrid badges={badges} newBadgeIds={[]} />);
    fireEvent.change(screen.getByTestId('badge-sort'), { target: { value: 'xp_desc' } });
    expect(renderedOrder()).toEqual(['b2', 'b3', 'b1']); // 100 > 50 > 10
  });
});
