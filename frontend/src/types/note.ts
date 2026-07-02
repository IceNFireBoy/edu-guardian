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
  createdAt: string;
  updatedAt: string;
  userId: string;
  viewCount: number;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  averageRating: number;
  tags: string[];
  /** Rating subdocuments exactly as the backend stores them on the note */
  ratings?: NoteRatingEntry[];
  /** AI-generated summary; the backend stores this as a plain string */
  aiSummary?: string;
  flashcards?: Flashcard[];
  comments?: NoteComment[];
  asset_id?: string;
}

/** One rating entry in Note.ratings (backend subdocument shape) */
export interface NoteRatingEntry {
  _id?: string;
  value: number;
  user: string;
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
  /** Free-text query as the filter form sends it */
  searchQuery?: string;
  /** 'date' is the filter form's legacy alias for newest-first */
  sortBy?: 'date' | 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Notes-list result as fetchNotes actually resolves it. The backend returns
 * { success, count, totalPages, currentPage, data: Note[] }; fetchNotes strips
 * the success flag and normalizes the rest. (The previous nested
 * { data: { notes: [...] } } shape never matched the API and hid a runtime bug
 * where callers reading `.data` off a bare array got undefined.)
 */
export interface PaginatedNotesResponse {
  data: Note[];
  count: number;
  totalPages: number;
  currentPage: number;
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
  description?: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  isPublic: boolean;
  fileUrl?: string;
  fileType?: string;
  tags?: string[];
  /** Raw file selected in the uploader; sent to Cloudinary, not the API */
  file?: File;
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