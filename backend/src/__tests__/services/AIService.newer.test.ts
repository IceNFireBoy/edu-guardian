import { describe, it, expect, beforeAll } from 'vitest';
import AIService from '../../services/AIService';
import { __resetAIProvider } from '../../services/ai';

// With no API key configured, AIService uses the deterministic MockProvider, so
// these assertions are stable and require no network access.
const SAMPLE =
  'Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs sunlight. ' +
  'Plants release oxygen as a byproduct. The process occurs in chloroplasts.';

describe('AIService (mock provider)', () => {
  beforeAll(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    __resetAIProvider();
  });

  it('summarize returns a non-empty string', async () => {
    const summary = await AIService.summarize(SAMPLE);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('generateFlashcards returns the requested number of well-formed cards', async () => {
    const cards = await AIService.generateFlashcards(SAMPLE, 5);
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(typeof card.question).toBe('string');
      expect(card.question.length).toBeGreaterThan(0);
      expect(typeof card.answer).toBe('string');
      expect(['easy', 'medium', 'hard']).toContain(card.difficulty);
    }
  });

  it('generateQuiz returns MCQs with an in-range correctIndex', async () => {
    const questions = await AIService.generateQuiz(SAMPLE, 3);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });
});
