import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage';

describe('ProfilePage', () => {
  test('displays user XP and badge grid', () => {
    render(<ProfilePage />);
    expect(screen.getByText(/level/i)).toBeInTheDocument();
    expect(screen.getByTestId('badge-grid')).toBeInTheDocument();
  });

  test('shows recent activity log', () => {
    render(<ProfilePage />);
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
  });
});
