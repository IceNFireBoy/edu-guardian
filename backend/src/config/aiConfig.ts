/**
 * Configuration for AI-powered features.
 *
 * Daily per-user quotas keep AI costs bounded and protect the shared LLM key
 * from abuse. They reset lazily at the first request of a new UTC day.
 */
export const AI_USAGE_LIMITS = {
  SUMMARY_PER_DAY: 20,
  FLASHCARDS_PER_DAY: 20,
  QUIZ_PER_DAY: 20,
  CHAT_PER_DAY: 50,
} as const;

// Upper bound on characters of source material sent to the model, to control
// token cost and stay within context limits.
export const AI_MAX_SOURCE_CHARS = 12000;

// Model id is configurable per provider; sensible defaults are used otherwise.
export const AI_DEFAULT_MODEL = {
  anthropic: process.env.AI_MODEL || 'claude-3-5-haiku-latest',
  openai: process.env.AI_MODEL || 'gpt-4o-mini',
} as const;
