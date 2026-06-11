// Re-exports the shared note types plus the AI-generation result shapes.
// This module was previously missing entirely: useNote.ts imported types from
// './noteTypes' that resolved nowhere (builds passed only because esbuild
// elides type-only imports).
export type {
  Note,
  NoteRating,
  NoteComment,
  Flashcard,
  NoteFilter,
  PaginatedNotesResponse,
  NoteRatingResponse,
  NoteUploadData,
  ManualFlashcardPayload,
  CompleteStudyPayload
} from '../../types/note';

export interface AISummary {
  noteId: string;
  summary: string | null;
  keyPoints: string[];
  generatedAt: string;
}

export interface NewlyAwardedBadgeInfo {
  name: string;
  level: string;
  xpReward: number;
  [key: string]: any;
}

export interface AIGenerationResult<T> {
  data: T | null;
  newlyAwardedBadges: NewlyAwardedBadgeInfo[];
}
