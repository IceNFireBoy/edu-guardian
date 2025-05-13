import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIFeaturesPanel from '../AIFeaturesPanel';
import { useNote } from '../../useNote';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
vi.mock('../../useNote');
vi.mock('react-hot-toast');
vi.mock('../AISummarizer', () => ({
  default: ({ isOpen, onClose, noteId, noteTitle }) => (
    isOpen ? (
      <div data-testid="ai-summarizer-modal">
        <button onClick={onClose}>Close Summarizer</button>
        <div>Note ID: {noteId}</div>
        <div>Note Title: {noteTitle}</div>
      </div>
    ) : null
  )
}));

vi.mock('../FlashcardGenerator', () => ({
  default: ({ isOpen, onClose, noteId, noteTitle }) => (
    isOpen ? (
      <div data-testid="flashcard-generator-modal">
        <button onClick={onClose}>Close Flashcard Generator</button>
        <div>Note ID: {noteId}</div>
        <div>Note Title: {noteTitle}</div>
      </div>
    ) : null
  )
}));

describe('AIFeaturesPanel', () => {
  const mockNote = {
    id: 'test-note-id',
    title: 'Test Note',
    content: 'Test content',
    subject: 'Test Subject',
    grade: '12',
    semester: '1',
    quarter: '1',
    topic: 'Test Topic',
    isPublic: true
  };

  const mockAddManualFlashcard = vi.fn();
  const mockNoteHookLoading = false;
  const mockNoteHookError = null;

  beforeEach(() => {
    vi.clearAllMocks();
    (useNote as any).mockReturnValue({
      addManualFlashcard: mockAddManualFlashcard,
      loading: mockNoteHookLoading,
      error: mockNoteHookError
    });
  });

  it('renders AI features panel with correct buttons', () => {
    render(<AIFeaturesPanel note={mockNote} />);
    
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText('AI Flashcards')).toBeInTheDocument();
  });

  it('opens AI summarizer modal when AI Summary button is clicked', () => {
    render(<AIFeaturesPanel note={mockNote} />);
    
    fireEvent.click(screen.getByText('AI Summary'));
    expect(screen.getByTestId('ai-summarizer-modal')).toBeInTheDocument();
  });

  it('opens flashcard generator modal when AI Flashcards button is clicked', () => {
    render(<AIFeaturesPanel note={mockNote} />);
    
    fireEvent.click(screen.getByText('AI Flashcards'));
    expect(screen.getByTestId('flashcard-generator-modal')).toBeInTheDocument();
  });

  it('closes modals when close buttons are clicked', async () => {
    render(<AIFeaturesPanel note={mockNote} />);
    
    // Open and close AI summarizer
    fireEvent.click(screen.getByText('AI Summary'));
    fireEvent.click(screen.getByText('Close Summarizer'));
    await waitFor(() => {
      expect(screen.queryByTestId('ai-summarizer-modal')).not.toBeInTheDocument();
    });

    // Open and close flashcard generator
    fireEvent.click(screen.getByText('AI Flashcards'));
    fireEvent.click(screen.getByText('Close Flashcard Generator'));
    await waitFor(() => {
      expect(screen.queryByTestId('flashcard-generator-modal')).not.toBeInTheDocument();
    });
  });

  describe('Manual Flashcard Creation', () => {
    it('shows manual flashcard form when showManualFlashcard is true', () => {
      render(<AIFeaturesPanel note={mockNote} showManualFlashcard={true} />);
      
      expect(screen.getByPlaceholderText('Question')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument();
      expect(screen.getByText('Add Flashcard')).toBeInTheDocument();
    });

    it('does not show manual flashcard form when showManualFlashcard is false', () => {
      render(<AIFeaturesPanel note={mockNote} showManualFlashcard={false} />);
      
      expect(screen.queryByPlaceholderText('Question')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Answer')).not.toBeInTheDocument();
    });

    it('handles manual flashcard submission successfully', async () => {
      mockAddManualFlashcard.mockResolvedValueOnce({ id: 'new-flashcard-id' });
      
      render(<AIFeaturesPanel note={mockNote} showManualFlashcard={true} />);
      
      fireEvent.change(screen.getByPlaceholderText('Question'), {
        target: { value: 'Test Question' }
      });
      fireEvent.change(screen.getByPlaceholderText('Answer'), {
        target: { value: 'Test Answer' }
      });
      
      fireEvent.click(screen.getByText('Add Flashcard'));
      
      await waitFor(() => {
        expect(mockAddManualFlashcard).toHaveBeenCalledWith(mockNote.id, {
          question: 'Test Question',
          answer: 'Test Answer'
        });
        expect(toast.success).toHaveBeenCalledWith('Manual flashcard added!');
      });
    });

    it('shows error toast when manual flashcard submission fails', async () => {
      mockAddManualFlashcard.mockRejectedValueOnce(new Error('Failed to add flashcard'));
      
      render(<AIFeaturesPanel note={mockNote} showManualFlashcard={true} />);
      
      fireEvent.change(screen.getByPlaceholderText('Question'), {
        target: { value: 'Test Question' }
      });
      fireEvent.change(screen.getByPlaceholderText('Answer'), {
        target: { value: 'Test Answer' }
      });
      
      fireEvent.click(screen.getByText('Add Flashcard'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('validates required fields before submission', async () => {
      render(<AIFeaturesPanel note={mockNote} showManualFlashcard={true} />);
      
      fireEvent.click(screen.getByText('Add Flashcard'));
      
      expect(toast.error).toHaveBeenCalledWith('Question and Answer cannot be empty for manual flashcards.');
      expect(mockAddManualFlashcard).not.toHaveBeenCalled();
    });
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-class';
    render(<AIFeaturesPanel note={mockNote} className={customClass} />);
    
    const panel = screen.getByTestId('ai-features-panel');
    expect(panel).toHaveClass(customClass);
  });
}); 