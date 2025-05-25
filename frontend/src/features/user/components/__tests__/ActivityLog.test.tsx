import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityLog from '../ActivityLog';

describe('ActivityLog', () => {
  const mockActivities = [
    {
      id: 'activity1',
      action: 'upload',
      description: 'Created a new note',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      xpEarned: 10,
      metadata: {
        noteId: 'note1',
        noteTitle: 'Test Note'
      }
    },
    {
      id: 'activity2',
      action: 'streak',
      description: 'Achieved a 7-day streak',
      timestamp: new Date('2024-01-01T08:00:00Z'),
      xpEarned: 0,
      metadata: {
        streakDays: 7
      }
    }
  ];

  it('renders activity log with all activities', () => {
    render(<ActivityLog activities={mockActivities} />);
    expect(screen.getByText('Created a new note')).toBeInTheDocument();
    expect(screen.getByText('Achieved a 7-day streak')).toBeInTheDocument();
  });

  it('renders empty state when no activities', () => {
    render(<ActivityLog activities={[]} />);
    expect(screen.getByText('No Activity Yet')).toBeInTheDocument();
    expect(screen.getByText('Your activities will appear here as you use the platform.')).toBeInTheDocument();
  });

  // Additional tests for features like filtering, searching, sorting, pagination, loading, and error states
  // should be added only if the component supports them.
}); 