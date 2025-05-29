export interface Note {
  _id: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  isPublic: boolean;
  fileUrl: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  viewCount: number;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  averageRating: number;
  tags: string[];
  aiSummary?: {
    content: string | null;
    keyPoints?: string[];
    generatedAt: string | Date;
    modelUsed: string;
  };
  flashcards?: Flashcard[];
  comments?: NoteComment[];
  asset_id?: string;
}

export interface NoteRating {
  userId: string;
  rating: number;
  createdAt: string;
}

export interface NoteComment {
  _id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFilter {
  subject?: string;
  grade?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedNotesResponse {
  success: boolean;
  data: {
    notes: Note[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NoteRatingResponse {
  success: boolean;
  data: {
    note: Note;
    rating: NoteRating;
  };
}

export interface NoteUploadData {
  title: string;
  content: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  isPublic: boolean;
  fileUrl?: string;
  fileType?: string;
  tags?: string[];
}

export interface ManualFlashcardPayload {
  question: string;
  answer: string;
}

export interface CompleteStudyPayload {
  noteId: string;
  timeSpent: number;
  flashcardsReviewed: number;
  correctAnswers: number;
} 