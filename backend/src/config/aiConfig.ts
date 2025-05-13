export const AI_USAGE_LIMITS = {
  SUMMARY_PER_DAY: 3,
  FLASHCARDS_PER_DAY: 5, // Represents 5 generation *events*
  // If flashcards are generated in batches, this might be "flashcard_sets_per_day"
};

export const AI_USER_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ADMIN: 'admin',
};

export const QUOTA_RESET_HOURS = 24; // Resets every 24 hours 