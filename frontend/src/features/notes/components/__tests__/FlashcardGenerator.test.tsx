import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlashcardGenerator from '../FlashcardGenerator';
import { useNote } from '../../useNote';
import { useUser } from '../../../user/useUser';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
vi.mock('../../useNote');
vi.mock('../../../user/useUser');
vi.mock('react-hot-toast');
vi.mock('../../../api/apiClient', () => ({
  callAuthenticatedApi: vi.fn()
}));

describe('FlashcardGenerator', () => {
  const mockNoteId = 'test-note-id';
  const mockNoteTitle = 'Test Note';
  const mockInitialFlashcards = [
    { _id: '1', question: 'Q1', answer: 'A1', difficulty: 'easy', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' },
    { _id: '2', question: 'Q2', answer: 'A2', difficulty: 'medium', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' }
  ];

  const mockGeneratedFlashcardsArray = [
    { _id: 'gen1', question: 'Generated Q1', answer: 'Generated A1', difficulty: 'easy', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' },
    { _id: 'gen2', question: 'Generated Q2', answer: 'Generated A2', difficulty: 'medium', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' }
  ];

  const mockGenerateFlashcards = vi.fn();
  const mockSaveFlashcards = vi.fn();
  const mockNoteHookLoading = false;
  const mockNoteHookError = null;

  const mockUser = {
    aiUsage: {
      summaryUsed: 2,
      flashcardUsed: 3,
      lastReset: new Date().toISOString()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNote as any).mockReturnValue({
      generateFlashcards: mockGenerateFlashcards, 
      saveFlashcards: mockSaveFlashcards, 
      loading: mockNoteHookLoading,
      error: mockNoteHookError
    });
    (useUser as any).mockReturnValue({
      user: mockUser
    });
  });

  it('renders modal when isOpen is true', () => {
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.getByText('AI Flashcard Generator')).toBeInTheDocument();
    expect(screen.getByText(mockNoteTitle)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <FlashcardGenerator
        isOpen={false}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.queryByText('AI Flashcard Generator')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={mockOnClose}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('generates flashcards when generate button is clicked', async () => {
    const mockFlashcardsResult = {
      data: mockGeneratedFlashcardsArray, 
      newlyAwardedBadges: [],
      userXPUpdate: { currentLevel: 2 }
    };
    
    mockGenerateFlashcards.mockResolvedValueOnce(mockFlashcardsResult);
    
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    await waitFor(() => {
      expect(mockGenerateFlashcards).toHaveBeenCalledWith(mockNoteId);
      mockGeneratedFlashcardsArray.forEach(card => { 
        expect(screen.getByText(card.question)).toBeInTheDocument();
        expect(screen.getByText(card.answer)).toBeInTheDocument();
      });
    });
  });

  it('displays loading state while generating flashcards', async () => {
    mockGenerateFlashcards.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    expect(screen.getByText('Generating Flashcards...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message when flashcard generation fails', async () => {
    const errorMessage = 'Failed to generate flashcards';
    mockGenerateFlashcards.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    });
  });

  it('displays initial flashcards when provided', () => {
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
        initialFlashcards={mockInitialFlashcards}
      />
    );
    
    mockInitialFlashcards.forEach(card => {
      expect(screen.getByText(card.question)).toBeInTheDocument();
      expect(screen.getByText(card.answer)).toBeInTheDocument();
    });
  });

  it('displays AI usage quota information', () => {
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.getByText('AI Usage')).toBeInTheDocument();
    expect(screen.getByText(`${mockUser.aiUsage.flashcardUsed}/5`)).toBeInTheDocument();
  });

  it('disables generate button when user has reached daily limit', () => {
    const userAtLimit = {
      ...mockUser,
      aiUsage: {
        ...mockUser.aiUsage,
        flashcardUsed: 5 
      }
    };
    
    (useUser as any).mockReturnValue({
      user: userAtLimit
    });
    
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    const generateButton = screen.getByText('Generate Flashcards');
    expect(generateButton).toBeDisabled();
    expect(screen.getByText('Daily limit reached')).toBeInTheDocument();
  });

  it('displays newly awarded badges after successful generation', async () => {
    const mockBadges = [
      { id: 'badge1', name: 'Flashcard Master', description: 'Generated your first set of flashcards', level: 'gold', xpReward: 50 }
    ];
    
    mockGenerateFlashcards.mockResolvedValueOnce({
      data: [{ _id: '1', question: 'Q1', answer: 'A1', difficulty: 'easy', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' }], 
      newlyAwardedBadges: mockBadges,
      userXPUpdate: { currentLevel: 2 }
    });
    
    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    await waitFor(() => {
      expect(screen.getByText('New Badge Earned!')).toBeInTheDocument();
      expect(screen.getByText(mockBadges[0].name)).toBeInTheDocument();
    });
  });

  it('allows editing generated flashcards before saving', async () => {
    const mockFlashcardsResult = {
      data: [
        { _id: 'edit1', question: 'Editable Q1', answer: 'Editable A1', difficulty: 'easy', lastReviewed: null, nextReviewDate: null, efactor: 2.5, interval: 1, repetitions: 0, user: 'user1' }
      ], 
      newlyAwardedBadges: [],
      userXPUpdate: { currentLevel: 2 }
    };
    mockGenerateFlashcards.mockResolvedValueOnce(mockFlashcardsResult);
    mockSaveFlashcards.mockResolvedValueOnce(true); 

    render(
      <FlashcardGenerator
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Flashcards'));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Editable Q1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Editable Q1'), { target: { value: 'Updated Q1' } });
    fireEvent.click(screen.getByText('Save Flashcards'));

    await waitFor(() => {
      expect(mockSaveFlashcards).toHaveBeenCalledWith(mockNoteId, [
        expect.objectContaining({ question: 'Updated Q1' })
      ]);
      expect(toast.success).toHaveBeenCalledWith('Flashcards saved successfully!');
    });
  });
}); 