import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteUpload from '../NoteUpload';
import { Note } from '../../../types/note';

const mockNote = {
  _id: '1',
  title: 'Test Note',
  content: 'Some content',
  subject: 'Math',
  grade: '10',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/file.pdf',
  fileType: 'pdf',
  viewCount: 10,
  downloadCount: 2,
  averageRating: 4.5,
  ratingCount: 2,
  ratings: [],
  flashcards: [],
  user: 'user123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  aiSummary: '',
  aiSummaryKeyPoints: [],
  asset_id: '1',
};

describe('NoteUpload', () => {
  const mockOnUpload = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload form', () => {
    render(<NoteUpload onUpload={mockOnUpload} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/semester/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quarter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
  });

  it('calls onUpload when form is submitted', () => {
    render(<NoteUpload onUpload={mockOnUpload} onCancel={mockOnCancel} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Note' } });
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Math' } });
    fireEvent.change(screen.getByLabelText(/grade/i), { target: { value: '10th' } });
    fireEvent.change(screen.getByLabelText(/semester/i), { target: { value: 'Fall' } });
    fireEvent.change(screen.getByLabelText(/quarter/i), { target: { value: 'Q1' } });
    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: 'Algebra' } });
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/file/i), { target: { files: [file] } });
    
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    expect(mockOnUpload).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<NoteUpload onUpload={mockOnUpload} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
}); 