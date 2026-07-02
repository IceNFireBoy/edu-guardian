import { IUser } from '../models/User';
import { QuotaExceededError } from './customErrors';
import { AI_USAGE_LIMITS } from '../config/aiConfig';

/**
 * Per-user daily quota enforcement for AI features. Counters reset lazily at the
 * first request of a new UTC day. Throws QuotaExceededError (→ HTTP 429) when a
 * limit is hit, which the frontend surfaces as a friendly "usage limit" toast.
 */

export type AiKind = 'summary' | 'flashcard' | 'quiz' | 'chat';

type NumericUsageField = 'summaryUsed' | 'flashcardUsed' | 'quizUsed' | 'chatUsed';

const FIELD: Record<AiKind, NumericUsageField> = {
  summary: 'summaryUsed',
  flashcard: 'flashcardUsed',
  quiz: 'quizUsed',
  chat: 'chatUsed',
};

const LIMIT: Record<AiKind, number> = {
  summary: AI_USAGE_LIMITS.SUMMARY_PER_DAY,
  flashcard: AI_USAGE_LIMITS.FLASHCARDS_PER_DAY,
  quiz: AI_USAGE_LIMITS.QUIZ_PER_DAY,
  chat: AI_USAGE_LIMITS.CHAT_PER_DAY,
};

const isSameUTCDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export async function consumeAiQuota(user: IUser, kind: AiKind): Promise<void> {
  if (!user.aiUsage) {
    user.aiUsage = {
      summaryUsed: 0,
      flashcardUsed: 0,
      quizUsed: 0,
      chatUsed: 0,
      lastReset: new Date(),
    };
  }

  const now = new Date();
  const last = user.aiUsage.lastReset ? new Date(user.aiUsage.lastReset) : new Date(0);
  if (!isSameUTCDay(now, last)) {
    user.aiUsage.summaryUsed = 0;
    user.aiUsage.flashcardUsed = 0;
    user.aiUsage.quizUsed = 0;
    user.aiUsage.chatUsed = 0;
    user.aiUsage.lastReset = now;
  }

  const field = FIELD[kind];
  const used = user.aiUsage[field] ?? 0;
  if (used >= LIMIT[kind]) {
    throw new QuotaExceededError(
      `Daily ${kind} limit reached (${LIMIT[kind]}/day). Your AI quota resets at 00:00 UTC.`
    );
  }

  user.aiUsage[field] = used + 1;
  await user.save();
}
