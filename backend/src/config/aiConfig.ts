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
// Per-provider env vars so a cascade can mix providers without sending one
// vendor's model id to another.
export const AI_DEFAULT_MODEL = {
  // gemini-1.5-* is retired for new API keys (the API returns 404, which
  // silently cascaded to mock output in production). 2.5-flash and 2.0-flash
  // are the current free-tier models.
  gemini: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  anthropic: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
  openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
} as const;

// Ordered candidates GeminiProvider tries when a model id 404s (e.g. an env
// override pointing at a retired model). De-duplicated at use site.
export const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter((m): m is string => Boolean(m));

// Max simultaneous in-flight AI calls across the process. Bursts beyond this
// queue rather than all hitting the provider at once (protects free-tier RPM
// limits when several users act at the same time).
export const AI_MAX_CONCURRENCY = Math.max(1, Number(process.env.AI_MAX_CONCURRENCY) || 3);

// How long generated flashcards/quizzes are cached (seconds). Repeat requests
// for the same note serve from cache and cost zero provider calls.
export const AI_RESULT_TTL = Math.max(60, Number(process.env.AI_RESULT_TTL) || 3600);
