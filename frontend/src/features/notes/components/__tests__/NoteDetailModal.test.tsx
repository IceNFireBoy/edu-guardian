import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Framer Motion: strip animation timing so render/unmount are synchronous.
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
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));
// The modal pulls rate/delete actions from useNote — stub them out.
vi.mock('../../useNote', () => ({
  useNote: () => ({
    rateNote: vi.fn().mockResolvedValue(null),
    deleteNote: vi.fn().mockResolvedValue(true),
    loading: false,
    error: null,
  }),
}));

import { NoteDetailModal } from '../NoteDetailModal';
import type { Note } from '../../../../types/note';

const mockNote: Note = {
  _id: 'note1',
  title: 'Photosynthesis Basics',
  content: 'Content',
  description: 'All about photosynthesis',
  subject: 'Biology',
  grade: '11',
  semester: '1',
  quarter: '1',
  topic: 'Plants',
  isPublic: true,
  fileUrl: 'https://example.com/note.pdf',
  fileType: 'pdf',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'u1',
  viewCount: 5,
  downloadCount: 2,
  rating: 0,
  ratingCount: 2,
  averageRating: 3,
  tags: ['bio'],
  ratings: [
    { value: 4, user: 'u2' },
    { value: 2, user: 'u3' },
  ],
};

describe('NoteDetailModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the note title when open', () => {
    render(<NoteDetailModal note={mockNote} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Photosynthesis Basics')).toBeInTheDocument();
  });

  it('averages the ratings subdocuments for display', () => {
    render(<NoteDetailModal note={mockNote} isOpen={true} onClose={() => {}} />);
    // (4 + 2) / 2 = 3.0 across 2 votes
    expect(screen.getByText(/3\.0/)).toBeInTheDocument();
    expect(screen.getByText(/2 votes/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<NoteDetailModal note={mockNote} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    render(<NoteDetailModal note={mockNote} isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Photosynthesis Basics')).toBeNull();
  });
});
