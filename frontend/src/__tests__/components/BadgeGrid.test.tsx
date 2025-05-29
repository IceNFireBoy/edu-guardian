import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import BadgeGrid from '../../features/user/components/BadgeGrid';

// Mock the useToast hook
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('BadgeGrid', () => {
  const mockBadges = [
    {
      _id: '1',
      id: '1',
      name: 'Test Badge 1',
      description: 'Test Description 1',
      icon: 'test-icon-1',
      level: 'bronze' as const,
      category: 'achievement',
      xpReward: 100,
      earnedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      _id: '2',
      id: '2',
      name: 'Test Badge 2',
      description: 'Test Description 2',
      icon: 'test-icon-2',
      level: 'silver' as const,
      category: 'engagement',
      xpReward: 200,
      earnedAt: '2024-01-02T00:00:00.000Z'
    }
  ];

  test('renders empty state when no badges', () => {
    render(<BadgeGrid badges={[]} />);
    expect(screen.getByTestId('badge-grid-empty')).toBeInTheDocument();
    expect(screen.getByText('No Badges Yet')).toBeInTheDocument();
  });

  test('renders badges with correct information', () => {
    render(<BadgeGrid badges={mockBadges} />);
    expect(screen.getByTestId('badge-grid')).toBeInTheDocument();
    expect(screen.getByText('Test Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Test Badge 2')).toBeInTheDocument();
  });

  test('filters badges by level', () => {
    render(<BadgeGrid badges={mockBadges} />);
    const levelFilter = screen.getByTestId('badge-level-filter');
    fireEvent.change(levelFilter, { target: { value: 'bronze' } });
    expect(screen.getByText('Test Badge 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Badge 2')).not.toBeInTheDocument();
  });

  test('filters badges by category', () => {
    render(<BadgeGrid badges={mockBadges} />);
    const categoryFilter = screen.getByTestId('badge-category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'engagement' } });
    expect(screen.getByText('Test Badge 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Badge 1')).not.toBeInTheDocument();
  });

  test('shows new badge notification', () => {
    const showToast = vi.fn();
    render(<BadgeGrid badges={mockBadges} newBadgeIds={['1']} showToast={showToast} />);
    expect(showToast).toHaveBeenCalledWith({
      title: 'New Badge Unlocked!',
      message: "You've earned the Test Badge 1 badge!",
      type: 'success'
    });
  });

  test('displays no matches message when filters return no results', () => {
    render(<BadgeGrid badges={mockBadges} />);
    const levelFilter = screen.getByTestId('badge-level-filter');
    fireEvent.change(levelFilter, { target: { value: 'platinum' } });
    expect(screen.getByTestId('badge-grid-no-matches')).toBeInTheDocument();
    expect(screen.getByText('No Matching Badges')).toBeInTheDocument();
  });
});
