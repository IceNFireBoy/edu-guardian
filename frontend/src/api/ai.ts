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

  chat: (message: string) => post<{ reply: string }>(`/ai/chat`, { message }),

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
};

export default aiApi;
