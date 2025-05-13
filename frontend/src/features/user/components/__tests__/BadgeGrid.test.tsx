import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BadgeGrid from '../BadgeGrid';
import { UserBadge } from '../../userTypes';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';

// Mock useToast
const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock framer-motion to simplify testing and avoid animation complexities
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      // @ts-ignore
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      // Add other motion components if used by BadgeGrid, e.g., span, h3
    },
  };
});


const mockBadges: UserBadge[] = [
  { id: '1', name: 'Bronze Uploader', description: 'Uploaded 1 note', icon: 'bronze-icon.png', level: 'bronze', category: 'upload', xpReward: 10, earnedAt: new Date('2023-01-01T00:00:00.000Z').toISOString() },
  { id: '2', name: 'Silver AI User', description: 'Used AI 5 times', icon: 'silver-icon.png', level: 'silver', category: 'ai', xpReward: 25, earnedAt: new Date('2023-01-05T00:00:00.000Z').toISOString() },
  { id: '3', name: 'Gold Streaker', description: '5 day streak', icon: 'gold-icon.png', level: 'gold', category: 'streak', xpReward: 50, earnedAt: new Date('2023-01-10T00:00:00.000Z').toISOString() },
  { id: '4', name: 'Platinum Achiever', description: 'Completed all tasks', icon: 'platinum-icon.png', level: 'platinum', category: 'achievement', xpReward: 100, earnedAt: new Date('2023-01-15T00:00:00.000Z').toISOString() },
  { id: '5', name: 'AI Helper', description: 'Helped AI', icon: 'ai-helper.png', level: 'gold', category: 'ai', xpReward: 60, earnedAt: new Date('2023-01-20T00:00:00.000Z').toISOString() },
];

