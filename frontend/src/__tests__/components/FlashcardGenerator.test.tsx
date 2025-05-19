import { render, fireEvent, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import FlashcardGenerator from '../../src/components/FlashcardGenerator';

describe('FlashcardGenerator', () => {
  test('generates flashcards from input text', async () => {
    render(<FlashcardGenerator />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'What is AI?' } });
    fireEvent.click(screen.getByText(/generate/i));
    const card = await screen.findByText(/question/i);
    expect(card).toBeInTheDocument();
  });

  test('shows error for empty input', () => {
    render(<FlashcardGenerator />);
    fireEvent.click(screen.getByText(/generate/i));
    expect(screen.getByText(/enter some text/i)).toBeInTheDocument();
  });
});
