import { render, screen } from '@testing-library/react';
import AIQuotaDisplay from '../AIQuotaDisplay';
import { AIUsage } from '../../userTypes';
import { AI_USAGE_LIMITS_FRONTEND } from '../../../../config/aiConfig';

// Mock the config to control limits during tests
vi.mock('../../../../config/aiConfig', () => ({
  AI_USAGE_LIMITS_FRONTEND: {
    SUMMARY_PER_DAY: 5,
    FLASHCARDS_PER_DAY: 10,
  },
}));

const { SUMMARY_PER_DAY, FLASHCARDS_PER_DAY } = AI_USAGE_LIMITS_FRONTEND;

describe('AIQuotaDisplay Component', () => {
  const mockAiUsage: AIUsage = {
    summaryUsed: 2,
    flashcardUsed: 5,
    lastReset: new Date().toISOString(),
  };

  it('should render null if aiUsage is undefined', () => {
    const { container } = render(<AIQuotaDisplay aiUsage={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  describe('Standard View (not compact)', () => {
    it('should display correct usage numbers and percentages', () => {
      render(<AIQuotaDisplay aiUsage={mockAiUsage} />);
      expect(screen.getByText(`${mockAiUsage.summaryUsed} / ${SUMMARY_PER_DAY}`)).toBeInTheDocument();
      expect(screen.getByText(`${mockAiUsage.flashcardUsed} / ${FLASHCARDS_PER_DAY}`)).toBeInTheDocument();

      const summaryPercentage = (mockAiUsage.summaryUsed / SUMMARY_PER_DAY) * 100;
      const flashcardPercentage = (mockAiUsage.flashcardUsed / FLASHCARDS_PER_DAY) * 100;

      // Progress bars are identified by their style.width
      // This is a bit implementation-detail heavy, but common for progress bars.
      // Consider adding data-testid to the progress bar divs for more robust selection.
      const progressBars = screen.getAllByRole('progressbar'); // Assuming the div acts as a progressbar
      // For this to work, the div with style.width should have role="progressbar"
      // If not, we need a different selector.
      // Let's assume we add data-testid="summary-progress" and data-testid="flashcard-progress"
      // For now, checking based on the text associated with the bar.
      const summaryBarContainer = screen.getByText(/AI Summary Quota/).closest('div')?.querySelector('div[style*="width"]');
      const flashcardBarContainer = screen.getByText(/AI Flashcard Quota/).closest('div')?.querySelector('div[style*="width"]');
      
      expect(summaryBarContainer).toHaveStyle(`width: ${summaryPercentage}%`);
      expect(flashcardBarContainer).toHaveStyle(`width: ${flashcardPercentage}%`);
    });

    it('should display correct remaining text and warning for 1 summary left', () => {
      const usage: AIUsage = { ...mockAiUsage, summaryUsed: SUMMARY_PER_DAY - 1 };
      render(<AIQuotaDisplay aiUsage={usage} />);
      expect(screen.getByText(/1 AI summary remaining today./)).toBeInTheDocument();
      expect(screen.getByText('(Warning: 1 left!)')).toBeInTheDocument();
    });

    it('should display correct remaining text and warning for 0 flashcards left', () => {
      const usage: AIUsage = { ...mockAiUsage, flashcardUsed: FLASHCARDS_PER_DAY };
      render(<AIQuotaDisplay aiUsage={usage} />);
      expect(screen.getByText(/0 AI flashcard sets remaining today./)).toBeInTheDocument();
      expect(screen.getByText('(None left)')).toBeInTheDocument();
    });

    it('should apply correct progress bar colors', () => {
      // Green (<=70%)
      render(<AIQuotaDisplay aiUsage={{ summaryUsed: 1, flashcardUsed: 1, lastReset: ''}} />);
      const summaryBarGreen = screen.getByText(/AI Summary Quota/).closest('div')?.querySelector('div[style*="width"]');
      expect(summaryBarGreen).toHaveClass('bg-green-500');

      // Yellow (>70% and <=90%)
      render(<AIQuotaDisplay aiUsage={{ summaryUsed: 4, flashcardUsed: 8, lastReset: '' }} />); // 4/5 = 80%, 8/10 = 80%
      const summaryBarYellow = screen.getByText(/AI Summary Quota/).closest('div')?.querySelector('div[style*="width"]');
      expect(summaryBarYellow).toHaveClass('bg-yellow-500');
      
      // Red (>90%)
      render(<AIQuotaDisplay aiUsage={{ summaryUsed: 5, flashcardUsed: 10, lastReset: '' }} />); // 5/5 = 100%, 10/10 = 100%
      const summaryBarRed = screen.getByText(/AI Summary Quota/).closest('div')?.querySelector('div[style*="width"]');
      expect(summaryBarRed).toHaveClass('bg-red-500');
    });

    it('should show daily refresh tooltip on the main container', () => {
        render(<AIQuotaDisplay aiUsage={mockAiUsage} />);
        // The component applies title attribute to its root div
        // Find the root div. This depends on the component structure.
        // A data-testid on the root would be best.
        // Assuming the root is the first child of the container from render.
        const mainContainer = screen.getByTitle("Usage quotas refresh daily.");
        expect(mainContainer).toBeInTheDocument();
        expect(screen.getByText('Quotas refresh daily.')).toBeInTheDocument(); // Check for the visible text too
      });
  });

  describe('Compact View', () => {
    it('should render compact view with correct usage numbers', () => {
      render(<AIQuotaDisplay aiUsage={mockAiUsage} compact />);
      expect(screen.getByTitle(`Summaries: ${mockAiUsage.summaryUsed}/${SUMMARY_PER_DAY} used today`)).toBeInTheDocument();
      expect(screen.getByText(`${mockAiUsage.summaryUsed}/${SUMMARY_PER_DAY}`)).toBeInTheDocument();
      expect(screen.getByTitle(`Flashcards: ${mockAiUsage.flashcardUsed}/${FLASHCARDS_PER_DAY} used today`)).toBeInTheDocument();
      expect(screen.getByText(`${mockAiUsage.flashcardUsed}/${FLASHCARDS_PER_DAY}`)).toBeInTheDocument();
      
      // Ensure progress bars and detailed text are not present
      expect(screen.queryByText(/AI Summary Quota/)).not.toBeInTheDocument();
      expect(screen.queryByText(/remaining today/)).not.toBeInTheDocument();
    });

    it('compact view should have the main tooltip', () => {
        render(<AIQuotaDisplay aiUsage={mockAiUsage} compact />);
        const mainContainer = screen.getByTitle("Usage quotas refresh daily.");
        expect(mainContainer).toBeInTheDocument();
      });
  });
}); 