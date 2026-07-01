import SrsCard, { ISrsCard } from '../models/SrsCard';
import { BadRequestError, NotFoundError } from '../utils/customErrors';

/**
 * Spaced Repetition System based on the SM-2 algorithm (SuperMemo). Cards the
 * student answers poorly are scheduled to reappear soon; well-known cards are
 * pushed further out. The scheduling math is a pure function (`review`) so it is
 * trivial to unit-test independently of the database.
 */

export interface SrsSchedule {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  dueDate: Date;
  lapses: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const initialSchedule = (now: Date = new Date()): SrsSchedule => ({
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
  dueDate: now,
  lapses: 0,
});

/**
 * Apply one review outcome. `quality` is 0–5 (how well the student recalled the
 * answer). Returns the next schedule; quality < 3 is a lapse and resets the
 * interval so the card comes back the next day.
 */
export const review = (
  state: Pick<SrsSchedule, 'repetitions' | 'easeFactor' | 'interval' | 'lapses'>,
  quality: number,
  now: Date = new Date()
): SrsSchedule => {
  const q = Math.min(Math.max(Math.round(quality), 0), 5);
  let { repetitions, easeFactor, interval, lapses } = state;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
    lapses += 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  // SM-2 ease-factor update, floored at 1.3.
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return {
    repetitions,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    lapses,
    dueDate: new Date(now.getTime() + interval * DAY_MS),
  };
};

export default class SrsService {
  /** Add review cards (e.g. from generated flashcards) to a user's deck. */
  static async addCards(
    userId: string,
    cards: Array<{ question: string; answer: string }>,
    noteId?: string
  ): Promise<number> {
    const valid = (cards || []).filter(
      (c) => c && typeof c.question === 'string' && typeof c.answer === 'string'
    );
    if (valid.length === 0) {
      throw new BadRequestError('No valid cards to add');
    }

    const now = new Date();
    const docs = valid.map((c) => ({
      user: userId,
      note: noteId,
      question: c.question.trim(),
      answer: c.answer.trim(),
      ...initialSchedule(now),
    }));

    const created = await SrsCard.insertMany(docs);
    return created.length;
  }

  /** Cards that are due for review right now, soonest first. */
  static async getDueCards(userId: string, limit = 20): Promise<ISrsCard[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return SrsCard.find({ user: userId, dueDate: { $lte: new Date() } })
      .sort({ dueDate: 1 })
      .limit(safeLimit);
  }

  /** Grade a card (0–5) and reschedule it via SM-2. */
  static async gradeCard(userId: string, cardId: string, quality: number): Promise<ISrsCard> {
    if (quality === undefined || quality === null || Number.isNaN(Number(quality))) {
      throw new BadRequestError('A numeric quality (0-5) is required');
    }
    const card = await SrsCard.findOne({ _id: cardId, user: userId });
    if (!card) {
      throw new NotFoundError('Review card not found');
    }

    const next = review(
      {
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        interval: card.interval,
        lapses: card.lapses,
      },
      Number(quality)
    );

    card.repetitions = next.repetitions;
    card.easeFactor = next.easeFactor;
    card.interval = next.interval;
    card.dueDate = next.dueDate;
    card.lapses = next.lapses;
    await card.save();
    return card;
  }
}
