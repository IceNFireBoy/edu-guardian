// Frontend client for the AI endpoints. Built on the shared axios instance so
// it inherits auth-token injection and 401 handling. Errors are routed through
// the central handleApiError (which shows a friendly toast, including the
// dedicated 429/quota message) and then re-thrown so callers can set inline
// state without toasting a second time.
import apiClient from './apiClient';
import { handleApiError } from '../utils/errorHandler';

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DueCard {
  _id: string;
  question: string;
  answer: string;
  dueDate: string;
}

/** Flashcard subdocument as stored on a note */
export interface NoteFlashcard {
  _id: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  try {
    const res = await apiClient.post(url, body ?? {});
    return res.data.data as T;
  } catch (error) {
    handleApiError(error); // shows the toast (network / quota / server)
    throw error;
  }
}

export const aiApi = {
  summarizeNote: (noteId: string) =>
    post<{ summary: string }>(`/ai/notes/${noteId}/summary`),

  generateFlashcards: (noteId: string, count = 8, save = false) =>
    post<{ flashcards: GeneratedFlashcard[] }>(`/ai/notes/${noteId}/flashcards`, { count, save }),

  generateQuiz: (noteId: string, count = 5) =>
    post<{ questions: QuizQuestion[] }>(`/ai/notes/${noteId}/quiz`, { count }),

  chat: (message: string, history: Array<{ role: 'user' | 'bot'; text: string }> = []) =>
    post<{ reply: string; provider?: string }>(`/ai/chat`, { message, history }),

  explain: (passage: string, level?: string) =>
    post<{ explanation: string }>(`/ai/explain`, { passage, level }),

  addToReviewDeck: (cards: Array<{ question: string; answer: string }>, noteId?: string) =>
    post<{ added: number }>(`/srs/cards`, { cards, noteId }),

  reviewCard: (cardId: string, quality: number) =>
    post<unknown>(`/srs/review`, { cardId, quality }),

  getDueCards: async (): Promise<DueCard[]> => {
    try {
      const res = await apiClient.get('/srs/due');
      return (res.data.data as DueCard[]) ?? [];
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  /** The user's whole review deck (soonest-due first). */
  getDeck: async (page = 1, limit = 100): Promise<{ cards: DueCard[]; total: number }> => {
    try {
      const res = await apiClient.get(`/srs/cards?page=${page}&limit=${limit}`);
      return { cards: (res.data.data as DueCard[]) ?? [], total: res.data.count ?? 0 };
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteDeckCard: async (cardId: string): Promise<void> => {
    try {
      await apiClient.delete(`/srs/cards/${cardId}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

/**
 * User-authored flashcards attached to a note (owner-gated server-side).
 * Every call resolves with the note's refreshed flashcards array.
 */
const noteFlashcardsFrom = (res: any): NoteFlashcard[] =>
  (res?.data?.data?.flashcards as NoteFlashcard[]) ?? [];

export const noteCardsApi = {
  create: async (
    noteId: string,
    card: { question: string; answer: string; difficulty?: string }
  ): Promise<NoteFlashcard[]> => {
    try {
      const res = await apiClient.post(`/notes/${noteId}/flashcards`, card);
      return noteFlashcardsFrom(res);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  bulkAdd: async (
    noteId: string,
    flashcards: Array<{ question: string; answer: string; difficulty?: string }>
  ): Promise<NoteFlashcard[]> => {
    try {
      const res = await apiClient.post(`/notes/${noteId}/flashcards/bulk`, { flashcards });
      return noteFlashcardsFrom(res);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (
    noteId: string,
    cardId: string,
    updates: { question?: string; answer?: string; difficulty?: string }
  ): Promise<NoteFlashcard[]> => {
    try {
      const res = await apiClient.put(`/notes/${noteId}/flashcards/${cardId}`, updates);
      return noteFlashcardsFrom(res);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  remove: async (noteId: string, cardId: string): Promise<NoteFlashcard[]> => {
    try {
      const res = await apiClient.delete(`/notes/${noteId}/flashcards/${cardId}`);
      return noteFlashcardsFrom(res);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

export default aiApi;
