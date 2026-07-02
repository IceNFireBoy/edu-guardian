import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the AI API client so no network is involved.
vi.mock('../../../api/ai', () => ({
  aiApi: { summarizeNote: vi.fn() },
}));

// Avoid real toasts (useToast wraps react-hot-toast's default export).
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

// Strip Framer Motion animation timing so state transitions are synchronous.
vi.mock('framer-motion', () => {
  const React = require('react');
  const passthrough =
    (tag: string) =>
    ({ children, initial, animate, exit, transition, whileHover, whileTap, layout, ...rest }: any) =>
      React.createElement(tag, rest, children);
  return {
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    motion: new Proxy({}, { get: (_t, prop: string) => passthrough(prop) }),
  };
});

import AISummarizer from './AISummarizer';
import { aiApi } from '../../../api/ai';

describe('AISummarizer', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the generated summary after clicking Summarize', async () => {
    (aiApi.summarizeNote as any).mockResolvedValue({ summary: 'Photosynthesis in a nutshell.' });

    render(<AISummarizer noteId="note-1" />);
    fireEvent.click(screen.getByTestId('ai-summarize-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('ai-summary-text')).toHaveTextContent('Photosynthesis in a nutshell.')
    );
    expect(aiApi.summarizeNote).toHaveBeenCalledWith('note-1');
  });

  it('handles a failed (e.g. quota-exceeded) generation without crashing or showing a summary', async () => {
    (aiApi.summarizeNote as any).mockRejectedValue(new Error('quota exceeded'));

    render(<AISummarizer noteId="note-1" />);
    fireEvent.click(screen.getByTestId('ai-summarize-btn'));

    await waitFor(() => expect(aiApi.summarizeNote).toHaveBeenCalled());
    expect(screen.queryByTestId('ai-summary-text')).toBeNull();
  });
});