describe('BadgeGrid Component', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    vi.useFakeTimers(); // For testing timeouts (highlighting)
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('renders "No Badges Yet" message when no badges are provided', () => {
    render(<BadgeGrid badges={[]} />);
    expect(screen.getByText('No Badges Yet')).toBeInTheDocument();
    expect(screen.getByText('Complete activities to earn your first badge!')).toBeInTheDocument();
  });

  test('renders a grid of badges with correct details', () => {
    render(<BadgeGrid badges={mockBadges} />);
    
    expect(screen.getByText('Bronze Uploader')).toBeInTheDocument();
    expect(screen.getByText('Uploaded 1 note')).toBeInTheDocument();
    expect(screen.getByAltText('Bronze Uploader')).toHaveAttribute('src', 'bronze-icon.png');
    expect(screen.getByText('+10 XP')).toBeInTheDocument();
    expect(screen.getByText('Earned 1/1/2023')).toBeInTheDocument(); // Assuming toLocaleDateString format

    expect(screen.getByText('Silver AI User')).toBeInTheDocument();
    expect(screen.getByText('+25 XP')).toBeInTheDocument();

    // Check if filter controls are present
    expect(screen.getByLabelText('Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  test('displays level text and applies level-specific styling (simple check for one level)', () => {
    render(<BadgeGrid badges={[mockBadges[0]]} />); // Bronze badge
    const bronzeBadgeElement = screen.getByText('Bronze Uploader').closest('div');
    
    // Check for level indicator text
    expect(screen.getByText('Bronze')).toBeInTheDocument(); 

    // This is a simplified check. Actual class checks can be brittle.
    // More robust would be to check computed styles if necessary, or snapshot testing.
    // For now, we trust the component's internal logic maps levels to styles correctly.
    // We can check for presence of part of the class name if it's consistent.
    expect(bronzeBadgeElement).toHaveClass('border-yellow-600'); // From levelColorMap
  });
  
  // More tests will be added here for highlighting, filtering, etc.

  describe('Highlighting New Badges', () => {
    test('highlights new badges, shows "New!" tag, and calls showToast', () => {
      render(<BadgeGrid badges={mockBadges} newBadgeIds={['2', '4']} />);
      
      const silverBadge = screen.getByText('Silver AI User').closest('div');
      const platinumBadge = screen.getByText('Platinum Achiever').closest('div');
      const bronzeBadge = screen.getByText('Bronze Uploader').closest('div');

      // Check for highlight class (example, adapt to actual classes)
      // More robust: check for specific styles or data-attributes if classes are too dynamic
      expect(silverBadge).toHaveClass('ring-2 ring-yellow-400');
      expect(platinumBadge).toHaveClass('ring-2 ring-yellow-400');
      expect(bronzeBadge).not.toHaveClass('ring-2 ring-yellow-400');

      // Check for "New!" tag
      expect(screen.getAllByText('New!').length).toBe(2);
      expect(within(silverBadge!).getByText('New!')).toBeInTheDocument();
      expect(within(platinumBadge!).getByText('New!')).toBeInTheDocument();

      // Check toast notifications
      expect(mockShowToast).toHaveBeenCalledTimes(2);
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Badge Unlocked!',
        message: `You\'ve earned the Silver AI User badge!`,
      }));
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Badge Unlocked!',
        message: `You\'ve earned the Platinum Achiever badge!`,
      }));
    });

    test('clears highlighting after timeout', async () => {
      render(<BadgeGrid badges={mockBadges} newBadgeIds={['1']} />);
      const bronzeBadge = screen.getByText('Bronze Uploader').closest('div');
      expect(bronzeBadge).toHaveClass('ring-2 ring-yellow-400'); // Initially highlighted
      expect(screen.getByText('New!')).toBeInTheDocument();

      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds timeout
      });
      
      // Re-query or check that highlight class/tag is removed
      // Note: The component re-renders, so direct element reference might be stale.
      // It's better to query again or check for absence of highlighting features.
      await waitFor(() => {
        const badgeAfterTimeout = screen.getByText('Bronze Uploader').closest('div');
        expect(badgeAfterTimeout).not.toHaveClass('ring-2 ring-yellow-400');
        expect(screen.queryByText('New!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering Badges', () => {
    test('filters badges by level', async () => {
      render(<BadgeGrid badges={mockBadges} />);
      const levelSelect = screen.getByLabelText('Level');

      await userEvent.selectOptions(levelSelect, 'gold');

      expect(screen.getByText('Gold Streaker')).toBeInTheDocument();
      expect(screen.getByText('AI Helper')).toBeInTheDocument();
      expect(screen.queryByText('Bronze Uploader')).not.toBeInTheDocument();
      expect(screen.queryByText('Silver AI User')).not.toBeInTheDocument();
      expect(screen.queryByText('Platinum Achiever')).not.toBeInTheDocument();
    });

    test('filters badges by category', async () => {
      render(<BadgeGrid badges={mockBadges} />);
      const categorySelect = screen.getByLabelText('Category');

      await userEvent.selectOptions(categorySelect, 'ai');

      expect(screen.getByText('Silver AI User')).toBeInTheDocument();
      expect(screen.getByText('AI Helper')).toBeInTheDocument();
      expect(screen.queryByText('Bronze Uploader')).not.toBeInTheDocument();
      expect(screen.queryByText('Gold Streaker')).not.toBeInTheDocument(); 
    });

    test('filters badges by both level and category', async () => {
      render(<BadgeGrid badges={mockBadges} />);
      const levelSelect = screen.getByLabelText('Level');
      const categorySelect = screen.getByLabelText('Category');

      await userEvent.selectOptions(levelSelect, 'gold');
      await userEvent.selectOptions(categorySelect, 'ai');

      expect(screen.getByText('AI Helper')).toBeInTheDocument(); // Gold AND AI
      expect(screen.queryByText('Gold Streaker')).not.toBeInTheDocument(); // Gold but not AI
      expect(screen.queryByText('Silver AI User')).not.toBeInTheDocument(); // AI but not Gold
    });

    test('shows "No Matching Badges" message when filters result in empty list', async () => {
      render(<BadgeGrid badges={mockBadges} />);
      const levelSelect = screen.getByLabelText('Level');
      // Filter by a level that has no 'upload' category badges
      await userEvent.selectOptions(levelSelect, 'platinum'); 
      const categorySelect = screen.getByLabelText('Category');
      await userEvent.selectOptions(categorySelect, 'upload');

      expect(screen.getByText('No Matching Badges')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or earn more badges!')).toBeInTheDocument();
    });

    test('selecting "All Levels" or "All Categories" resets the respective filter', async () => {
      render(<BadgeGrid badges={mockBadges} />);
      const levelSelect = screen.getByLabelText('Level');
      const categorySelect = screen.getByLabelText('Category');

      // Apply filters
      await userEvent.selectOptions(levelSelect, 'gold');
      await userEvent.selectOptions(categorySelect, 'ai');
      expect(screen.queryByText('Bronze Uploader')).not.toBeInTheDocument();
      expect(screen.getByText('AI Helper')).toBeInTheDocument(); // Only one badge now

      // Reset level filter
      await userEvent.selectOptions(levelSelect, 'all');
      expect(screen.getByText('Silver AI User')).toBeInTheDocument(); // AI category, any level
      expect(screen.getByText('AI Helper')).toBeInTheDocument();   // AI category, any level
      expect(screen.queryByText('Bronze Uploader')).not.toBeInTheDocument(); // Still filtered by AI category

      // Reset category filter as well (back to all badges)
      await userEvent.selectOptions(categorySelect, 'all');
      expect(screen.getByText('Bronze Uploader')).toBeInTheDocument();
      expect(screen.getByText('Silver AI User')).toBeInTheDocument();
      expect(screen.getByText('Gold Streaker')).toBeInTheDocument();
      expect(screen.getByText('Platinum Achiever')).toBeInTheDocument();
      expect(screen.getByText('AI Helper')).toBeInTheDocument();
      expect(screen.getAllByRole('img').length + screen.queryAllByText(/New!/).length > 0).toBeTruthy(); // Check if badges are visible again
    });
  });
}); 