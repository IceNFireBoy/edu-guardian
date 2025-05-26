import { useState, useCallback } from 'react';
import { Note } from '../types/note';
import { NoteFilter, NoteUploadData, NoteRating, Flashcard, AISummary, PaginatedNotesResponse, ManualFlashcardPayload, AIGenerationResult, NewlyAwardedBadgeInfo } from './noteTypes';
import { callAuthenticatedApi, ApiResponse } from '../../api/notes';
import { debug } from '../../components/DebugPanel'; // Assuming debug is available

// Helper to get VITE vars or provide defaults for safety
const getCloudinaryCloudName = (): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.warn('VITE_CLOUDINARY_CLOUD_NAME is not set in environment variables');
    return 'dbnk6q2k6'; // Default only as fallback
  }
  return cloudName;
};

const getCloudinaryUploadPreset = (): string => {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!uploadPreset) {
    console.warn('VITE_CLOUDINARY_UPLOAD_PRESET is not set in environment variables');
    return 'edu_guardian'; // Default only as fallback
  }
  return uploadPreset;
};

const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

interface CachedNotes {
  timestamp: number;
  data: PaginatedNotesResponse; // Use the more specific paginated response type
}

// Helper function to create a cache key from filters
const getNotesCacheKey = (filter: NoteFilter): string => {
  // Sort keys for consistent key generation
  const sortedFilterKeys = Object.keys(filter).sort();
  const filterString = sortedFilterKeys.map(key => `${key}=${filter[key as keyof NoteFilter]}`).join('&');
  return `notes_cache_${filterString || 'all'}`;
};

// Helper function to clear all notes caches (e.g., after upload or delete)
const clearAllNotesCaches = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notes_cache_')) {
        localStorage.removeItem(key);
        debug('[useNote] Cleared cache:', key);
      }
    });
  } catch (e) {
    console.error("Error clearing notes caches from localStorage", e);
  }
};

// Define a type for the backend payload when creating/uploading a note
// This should mirror the fields expected by NoteService.createNote and the controller
interface BackendNoteUploadPayload {
  title: string;
  description?: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId?: string;
  assetId?: string;
  tags?: string[];
  isPublic: boolean;
}

// Define a type for the raw response from the backend for AI Summary
// This mirrors what NoteService.generateAISummaryForNote actually returns (Partial<INote>)
interface RawAISummaryResponse {
  _id: string; // noteId
  aiSummary?: { // Matching new backend structure in NoteService where data is { _id, aiSummary: { content, generatedAt, modelUsed } }
    content: string | null;
    keyPoints?: string[]; // Assuming keyPoints might still be part of aiSummary object or directly under data
    generatedAt: string | Date;
    modelUsed: string;
  };
}

// Type for backend response of AI Flashcard generation
interface RawAIFlashcardsResponse {
  flashcards: Flashcard[];
}

