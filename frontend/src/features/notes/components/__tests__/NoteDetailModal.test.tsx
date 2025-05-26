import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteDetailModal from '../NoteDetailModal';
import { useNote } from '../../../hooks/useNote';
import { useUser } from '../../../user/useUser';
import { toast } from 'react-hot-toast';
import { Note } from '../../../../types/note';

// Mock the hooks and dependencies
vi.mock('../../../hooks/useNote');
vi.mock('../../../user/useUser');
vi.mock('react-hot-toast');

const mockFullNote: Note = {
  _id: '1',
  title: 'Test Note',
  content: 'Test Content',
  description: 'A test note',
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  subject: 'Math',
  grade: '11',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  tags: ['math'],
  viewCount: 10,
  downloadCount: 2,
  ratings: [],
  averageRating: 4.5,
  aiSummary: '',
  aiSummaryKeyPoints: [],
  flashcards: [],
  user: 'user123',
  isPublic: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  rating: 4.5,
  ratingCount: 10
};

const mockUpdateNote = jest.fn();
const mockDeleteNote = jest.fn();
const mockNoteHookLoading = false;
const mockNoteHookError = null;

const mockUser = {
  id: 'test-user-id',
  role: 'student'
};

beforeEach(() => {
  jest.clearAllMocks();
  (useNote as any).mockReturnValue({
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
    loading: mockNoteHookLoading,
    error: mockNoteHookError
  });
  (useUser as any).mockReturnValue({
    user: mockUser
  });
});

it('renders modal when isOpen is true', () => {
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.getByText('Note Details')).toBeInTheDocument();
  expect(screen.getByText(mockFullNote.title)).toBeInTheDocument();
  expect(screen.getByText(mockFullNote.description)).toBeInTheDocument();
});

it('does not render when isOpen is false', () => {
  render(
    <NoteDetailModal
      isOpen={false}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.queryByText('Note Details')).not.toBeInTheDocument();
});

it('calls onClose when close button is clicked', () => {
  const mockOnClose = vi.fn();
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={mockOnClose}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(mockOnClose).toHaveBeenCalled();
});

it('displays note information correctly', () => {
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.getByText(mockFullNote.title)).toBeInTheDocument();
  expect(screen.getByText(mockFullNote.description)).toBeInTheDocument();
  expect(screen.getByText(mockFullNote.subject)).toBeInTheDocument();
  expect(screen.getByText(`Grade ${mockFullNote.grade}`)).toBeInTheDocument();
  expect(screen.getByText(`Semester ${mockFullNote.semester}`)).toBeInTheDocument();
  expect(screen.getByText(`Quarter ${mockFullNote.quarter}`)).toBeInTheDocument();
  expect(screen.getByText(mockFullNote.topic)).toBeInTheDocument();
  expect(screen.getByText('1.00 MB')).toBeInTheDocument();
});

it('displays file preview for PDF files', () => {
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
  expect(screen.getByText('View PDF')).toBeInTheDocument();
});

it('displays file preview for image files', () => {
  const imageNote = {
    ...mockFullNote,
    fileType: 'image/jpeg',
    fileUrl: 'https://example.com/test.jpg'
  };
  
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={imageNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  const image = screen.getByRole('img');
  expect(image).toHaveAttribute('src', imageNote.fileUrl);
  expect(image).toHaveAttribute('alt', imageNote.title);
});

it('displays fallback for unknown file types', () => {
  const unknownNote = {
    ...mockFullNote,
    fileType: 'unknown',
    fileUrl: 'https://example.com/test.xyz'
  };
  
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={unknownNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.getByTestId('file-fallback')).toBeInTheDocument();
});

it('allows editing note details when user is the owner', async () => {
  const mockOnClose = vi.fn();
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={mockOnClose}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  const editButton = screen.getByText('Edit');
  expect(editButton).toBeInTheDocument();
  
  fireEvent.click(editButton);
  
  const titleInput = screen.getByLabelText('Title');
  const descriptionInput = screen.getByLabelText('Description');
  
  fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
  fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
  
  fireEvent.click(screen.getByText('Save Changes'));
  
  await waitFor(() => {
    expect(mockUpdateNote).toHaveBeenCalledWith(mockFullNote._id, {
      title: 'Updated Title',
      description: 'Updated Description'
    });
    expect(toast.success).toHaveBeenCalledWith('Note updated successfully');
  });
});

it('displays delete confirmation when delete button is clicked', async () => {
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  fireEvent.click(screen.getByText('Delete'));
  
  expect(screen.getByText('Are you sure you want to delete this note?')).toBeInTheDocument();
  expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
});

it('deletes note when confirmed', async () => {
  const mockOnClose = vi.fn();
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={mockOnClose}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  fireEvent.click(screen.getByText('Delete'));
  fireEvent.click(screen.getByText('Confirm Delete'));
  
  await waitFor(() => {
    expect(mockDeleteNote).toHaveBeenCalledWith(mockFullNote._id);
    expect(toast.success).toHaveBeenCalledWith('Note deleted successfully');
    expect(mockOnClose).toHaveBeenCalled();
  });
});

it('displays error message when update fails', async () => {
  const errorMessage = 'Failed to update note';
  mockUpdateNote.mockRejectedValueOnce(new Error(errorMessage));
  
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  fireEvent.click(screen.getByText('Edit'));
  fireEvent.click(screen.getByText('Save Changes'));
  
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });
});

it('displays error message when delete fails', async () => {
  const errorMessage = 'Failed to delete note';
  mockDeleteNote.mockRejectedValueOnce(new Error(errorMessage));
  
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  fireEvent.click(screen.getByText('Delete'));
  fireEvent.click(screen.getByText('Confirm Delete'));
  
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });
});

it('hides edit and delete buttons when user is not the owner', () => {
  render(
    <NoteDetailModal
      isOpen={true}
      onClose={() => {}}
      note={mockFullNote}
      onNoteUpdate={mockUpdateNote}
      onNoteDelete={mockDeleteNote}
    />
  );
  
  expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  expect(screen.queryByText('Delete')).not.toBeInTheDocument();
}); 