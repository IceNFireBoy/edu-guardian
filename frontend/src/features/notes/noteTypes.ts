import { FlashcardDifficulty } from '../../config/constants';

export interface Note {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  user: {
    _id: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
  averageRating?: number;
  ratings?: NoteRating[];
  viewCount?: number;
  isPublic: boolean;
  tags?: string[];

  aiSummary?: string | null;
  aiSummaryKeyPoints?: string[];
  aiSummaryGeneratedAt?: string | Date;
  flashcards?: Flashcard[];
}

export interface NoteRating {
  _id?: string;
  value: number;
  noteId: string;
  userId: string;
  createdAt: Date;
}

export interface Flashcard {
  _id?: string;
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
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
  startTime: Date;
  endTime?: Date;
  flashcardsReviewed: number;
  correctAnswers: number;
  incorrectAnswers: number;
  focusScore: number;
}

export interface AISummary {
  noteId: string;
  summary: string | null;
  keyPoints?: string[];
  generatedAt?: string | Date;
}

export interface PDFViewerProps {
  fileUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface NoteCardProps {
  note: Note;
  onRatingChange?: (noteId: string, rating: number) => void;
  onView?: (noteId: string) => void;
  onStudy?: (noteId: string) => void;
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
  // ... existing code ...
} 