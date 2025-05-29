export interface Note {
  _id: string;
  title: string;
  description: string;
  content: string;
  fileUrl: string;
  user: string;
  isPublic: boolean;
  tags: string[];
  rating: number;
  ratings: NoteRating[];
  aiSummary: AISummary;
  aiSummaryKeyPoints: string[];
  flashcards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteRating {
  userId: string;
  value: number;
  createdAt: Date;
}

export interface AISummary {
  content: string;
  keyPoints: string[];
  generatedAt: Date;
  modelUsed: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: Date;
  reviewCount: number;
  successRate: number;
}

export interface NoteFilter {
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  sortBy?: 'title' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface NoteUploadData {
  title: string;
  description: string;
  content: string;
  fileUrl: string;
  isPublic: boolean;
  tags: string[];
}

export interface PaginatedNotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ManualFlashcardPayload {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIGenerationResult {
  success: boolean;
  data?: {
    content: string;
    keyPoints: string[];
  };
  error?: string;
}

export interface NewlyAwardedBadgeInfo {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
} 