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
      name: 'First Upload',
      description: 'Upload your first note',
      icon: '/badges/upload.png',
      level: 'bronze',
      category: 'upload',
      xpReward: 100,
      earnedAt: '2024-03-20T00:00:00.000Z'
    },
    {
      _id: '2',
      id: '2',
      name: 'AI Master',
      description: 'Generate 10 flashcards',
      icon: '/badges/ai.png',
      level: 'silver',
      category: 'ai',
      xpReward: 200,
      earnedAt: '2024-03-21T00:00:00.000Z'
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
    expect(screen.getByText('First Upload')).toBeInTheDocument();
    expect(screen.getByText('AI Master')).toBeInTheDocument();
  });

  test('filters badges by level', () => {
    render(<BadgeGrid badges={mockBadges} />);
    const levelFilter = screen.getByTestId('badge-level-filter');
    fireEvent.change(levelFilter, { target: { value: 'bronze' } });
    expect(screen.getByText('First Upload')).toBeInTheDocument();
    expect(screen.queryByText('AI Master')).not.toBeInTheDocument();
  });

  test('filters badges by category', () => {
    render(<BadgeGrid badges={mockBadges} />);
    const categoryFilter = screen.getByTestId('badge-category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'ai' } });
    expect(screen.getByText('AI Master')).toBeInTheDocument();
    expect(screen.queryByText('First Upload')).not.toBeInTheDocument();
  });

  test('shows new badge notification', () => {
    const showToast = vi.fn();
    render(<BadgeGrid badges={mockBadges} newBadgeIds={['1']} showToast={showToast} />);
    expect(showToast).toHaveBeenCalledWith({
      title: 'New Badge Unlocked!',
      message: "You've earned the First Upload badge!",
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
