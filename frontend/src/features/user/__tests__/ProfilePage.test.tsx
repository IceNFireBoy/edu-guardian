import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../ProfilePage';
import { useUser } from '../useUser';
import { useStreak } from '../../../hooks/useStreak';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
vi.mock('../useUser');
vi.mock('../../../hooks/useStreak');
vi.mock('react-hot-toast');
vi.mock('../../../api/apiClient', () => ({
  callAuthenticatedApi: vi.fn()
}));

describe('ProfilePage', () => {
  const mockUser = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'student',
    level: 5,
    xp: 2500,
    badges: [
      { id: 'badge1', name: 'First Note', description: 'Created your first note' },
      { id: 'badge2', name: 'Streak Master', description: 'Maintained a 7-day streak' }
    ],
    aiUsage: {
      summaryUsed: 2,
      flashcardUsed: 3,
      lastReset: new Date().toISOString()
    }
  };

  const mockUpdateProfile = vi.fn();
  const mockUpdatePassword = vi.fn();
  const mockUserHookLoading = false;
  const mockUserHookError = null;

  const mockStreak = {
    currentStreak: 5,
    longestStreak: 10,
    lastActivity: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      updatePassword: mockUpdatePassword,
      loading: mockUserHookLoading,
      error: mockUserHookError
    });
    (useStreak as any).mockReturnValue({
      streak: mockStreak
    });
  });

  it('renders user profile information', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(`Level ${mockUser.level}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockUser.xp} XP`)).toBeInTheDocument();
  });

  it('displays user badges', () => {
    render(<ProfilePage />);
    
    mockUser.badges.forEach(badge => {
      expect(screen.getByText(badge.name)).toBeInTheDocument();
      expect(screen.getByText(badge.description)).toBeInTheDocument();
    });
  });

  it('displays streak information', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText(`Current Streak: ${mockStreak.currentStreak} days`)).toBeInTheDocument();
    expect(screen.getByText(`Longest Streak: ${mockStreak.longestStreak} days`)).toBeInTheDocument();
  });

  it('displays AI usage information', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText('AI Usage')).toBeInTheDocument();
    expect(screen.getByText(`Summaries: ${mockUser.aiUsage.summaryUsed}/5`)).toBeInTheDocument();
    expect(screen.getByText(`Flashcards: ${mockUser.aiUsage.flashcardUsed}/5`)).toBeInTheDocument();
  });

  it('allows updating profile information', async () => {
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        username: 'newusername',
        email: 'new@example.com'
      });
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });

  it('allows updating password', async () => {
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText('Change Password'));
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass' } });
    
    fireEvent.click(screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith({
        currentPassword: 'currentpass',
        newPassword: 'newpass'
      });
      expect(toast.success).toHaveBeenCalledWith('Password updated successfully');
    });
  });

  it('validates password match before updating', async () => {
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText('Change Password'));
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });
    
    fireEvent.click(screen.getByText('Update Password'));
    
    expect(toast.error).toHaveBeenCalledWith('New passwords do not match');
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('displays error message when profile update fails', async () => {
    const errorMessage = 'Failed to update profile';
    mockUpdateProfile.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    });
  });

  it('displays error message when password update fails', async () => {
    const errorMessage = 'Failed to update password';
    mockUpdatePassword.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText('Change Password'));
    fireEvent.click(screen.getByText('Update Password'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    });
  });

  it('displays loading state during updates', async () => {
    (useUser as any).mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      updatePassword: mockUpdatePassword,
      loading: true,
      error: null
    });
    
    render(<ProfilePage />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state when user data fails to load', () => {
    (useUser as any).mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
      updatePassword: mockUpdatePassword,
      loading: false,
      error: new Error('Failed to load user data')
    });
    
    render(<ProfilePage />);
    
    expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
  });

  it('displays different content for admin users', () => {
    const adminUser = {
      ...mockUser,
      role: 'admin'
    };
    
    (useUser as any).mockReturnValue({
      user: adminUser,
      updateProfile: mockUpdateProfile,
      updatePassword: mockUpdatePassword,
      loading: false,
      error: null
    });
    
    render(<ProfilePage />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });
}); 