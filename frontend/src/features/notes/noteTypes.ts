import { FlashcardDifficulty } from '../../config/constants';

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
  difficulty: FlashcardDifficulty;
  lastReviewed?: string | null;
  nextReviewDate?: string | null;
  efactor?: number;
  interval?: number;
  repetitions?: number;
  user?: string;
}

export interface ManualFlashcardPayload {
  question: string;
  answer: string;
}

export interface NoteFilter {
  subject?: string;
  grade?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  minRating?: number;
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'rating' | 'views' | 'date' | 'flashcards';
  sortOrder?: 'asc' | 'desc';
}

export interface NoteUploadData {
  title: string;
  description: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  file: File;
  isPublic: boolean;
  tags: string[];
}

export interface NoteStudySession {
  noteId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  flashcardsReviewed: number;
  correctAnswers: number;
  incorrectAnswers: number;
  focusScore: number;
}

export interface AISummary {
  noteId: string;
  summary: string | null;
  keyPoints?: string[];
  generatedAt?: string;
}

export interface PDFViewerProps {
  fileUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface NoteCardProps {
  note: Note;
  onView?: (note: Note) => void;
  className?: string;
}

export interface NoteFilterProps {
  onFilterChange: (filter: NoteFilter) => void;
  initialFilter?: NoteFilter;
  className?: string;
}

export interface NoteDetailsProps {
  noteId: string;
  onClose?: () => void;
  className?: string;
}

export interface NoteUploaderProps {
  onUploadComplete?: (note: Note) => void;
  onCancel?: () => void;
  className?: string;
}

export interface NewlyAwardedBadgeInfo {
  badgeId: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
}

export interface AIGenerationResult<T> {
  data: T;
  newlyAwardedBadges: NewlyAwardedBadgeInfo[];
}

export interface PaginatedNotesResponse {
  data: Note[];
  count: number;
  totalPages: number;
  currentPage: number;
} 