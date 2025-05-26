import { render, fireEvent, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import FlashcardGenerator from '../../features/notes/components/FlashcardGenerator';

// Mock the useNote hook
vi.mock('../../features/notes/useNote', () => ({
  useNote: () => ({
    generateFlashcards: vi.fn().mockResolvedValue({ data: [] }),
    saveFlashcards: vi.fn(),
    loading: false,
    error: null
  })
}));

// Mock the useUser hook
vi.mock('../../features/user/useUser', () => ({
  useUser: () => ({
    profile: null,
    fetchUserProfile: vi.fn(),
    completeStudy: vi.fn(),
    newBadgeIds: []
  })
}));

describe('FlashcardGenerator', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    noteId: 'test-note-id',
    noteTitle: 'Test Note'
  };

  test('generates flashcards from input text', async () => {
    render(<FlashcardGenerator {...defaultProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'What is AI?' } });
    fireEvent.click(screen.getByText(/generate/i));
    const card = await screen.findByText(/question/i);
    expect(card).toBeInTheDocument();
  });

  test('shows error for empty input', () => {
    render(<FlashcardGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText(/generate/i));
    expect(screen.getByText(/enter some text/i)).toBeInTheDocument();
  });

  test('handles close button click', () => {
    render(<FlashcardGenerator {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('displays note title when provided', () => {
    render(<FlashcardGenerator {...defaultProps} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });
});
