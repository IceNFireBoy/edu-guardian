import { render, fireEvent, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import AISummarizer from '../../src/components/AISummarizer';

describe('AISummarizer', () => {
  test('shows error message if GPT fails', async () => {
    render(<AISummarizer />);
    fireEvent.click(screen.getByText(/summarize/i));
    const error = await screen.findByText(/something went wrong/i);
    expect(error).toBeInTheDocument();
  });

  test('disables button while loading', async () => {
    render(<AISummarizer />);
    const button = screen.getByText(/summarize/i);
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });
});
