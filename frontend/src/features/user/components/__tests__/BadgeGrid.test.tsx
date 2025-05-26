import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BadgeGrid from '../BadgeGrid';
import { UserBadge } from '../../userTypes';
import { vi } from 'vitest';
import { act } from 'react';
import { prettyDOM } from '@testing-library/react';

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
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  };
});

const mockBadges: UserBadge[] = [
  {
    _id: '1',
    name: 'First Note',
    description: 'Created your first note',
    icon: '📝',
    category: 'achievement',
    awardedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Study Streak',
    description: 'Studied for 7 days in a row',
    icon: '🔥',
    category: 'streak',
    awardedAt: '2024-01-02T00:00:00.000Z'
  }
];

describe('BadgeGrid Component', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders "No Badges Yet" message when no badges are provided', async () => {
    await act(async () => {
      render(<BadgeGrid badges={[]} />);
    });
    expect(screen.getByTestId('badge-grid-empty')).toBeInTheDocument();
    expect(screen.getByText('No Badges Yet')).toBeInTheDocument();
    expect(screen.getByText('Complete activities to earn your first badge!')).toBeInTheDocument();
  });

  it('renders a grid of badges with correct details', async () => {
    await act(async () => {
      render(<BadgeGrid badges={mockBadges} />);
    });
    
    const badgeGrid = await screen.findByTestId('badge-grid');
    expect(badgeGrid).toBeInTheDocument();
    
    for (const badge of mockBadges) {
      const badgeElement = await screen.findByTestId(`badge-item-${badge._id}`);
      expect(badgeElement).toBeInTheDocument();
      expect(badgeElement).toHaveAttribute('data-badge-level', badge.level);
      expect(badgeElement).toHaveAttribute('data-badge-category', badge.category);
      const levelElement = await screen.findByTestId(`badge-level-${badge._id}`);
      expect(levelElement).toHaveTextContent(badge.level.charAt(0).toUpperCase() + badge.level.slice(1));
    }

    // Check if filter controls are present
    expect(await screen.findByTestId('badge-filters')).toBeInTheDocument();
    expect(await screen.findByTestId('badge-level-filter')).toBeInTheDocument();
    expect(await screen.findByTestId('badge-category-filter')).toBeInTheDocument();
  });

  describe('Highlighting New Badges', () => {
    it('highlights new badges and shows "New!" tag', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} newBadgeIds={['2']} showToast={mockShowToast} />);
      });
      
      // Check for highlighted badges
      const studyStreakBadge = screen.getByTestId('badge-item-2');
      const silverBadge = screen.getByTestId('badge-item-2');
      const platinumBadge = screen.getByTestId('badge-item-4');
      const bronzeBadge = screen.getByTestId('badge-item-1');

      expect(silverBadge).toHaveAttribute('data-badge-highlighted', 'true');
      expect(platinumBadge).toHaveAttribute('data-badge-highlighted', 'true');
      expect(bronzeBadge).toHaveAttribute('data-badge-highlighted', 'false');

      // Check for "New!" tags
      expect(screen.getByTestId('badge-new-tag-2')).toBeInTheDocument();
      expect(screen.getByTestId('badge-new-tag-4')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-new-tag-1')).not.toBeInTheDocument();

      // Check toast notifications
      expect(mockShowToast).toHaveBeenCalledTimes(2);
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Badge Unlocked!',
        message: expect.stringContaining('Silver AI User'),
      }));
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Badge Unlocked!',
        message: expect.stringContaining('Platinum Achiever'),
      }));
    });

    it('clears highlighting after timeout', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} newBadgeIds={['1']} showToast={mockShowToast} />);
      });
      
      const bronzeBadge = screen.getByTestId('badge-item-1');
      expect(bronzeBadge).toHaveAttribute('data-badge-highlighted', 'true');
      expect(screen.getByTestId('badge-new-tag-1')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(bronzeBadge).toHaveAttribute('data-badge-highlighted', 'false');
        expect(screen.queryByTestId('badge-new-tag-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering Badges', () => {
    it('filters badges by level', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} />);
      });
      const levelSelect = await screen.findByTestId('badge-level-filter');
      await act(async () => {
        await userEvent.selectOptions(levelSelect, 'gold');
      });
      await waitFor(() => {
        const goldBadges = screen.getAllByTestId(/^badge-item-[35]$/);
        expect(goldBadges).toHaveLength(2);
        expect(screen.queryByTestId('badge-item-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-4')).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('filters badges by category', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} />);
      });
      const categorySelect = await screen.findByTestId('badge-category-filter');
      await act(async () => {
        await userEvent.selectOptions(categorySelect, 'ai');
      });
      await waitFor(() => {
        const aiBadges = screen.getAllByTestId(/^badge-item-[25]$/);
        expect(aiBadges).toHaveLength(2);
        expect(screen.queryByTestId('badge-item-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-4')).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('filters badges by both level and category', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} />);
      });
      const levelSelect = await screen.findByTestId('badge-level-filter');
      const categorySelect = await screen.findByTestId('badge-category-filter');
      await act(async () => {
        await userEvent.selectOptions(levelSelect, 'gold');
        await userEvent.selectOptions(categorySelect, 'ai');
      });
      await waitFor(() => {
        expect(screen.getByTestId('badge-item-5')).toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('badge-item-2')).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('shows "No Matching Badges" message when filters result in empty list', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} />);
      });
      const levelSelect = await screen.findByTestId('badge-level-filter');
      const categorySelect = await screen.findByTestId('badge-category-filter');
      await act(async () => {
        await userEvent.selectOptions(levelSelect, 'platinum');
        await userEvent.selectOptions(categorySelect, 'upload');
      });
      await waitFor(() => {
        expect(screen.getByTestId('badge-grid-no-matches')).toBeInTheDocument();
        expect(screen.getByText('No Matching Badges')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or earn more badges!')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('resets filters when selecting "All" options', async () => {
      await act(async () => {
        render(<BadgeGrid badges={mockBadges} />);
      });
      const levelSelect = await screen.findByTestId('badge-level-filter');
      const categorySelect = await screen.findByTestId('badge-category-filter');
      await act(async () => {
        await userEvent.selectOptions(levelSelect, 'gold');
        await userEvent.selectOptions(categorySelect, 'ai');
      });
      await act(async () => {
        await userEvent.selectOptions(levelSelect, 'all');
        await userEvent.selectOptions(categorySelect, 'all');
      });
      await waitFor(() => {
        mockBadges.forEach(async badge => {
          expect(await screen.findByTestId(`badge-item-${badge.id}`)).toBeInTheDocument();
        });
      }, { timeout: 10000 });
    });
  });
}); 