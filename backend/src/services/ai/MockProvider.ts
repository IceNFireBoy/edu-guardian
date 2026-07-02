import { AICompletionRequest, AIProvider } from './AIProvider';

/**
 * Deterministic, dependency-free AI provider used when no real API key is set.
 *
 * It derives believable output from the supplied source text so that every AI
 * feature works end-to-end (and can be unit-tested) without network access or
 * secrets. Output is stable for a given input, which keeps tests reliable.
 */

const splitSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const firstWords = (text: string, n: number): string =>
  text.split(/\s+/).slice(0, n).join(' ').replace(/[.,;:]$/, '');

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export class MockProvider implements AIProvider {
  public readonly name = 'mock';

  async complete(request: AICompletionRequest): Promise<string> {
    const source = (request.sourceText || request.prompt || '').trim();
    const sentences = splitSentences(source);

    switch (request.intent) {
      case 'summary':
        return this.summary(sentences);
      case 'flashcards':
        return this.flashcards(sentences, this.countFrom(request.prompt, 8));
      case 'quiz':
        return this.quiz(sentences, this.countFrom(request.prompt, 5));
      case 'explain':
        return this.explain(source);
      case 'chat':
        return this.chat(request.prompt);
      case 'image':
        return this.summary(sentences);
      default:
        return sentences.slice(0, 3).join(' ') || 'No content available.';
    }
  }

  private countFrom(prompt: string, fallback: number): number {
    const match = prompt.match(/\b(\d{1,2})\b/);
    const n = match ? parseInt(match[1], 10) : fallback;
    return Math.min(Math.max(n, 1), 20);
  }

  private summary(sentences: string[]): string {
    if (sentences.length === 0) return 'This material does not contain enough text to summarize.';
    const key = sentences.slice(0, 3).join(' ');
    const points = sentences.slice(0, 4).map((s) => `• ${firstWords(s, 10)}`);
    return `Summary: ${key}\n\nKey points:\n${points.join('\n')}`;
  }

  private flashcards(sentences: string[], count: number): string {
    const cards: Array<{ question: string; answer: string; difficulty: string }> = [];
    const base = sentences.length > 0 ? sentences : ['Key concept from the material.'];
    for (let i = 0; i < count; i++) {
      const sentence = base[i % base.length];
      const term = firstWords(sentence, 4) || `Concept ${i + 1}`;
      cards.push({
        question: `What is meant by "${term}"?`,
        answer: sentence,
        difficulty: DIFFICULTIES[i % DIFFICULTIES.length],
      });
    }
    return JSON.stringify(cards);
  }

  private quiz(sentences: string[], count: number): string {
    const base = sentences.length > 0 ? sentences : ['Key concept from the material.'];
    const questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }> = [];
    for (let i = 0; i < count; i++) {
      const sentence = base[i % base.length];
      const term = firstWords(sentence, 4) || `Concept ${i + 1}`;
      const correct = firstWords(sentence, 8) || sentence;
      questions.push({
        question: `Which statement best describes "${term}"?`,
        options: [
          correct,
          `An unrelated idea about ${term}`,
          `The opposite of ${term}`,
          `None of the above`,
        ],
        correctIndex: 0,
        explanation: `Based on the material: ${sentence}`,
      });
    }
    return JSON.stringify(questions);
  }

  private explain(source: string): string {
    const gist = firstWords(source, 20) || 'this idea';
    return (
      `Here's a simpler way to think about it: ${gist}...\n\n` +
      `In plain terms, this is about breaking a bigger idea into small, familiar pieces. ` +
      `Imagine explaining it to a friend using an everyday example.`
    );
  }

  private chat(prompt: string): string {
    const ask = prompt.split('Student asks:').pop()?.trim() || 'your studies';
    return (
      `Great question about ${firstWords(ask, 8)}! Here's what I'd suggest:\n` +
      `1. Review your most-studied note again with active recall.\n` +
      `2. Generate a quick quiz and redo the ones you miss.\n` +
      `3. Keep your streak going — short, daily sessions beat cramming.`
    );
  }
}

export default MockProvider;
