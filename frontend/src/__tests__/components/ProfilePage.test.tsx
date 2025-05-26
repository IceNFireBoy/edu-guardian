import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ProfilePage from '../../features/user/ProfilePage';

// Mock the useUser hook
vi.mock('../../features/user/useUser', () => ({
  useUser: () => ({
    profile: {
      name: 'Test User',
      username: 'testuser',
      profileImage: null,
      createdAt: '2024-03-20T00:00:00.000Z',
      xp: 1000,
      level: 5,
      streak: { current: 3, longest: 7 },
      aiUsage: {
        summaryUsed: 2,
        flashcardUsed: 1
      },
      badges: [
        {
          id: '1',
          name: 'First Upload',
          description: 'Upload your first note',
          icon: '/badges/upload.png',
          level: 'bronze',
          category: 'upload',
          xpReward: 100,
          earnedAt: '2024-03-20T00:00:00.000Z'
        }
      ],
      activity: [
        {
          type: 'note_upload',
          description: 'Uploaded a new note',
          timestamp: '2024-03-20T00:00:00.000Z'
        }
      ]
    },
    loading: false,
    error: null,
    fetchUserProfile: vi.fn()
  })
}));

describe('ProfilePage', () => {
  test('renders user profile information', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  test('renders user stats card', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('1000 XP')).toBeInTheDocument();
  });

  test('renders AI analytics section', () => {
    render(<ProfilePage />);
    expect(screen.getByText('AI Engagement')).toBeInTheDocument();
    expect(screen.getByText('3 day(s)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // AI Summaries
    expect(screen.getByText('1')).toBeInTheDocument(); // AI Flashcards
  });

  test('renders achievements section', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total Badges
    expect(screen.getByText('100')).toBeInTheDocument(); // XP from Badges
    expect(screen.getByText('Bronze')).toBeInTheDocument(); // Highest Badge Tier
  });

  test('renders badges section', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Earned Badges')).toBeInTheDocument();
    expect(screen.getByText('First Upload')).toBeInTheDocument();
  });

  test('renders recent activity section', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Uploaded a new note')).toBeInTheDocument();
  });

  test('handles refresh button click', () => {
    const { useUser } = require('../../features/user/useUser');
    const mockFetchUserProfile = vi.fn();
    useUser.mockReturnValue({
      profile: {
        name: 'Test User',
        username: 'testuser'
      },
      loading: false,
      error: null,
      fetchUserProfile: mockFetchUserProfile
    });

    render(<ProfilePage />);
    fireEvent.click(screen.getByText('Refresh Data'));
    expect(mockFetchUserProfile).toHaveBeenCalled();
  });

  test('shows loading state', () => {
    const { useUser } = require('../../features/user/useUser');
    useUser.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      fetchUserProfile: vi.fn()
    });

    render(<ProfilePage />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    const { useUser } = require('../../features/user/useUser');
    useUser.mockReturnValue({
      profile: null,
      loading: false,
      error: 'Failed to load profile',
      fetchUserProfile: vi.fn()
    });

    render(<ProfilePage />);
    expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
  });
});
