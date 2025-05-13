export const OPENAI_CHAT_MODEL = 'gpt-3.5-turbo-1106';

export const AI_FEATURE_TYPES = {
  SUMMARY: 'summary',
  FLASHCARD: 'flashcard',
} as const;

export type AIFeatureType = typeof AI_FEATURE_TYPES[keyof typeof AI_FEATURE_TYPES];

export const FLASHCARD_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type FlashcardDifficulty = typeof FLASHCARD_DIFFICULTY_LEVELS[number];

// Default items per page for pagination if not specified
export const DEFAULT_PAGE_SIZE = 10;

// Maximum items per page for pagination
export const MAX_PAGE_SIZE = 100;

// Interface for the structure of newly awarded badges sent to frontend
export interface IUserBadgeEarnedAPIResponse {
  badgeId: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
}