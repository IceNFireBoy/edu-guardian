import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityLog from '../ActivityLog';
import { useUser } from '../../useUser';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
vi.mock('../../useUser');
vi.mock('react-hot-toast');
vi.mock('../../../api/apiClient', () => ({
  callAuthenticatedApi: vi.fn()
}));

describe('ActivityLog', () => {
  const mockActivities = [
    {
      id: 'activity1',
      type: 'note_created',
      description: 'Created a new note',
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      metadata: {
        noteId: 'note1',
        noteTitle: 'Test Note'
      }
    },
    {
      id: 'activity2',
      type: 'badge_earned',
      description: 'Earned the First Note badge',
      timestamp: new Date('2024-01-01T09:00:00Z').toISOString(),
      metadata: {
        badgeId: 'badge1',
        badgeName: 'First Note'
      }
    },
    {
      id: 'activity3',
      type: 'streak_achieved',
      description: 'Achieved a 7-day streak',
      timestamp: new Date('2024-01-01T08:00:00Z').toISOString(),
      metadata: {
        streakDays: 7
      }
    }
  ];

  const mockLoading = false;
  const mockError = null;

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({
      activities: mockActivities,
      loading: mockLoading,
      error: mockError
    });
  });

  it('renders activity log with all activities', () => {
    render(<ActivityLog />);
    
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    mockActivities.forEach(activity => {
      expect(screen.getByText(activity.description)).toBeInTheDocument();
    });
  });

  it('displays activities in chronological order', () => {
    render(<ActivityLog />);
    
    const activityElements = screen.getAllByTestId('activity-item');
    const timestamps = activityElements.map(element => 
      new Date(element.getAttribute('data-timestamp') || '').getTime()
    );
    
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });

  it('formats timestamps correctly', () => {
    render(<ActivityLog />);
    
    mockActivities.forEach(activity => {
      const timestamp = new Date(activity.timestamp);
      const formattedDate = timestamp.toLocaleDateString();
      const formattedTime = timestamp.toLocaleTimeString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.getByText(formattedTime)).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    (useUser as any).mockReturnValue({
      activities: [],
      loading: true,
      error: null
    });
    
    render(<ActivityLog />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load activities';
    (useUser as any).mockReturnValue({
      activities: [],
      loading: false,
      error: new Error(errorMessage)
    });
    
    render(<ActivityLog />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays empty state when no activities', () => {
    (useUser as any).mockReturnValue({
      activities: [],
      loading: false,
      error: null
    });
    
    render(<ActivityLog />);
    
    expect(screen.getByText('No activities found')).toBeInTheDocument();
  });

  it('allows filtering activities by type', () => {
    render(<ActivityLog />);
    
    const filterSelect = screen.getByLabelText('Filter Activities');
    fireEvent.change(filterSelect, { target: { value: 'note_created' } });
    
    expect(screen.getByText('Created a new note')).toBeInTheDocument();
    expect(screen.queryByText('Earned the First Note badge')).not.toBeInTheDocument();
    expect(screen.queryByText('Achieved a 7-day streak')).not.toBeInTheDocument();
  });

  it('allows sorting activities by date', () => {
    render(<ActivityLog />);
    
    const sortSelect = screen.getByLabelText('Sort Activities');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });
    
    const activityElements = screen.getAllByTestId('activity-item');
    const timestamps = activityElements.map(element => 
      new Date(element.getAttribute('data-timestamp') || '').getTime()
    );
    
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it('displays activity metadata when available', () => {
    render(<ActivityLog />);
    
    const noteActivity = screen.getByText('Created a new note').closest('[data-testid="activity-item"]');
    expect(noteActivity).toHaveTextContent('Test Note');
    
    const badgeActivity = screen.getByText('Earned the First Note badge').closest('[data-testid="activity-item"]');
    expect(badgeActivity).toHaveTextContent('First Note');
    
    const streakActivity = screen.getByText('Achieved a 7-day streak').closest('[data-testid="activity-item"]');
    expect(streakActivity).toHaveTextContent('7 days');
  });

  it('allows pagination of activities', () => {
    const manyActivities = Array.from({ length: 25 }, (_, i) => ({
      id: `activity${i}`,
      type: 'note_created',
      description: `Created note ${i}`,
      timestamp: new Date().toISOString(),
      metadata: {
        noteId: `note${i}`,
        noteTitle: `Note ${i}`
      }
    }));
    
    (useUser as any).mockReturnValue({
      activities: manyActivities,
      loading: false,
      error: null
    });
    
    render(<ActivityLog itemsPerPage={10} />);
    
    expect(screen.getAllByTestId('activity-item')).toHaveLength(10);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getAllByTestId('activity-item')).toHaveLength(10);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('allows searching activities', () => {
    render(<ActivityLog />);
    
    const searchInput = screen.getByPlaceholderText('Search activities...');
    fireEvent.change(searchInput, { target: { value: 'note' } });
    
    expect(screen.getByText('Created a new note')).toBeInTheDocument();
    expect(screen.queryByText('Achieved a 7-day streak')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-class';
    render(<ActivityLog className={customClass} />);
    
    const activityLog = screen.getByTestId('activity-log');
    expect(activityLog).toHaveClass(customClass);
  });
}); 