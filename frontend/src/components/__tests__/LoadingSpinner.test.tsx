import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-blue-500'); // default primary color
    expect(spinner).toHaveClass('w-8 h-8'); // default medium size
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('w-4 h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-12 h-12');

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('status')).toHaveClass('w-16 h-16');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<LoadingSpinner color="secondary" />);
    expect(screen.getByRole('status')).toHaveClass('border-purple-500');

    rerender(<LoadingSpinner color="success" />);
    expect(screen.getByRole('status')).toHaveClass('border-green-500');

    rerender(<LoadingSpinner color="danger" />);
    expect(screen.getByRole('status')).toHaveClass('border-red-500');

    rerender(<LoadingSpinner color="warning" />);
    expect(screen.getByRole('status')).toHaveClass('border-yellow-500');

    rerender(<LoadingSpinner color="gray" />);
    expect(screen.getByRole('status')).toHaveClass('border-gray-500');
  });

  it('has correct accessibility attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
}); 