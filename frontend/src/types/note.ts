export interface Note {
  _id: string;
  title: string;
  content: string;
  description?: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  isPublic: boolean;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  downloadCount: number;
  averageRating: number;
  ratings: NoteRating[];
  flashcards: Flashcard[];
  user: string;
  ratingCount: number;
  rating: number;
  aiSummary?: string | null;
  aiSummaryKeyPoints?: string[];
  aiSummaryGeneratedAt?: string;
  tags?: string[];
}

export interface NoteRating {
  _id: string;
  noteId: string;
  userId: string;
  value: number;
  createdAt: string;
}

export interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: string;
  nextReviewDate?: string;
  efactor?: number;
  interval?: number;
  repetitions?: number;
  user: string;
}

export interface NoteFilter {
  searchQuery?: string;
  subject?: string;
  grade?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedNotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NoteResponse {
  success: boolean;
  data: Note;
  error?: string;
}

export interface NotesResponse {
  success: boolean;
  data: {
    notes: Note[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface NoteRatingResponse {
  success: boolean;
  data: NoteRating;
  error?: string;
}

export interface NoteDownloadResponse {
  success: boolean;
  downloadUrl: string;
  error?: string;
}

export interface AISummary {
  noteId: string;
  summary: string | null;
  keyPoints: string[];
  generatedAt: string;
}

export interface AISummaryResponse {
  success: boolean;
  data: {
    aiSummary: AISummary;
  };
  error?: string;
}

export interface FlashcardResponse {
  success: boolean;
  data: {
    flashcards: Flashcard[];
  };
  error?: string;
}

export interface StudySessionResponse {
  success: boolean;
  data: {
    xpEarned: number;
    currentStreak: number;
    level: number;
    awardedBadges: Array<{
      name: string;
      level: string;
      xpReward: number;
    }>;
    newBadgeCount: number;
  };
  error?: string;
}

export interface CompleteStudyPayload {
  noteId: string;
  duration: number;
  flashcardsReviewed: number;
} 