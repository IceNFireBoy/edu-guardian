import { useState, useCallback } from 'react';
import { Note, NoteFilter, PaginatedNotesResponse } from '../../types/note';
import { api } from '../../utils/api';

export const useNote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async (filter: NoteFilter): Promise<PaginatedNotesResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notes', { params: filter });
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNote = useCallback(async (noteId: string): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/notes/${noteId}`);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (noteData: FormData): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/notes', noteData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, noteData: Partial<Note>): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/notes/${noteId}`, noteData);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/notes/${noteId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rateNote = useCallback(async (noteId: string, rating: number): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/notes/${noteId}/rate`, { rating });
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAISummary = useCallback(async (noteId: string): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/notes/${noteId}/summary`);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI summary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFlashcards = useCallback(async (noteId: string): Promise<Note> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/notes/${noteId}/flashcards`);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNotes = useCallback(async (filter: NoteFilter): Promise<PaginatedNotesResponse> => {
    return fetchNotes(filter);
  }, [fetchNotes]);

  return {
    loading,
    error,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    rateNote,
    generateAISummary,
    generateFlashcards,
    refreshNotes
  };
}; 