export const useNote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes with filtering and caching
  const fetchNotes = useCallback(async (filter: NoteFilter): Promise<PaginatedNotesResponse> => {
    setLoading(true);
    setError(null);
    const cacheKey = getNotesCacheKey(filter);

    try {
      const cachedItem = localStorage.getItem(cacheKey);
      if (cachedItem) {
        const cachedNotes = JSON.parse(cachedItem) as CachedNotes;
        if (Date.now() - cachedNotes.timestamp < CACHE_EXPIRATION_MS) {
          debug('[useNote] Using cached notes for filter:', filter);
          return cachedNotes.data;
        } else {
          localStorage.removeItem(cacheKey); // Cache expired
          debug('[useNote] Removed expired cache for filter:', filter);
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage", e);
      localStorage.removeItem(cacheKey); // Clear corrupted cache
    }

    try {
      debug('[useNote] Fetching notes from API for filter:', filter);
      // Adjust callAuthenticatedApi to expect PaginatedNotesResponse for this endpoint
      const response = await callAuthenticatedApi<PaginatedNotesResponse>('/api/v1/notes', 'GET', filter as any);
      
      if (response.success && response.data) {
        const notesData = response.data;
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: notesData }));
          debug('[useNote] Cached notes for filter:', filter);
        } catch (e) {
          console.error("Error writing to localStorage", e);
        }
        return notesData;
      } else {
        // If response.success is false or data is undefined, throw an error to be caught below
        throw new Error(response.error || response.message || 'Failed to fetch notes: API returned unsuccessful response.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes');
      // Return a default empty structure for PaginatedNotesResponse on error
      return { data: [], count: 0, totalPages: 0, currentPage: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to explicitly refresh notes, bypassing cache
  const refreshNotes = useCallback(async (filter: NoteFilter): Promise<PaginatedNotesResponse> => {
    setLoading(true);
    setError(null);
    const cacheKey = getNotesCacheKey(filter);
    try {
      localStorage.removeItem(cacheKey); // Remove existing cache before fetching
      debug('[useNote] Cache cleared for refresh, filter:', filter);
    } catch (e) {
      console.error("Error removing from localStorage for refresh", e);
    }
    // Call fetchNotes which will now fetch from API as cache is cleared
    return fetchNotes(filter); 
  }, [fetchNotes]);

  // Fetch single note (caching for single notes can also be added if beneficial)
  const fetchNote = useCallback(async (noteId: string): Promise<Note | null> => {
    setLoading(true);
    setError(null);
    try {
      // Assuming the single note response is wrapped in ApiResponse { success: true, data: Note }
      const response = await callAuthenticatedApi<Note>(`/api/v1/notes/${noteId}`, 'GET');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || response.message || 'Failed to fetch note details.');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch note');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload new note
  const uploadNote = useCallback(async (noteUploadData: NoteUploadData): Promise<Note | null> => {
    setLoading(true);
    setError(null);
    try {
      const { file, ...metadata } = noteUploadData;

      if (!file) {
        throw new Error('File is required for upload.');
      }

      const cloudName = getCloudinaryCloudName();
      const uploadPreset = getCloudinaryUploadPreset();

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('upload_preset', uploadPreset);
      
      const uploadUrlType = file.type.startsWith('image/') ? 'image' : 'raw';
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${uploadUrlType}/upload`;

      const cloudRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      if (!cloudRes.ok) {
        const errorText = await cloudRes.text();
        console.error('[useNote] Cloudinary upload failed:', errorText);
        throw new Error(`Cloudinary upload failed: ${errorText}`);
      }

      const cloudData = await cloudRes.json();

      let thumbnailUrl: string | undefined;
      if (cloudData.resource_type === 'image' && cloudData.secure_url) {
        const parts = cloudData.secure_url.split('/upload/');
        if (parts.length === 2) {
          thumbnailUrl = `${parts[0]}/upload/w_400,c_limit/${parts[1]}`;
        } else {
          thumbnailUrl = cloudData.secure_url;
        }
      }

      const backendPayload: BackendNoteUploadPayload = {
        ...metadata,
        fileUrl: cloudData.secure_url,
        fileType: cloudData.format || file.type.split('/')[1] || 'unknown',
        fileSize: cloudData.bytes || file.size,
        publicId: cloudData.public_id,
        assetId: cloudData.asset_id,
        tags: metadata.tags || (cloudData.tags || []),
        isPublic: metadata.isPublic,
      };

      const response = await callAuthenticatedApi<Note>('/api/v1/notes', 'POST', backendPayload);
      
      if (response.success && response.data) {
        clearAllNotesCaches();
        debug('[useNote] All notes caches cleared after successful upload.');
        return response.data;
      } else {
        throw new Error(response.error || response.message || 'Failed to save note to backend.');
      }

    } catch (err: any) {
      console.error('[useNote] Upload process error:', err);
      setError(err.message || 'Failed to upload note');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rate a note
  const rateNote = useCallback(async (noteId: string, value: number): Promise<NoteRating | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<NoteRating>(`/api/v1/notes/${noteId}/ratings`, 'POST', { value });
      if (response.success && response.data) {
        // Potentially invalidate cache for this specific note if it's cached, or list view if rating changes display
        // For now, not clearing list view cache on rating.
        return response.data;
      }
      throw new Error(response.error || response.message || 'Failed to rate note.');
    } catch (err: any) {
      setError(err.message || 'Failed to rate note');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Backend DELETE for notes might return the deleted note or just success
      // Assuming ApiResponse<{ _id: string } | null> or similar for the data part if needed
      const response = await callAuthenticatedApi(`/api/v1/notes/${noteId}`, 'DELETE');
      if (response.success) {
        clearAllNotesCaches(); // Invalidate cache on successful delete
        debug('[useNote] All notes caches cleared after successful delete.');
        return true;
      }
      throw new Error(response.error || response.message || 'Failed to delete note from backend.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Increment download count
  const incrementDownloadCount = useCallback(async (noteId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Backend PUT for download count might return updated note or just success
      const response = await callAuthenticatedApi(`/api/v1/notes/${noteId}/download`, 'PUT');
       if (response.success) {
        // Consider if this needs to invalidate any cache (e.g., if downloadCount is displayed in lists)
        return true;
      }
      throw new Error(response.error || response.message || 'Failed to update download count.');
    } catch (err: any) {
      setError(err.message || 'Failed to update download count');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate AI Summary
  const getAISummary = useCallback(async (noteId: string): Promise<AIGenerationResult<AISummary | null>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<AIGenerationResult<RawAISummaryResponse>>(`/api/v1/notes/${noteId}/summarize`, 'POST');
      
      if (response.success && response.data) {
        const summaryData: AISummary | null = response.data.data.aiSummary ? {
          noteId: response.data.data.aiSummary.noteId,
          summary: response.data.data.aiSummary.summary,
          keyPoints: response.data.data.aiSummary.keyPoints,
          generatedAt: response.data.data.aiSummary.generatedAt instanceof Date 
            ? response.data.data.aiSummary.generatedAt.toISOString()
            : response.data.data.aiSummary.generatedAt
        } : null;

        return { 
          data: summaryData,
          newlyAwardedBadges: response.data.newlyAwardedBadges || []
        };
      }
      throw new Error(response.error || response.message || 'Failed to generate AI summary.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI summary');
      return { data: null, newlyAwardedBadges: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate AI Flashcards
  const generateFlashcards = useCallback(async (noteId: string): Promise<AIGenerationResult<Flashcard[]>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<AIGenerationResult<RawAIFlashcardsResponse>>(`/api/v1/notes/${noteId}/generate-flashcards`, 'POST');
      if (response.success && response.data) {
        return { 
          data: response.data.data.flashcards || [], 
          newlyAwardedBadges: response.data.newlyAwardedBadges || [] 
        };
      } 
      throw new Error(response.error || response.message || 'Failed to generate AI flashcards.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI flashcards');
      return { data: [], newlyAwardedBadges: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add Manual Flashcard
  const addManualFlashcard = useCallback(async (noteId: string, payload: ManualFlashcardPayload): Promise<Flashcard | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAuthenticatedApi<Flashcard>(`/api/v1/notes/${noteId}/flashcards`, 'POST', payload);
      if (response.success && response.data) {
        // Optionally, could invalidate a cache related to this note's flashcard count or specific flashcard list if managed here.
        // For now, FlashcardContext handles fetching its own flashcards.
        debug('[useNote] Manual flashcard added for note:', noteId);
        return response.data;
      }
      throw new Error(response.error || response.message || 'Failed to add manual flashcard.');
    } catch (err: any) {
      setError(err.message || 'Failed to add manual flashcard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save AI Generated Flashcards to Note
  const saveFlashcards = useCallback(async (noteId: string, flashcardsToSave: Pick<Flashcard, 'question' | 'answer' | 'difficulty'>[]): Promise<Flashcard[] | null> => {
    setLoading(true);
    setError(null);
    try {
      // The backend expects an array of objects with question, answer, and difficulty
      // The Flashcard type on frontend includes id, noteId, etc., which are not needed for saving AI generated ones initially.
      const payload = flashcardsToSave.map(fc => ({
        question: fc.question,
        answer: fc.answer,
        difficulty: fc.difficulty || 'medium', // Ensure difficulty is provided
      }));

      // Endpoint might be something like /api/v1/notes/:noteId/ai-flashcards/save or similar
      // For now, using a direct call that aligns with the NoteService method name
      // The backend controller for this needs to be created.
      // Let's assume the NoteController will have a PUT or POST route like /:noteId/flashcards/save-generated
      const response = await callAuthenticatedApi<{ flashcards: Flashcard[] }>(`/api/v1/notes/${noteId}/save-ai-flashcards`, 'POST', { flashcards: payload });

      if (response.success && response.data && response.data.flashcards) {
        clearAllNotesCaches(); // Invalidate cache as note content (flashcards) has changed
        debug('[useNote] All notes caches cleared after saving AI flashcards.');
        return response.data.flashcards;
      } else {
        throw new Error(response.error || response.message || 'Failed to save AI generated flashcards.');
      }
    } catch (err: any) {
      console.error('[useNote] Save AI flashcards error:', err);
      setError(err.message || 'Failed to save flashcards');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchNotes,
    fetchNote,
    uploadNote,
    rateNote,
    deleteNote,
    incrementDownloadCount,
    getAISummary,
    generateFlashcards,
    saveFlashcards,
    addManualFlashcard,
    refreshNotes, // Expose the refresh function
  };
}; 