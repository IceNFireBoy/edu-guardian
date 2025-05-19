import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteDetailModal from '../NoteDetailModal';
import { useNote } from '../../useNote';
import { useUser } from '../../../user/useUser';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
jest.mock('../../useNote');
jest.mock('../../../user/useUser');
jest.mock('react-hot-toast');
jest.mock('../../../api/apiClient', () => ({
  callAuthenticatedApi: jest.fn()
}));

describe('NoteDetailModal', () => {
  const mockFullNote = {
    _id: 'test-note-id',
    id: 'test-note-id',
    title: 'Test Note',
    description: 'Test Description',
    subject: 'Mathematics',
    grade: '12',
    semester: '1',
    quarter: '1',
    topic: 'Algebra',
    isPublic: true,
    fileUrl: 'https://example.com/test.pdf',
    fileType: 'pdf',
    fileSize: 1024 * 1024,
    user: { _id: 'user-id-123', name: 'Test User' },
    tags: ['algebra', 'test'],
    viewCount: 100,
    downloadCount: 50,
    ratings: [],
    averageRating: 4.5,
    aiSummary: null,
    aiSummaryGeneratedAt: null,
    aiSummaryKeyPoints: [],
    flashcards: [],
    slug: 'test-note',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
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
        isOwner={true}
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
        isOwner={true}
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
        isOwner={true}
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
        isOwner={true}
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
        isOwner={true}
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
        isOwner={false}
      />
    );
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
}); 