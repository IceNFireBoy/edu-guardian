import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { useNote } from '../useNote';
import { Note, NoteFilter, NoteUploadData } from '../noteTypes';

// Mock data
const mockNote: Note = {
  _id: 'note123',
  title: 'Test Note',
  content: 'Test content',
  subject: 'Math',
  grade: '10',
  semester: '1',
  quarter: '1',
  topic: 'Algebra',
  isPublic: true,
  fileUrl: 'http://example.com/test.pdf',
  fileType: 'pdf',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: 'user123',
  ratingCount: 0,
  rating: 0
};

describe('useNote Hook', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should fetch notes successfully', async () => {
    server.use(
      http.get('/api/v1/notes', () => {
        return HttpResponse.json({
          success: true,
          data: [mockNote],
          count: 1
        });
      })
    );

    const { result } = renderHook(() => useNote());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toEqual([mockNote]);
    expect(result.current.error).toBeNull();
  });

  it('should handle note upload', async () => {
    const uploadData: NoteUploadData = {
      title: 'New Note',
      description: 'Test description',
      subject: 'Math',
      grade: '10',
      semester: '1',
      quarter: '1',
      topic: 'Algebra',
      file: new File([''], 'test.pdf', { type: 'application/pdf' }),
      isPublic: true,
      tags: []
    };

    server.use(
      http.post('/api/v1/notes', async ({ request }) => {
        const formData = await request.formData();
        return HttpResponse.json({
          success: true,
          data: {
            ...mockNote,
            title: formData.get('title'),
            description: formData.get('description')
          }
        });
      })
    );

    const { result } = renderHook(() => useNote());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let uploadedNote: Note | null = null;
    await act(async () => {
      uploadedNote = await result.current.uploadNote(uploadData);
    });

    expect(uploadedNote).toBeTruthy();
    expect(uploadedNote?.title).toBe(uploadData.title);
  });
}); 