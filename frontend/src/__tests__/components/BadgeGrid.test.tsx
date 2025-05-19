import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import BadgeGrid from '../../src/components/BadgeGrid';
import mockBadges from '../utils/mockBadges';

describe('BadgeGrid', () => {
  test('renders all badge levels', () => {
    render(<BadgeGrid badges={mockBadges()} />);
    expect(screen.getByText(/bronze/i)).toBeInTheDocument();
    expect(screen.getByText(/platinum/i)).toBeInTheDocument();
  });

  test('highlights selected badge', () => {
    render(<BadgeGrid badges={mockBadges()} selected="AI Novice" />);
    expect(screen.getByText(/ai novice/i).parentElement).toHaveClass('highlight');
  });
});
