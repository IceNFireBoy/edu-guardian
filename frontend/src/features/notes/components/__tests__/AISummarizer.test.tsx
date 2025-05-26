import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AISummarizer from '../AISummarizer';
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

describe('AISummarizer', () => {
  const mockNoteId = 'test-note-id';
  const mockNoteTitle = 'Test Note';
  const mockInitialSummary = {
    summary: 'Test Summary',
    keyPoints: ['Key Point 1', 'Key Point 2'],
    noteId: 'note123',
    generatedAt: new Date().toISOString()
  };

  const mockGetAISummary = vi.fn();
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
      getAISummary: mockGetAISummary,
      loading: mockNoteHookLoading,
      error: mockNoteHookError
    });
    (useUser as any).mockReturnValue({
      user: mockUser
    });
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText(mockNoteTitle)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AISummarizer
        isOpen={false}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.queryByText('AI Summary')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <AISummarizer
        isOpen={true}
        onClose={mockOnClose}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('generates summary when generate button is clicked', async () => {
    const mockSummaryResult = {
      summary: 'Generated summary text',
      keyPoints: ['Generated Point 1', 'Generated Point 2'],
      newlyAwardedBadges: [],
      userXPUpdate: { currentLevel: 2 }
    };
    
    mockGetAISummary.mockResolvedValueOnce(mockSummaryResult);
    
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Summary'));
    
    await waitFor(() => {
      expect(mockGetAISummary).toHaveBeenCalledWith(mockNoteId);
      expect(screen.getByText(mockSummaryResult.summary)).toBeInTheDocument();
      mockSummaryResult.keyPoints.forEach(point => {
        expect(screen.getByText(point)).toBeInTheDocument();
      });
    });
  });

  it('displays loading state while generating summary', async () => {
    mockGetAISummary.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Summary'));
    
    expect(screen.getByText('Generating Summary...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message when summary generation fails', async () => {
    const errorMessage = 'Failed to generate summary';
    mockGetAISummary.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Summary'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
    });
  });

  it('displays initial summary when provided', () => {
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
        initialSummary={mockInitialSummary}
      />
    );
    
    expect(screen.getByText(mockInitialSummary.summary)).toBeInTheDocument();
    mockInitialSummary.keyPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });

  it('displays AI usage quota information', () => {
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    expect(screen.getByText('AI Usage')).toBeInTheDocument();
    expect(screen.getByText(`${mockUser.aiUsage.summaryUsed}/5`)).toBeInTheDocument();
  });

  it('disables generate button when user has reached daily limit', () => {
    const userAtLimit = {
      ...mockUser,
      aiUsage: {
        ...mockUser.aiUsage,
        summaryUsed: 5 // Assuming 5 is the daily limit
      }
    };
    
    (useUser as any).mockReturnValue({
      user: userAtLimit
    });
    
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    const generateButton = screen.getByText('Generate Summary');
    expect(generateButton).toBeDisabled();
    expect(screen.getByText('Daily limit reached')).toBeInTheDocument();
  });

  it('displays newly awarded badges after successful generation', async () => {
    const mockBadges = [
      { id: 'badge1', name: 'First Summary', description: 'Generated your first summary' }
    ];
    
    mockGetAISummary.mockResolvedValueOnce({
      data: {
        summary: 'Generated summary',
        keyPoints: ['Point 1'],
        newlyAwardedBadges: mockBadges,
        userXPUpdate: { currentLevel: 2 }
      }
    });
    
    render(
      <AISummarizer
        isOpen={true}
        onClose={() => {}}
        noteId={mockNoteId}
        noteTitle={mockNoteTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Generate Summary'));
    
    await waitFor(() => {
      expect(screen.getByText('New Badge Earned!')).toBeInTheDocument();
      expect(screen.getByText(mockBadges[0].name)).toBeInTheDocument();
    });
  });
}); 