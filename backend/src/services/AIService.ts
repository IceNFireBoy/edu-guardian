import { getAIProvider } from './ai';
import { PROMPTS } from './ai/prompts';
import { AI_MAX_SOURCE_CHARS } from '../config/aiConfig';
import { FLASHCARD_DIFFICULTY_LEVELS, FlashcardDifficulty } from '../config/constants';

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * High-level AI operations. Builds prompts from the prompt library, calls the
 * active provider (real or mock), and defensively parses the result. Callers
 * never deal with provider specifics or malformed model output.
 */
export class AIService {
  private static provider = () => getAIProvider();

  /** Trim source material to a safe size for the model context / token budget. */
  private static clip(text: string): string {
    return (text || '').slice(0, AI_MAX_SOURCE_CHARS);
  }

  /**
   * Best-effort JSON extraction. Real models sometimes wrap JSON in prose or
   * markdown fences; we strip those and fall back to locating the first array
   * or object in the text.
   */
  private static extractJson<T>(raw: string): T | null {
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      /* fall through */
    }

    const candidate = cleaned.match(/\[[\s\S]*\]/)?.[0] ?? cleaned.match(/\{[\s\S]*\}/)?.[0];
    if (candidate) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        /* give up */
      }
    }
    return null;
  }

  static async summarize(text: string): Promise<string> {
    const source = this.clip(text);
    const out = await this.provider().complete({
      intent: 'summary',
      system: PROMPTS.summary.system,
      prompt: PROMPTS.summary.user(source),
      sourceText: source,
      maxTokens: 600,
    });
    return out.trim().slice(0, 4000);
  }

  static async generateFlashcards(text: string, count = 8, context = ''): Promise<GeneratedFlashcard[]> {
    const source = this.clip(text);
    const safeCount = Math.min(Math.max(count, 1), 20);
    const out = await this.provider().complete({
      intent: 'flashcards',
      json: true,
      system: PROMPTS.flashcards.system,
      prompt: PROMPTS.flashcards.user(source, safeCount, context),
      sourceText: source,
      maxTokens: 1600,
    });

    const parsed = this.extractJson<any[]>(out) ?? [];
    return parsed
      .filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string')
      .slice(0, safeCount)
      .map((c) => ({
        question: String(c.question).trim(),
        answer: String(c.answer).trim(),
        difficulty: (FLASHCARD_DIFFICULTY_LEVELS as readonly string[]).includes(c.difficulty)
          ? (c.difficulty as FlashcardDifficulty)
          : 'medium',
      }));
  }

  static async generateQuiz(text: string, count = 5, context = ''): Promise<QuizQuestion[]> {
    const source = this.clip(text);
    const safeCount = Math.min(Math.max(count, 1), 20);
    const out = await this.provider().complete({
      intent: 'quiz',
      json: true,
      system: PROMPTS.quiz.system,
      prompt: PROMPTS.quiz.user(source, safeCount, context),
      sourceText: source,
      maxTokens: 2000,
    });

    const parsed = this.extractJson<any[]>(out) ?? [];
    return parsed
      .filter(
        (q) =>
          q &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length >= 2
      )
      .slice(0, safeCount)
      .map((q) => {
        const options = q.options.slice(0, 4).map((o: any) => String(o));
        let correctIndex = Number(q.correctIndex);
        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
          correctIndex = 0;
        }
        return {
          question: String(q.question).trim(),
          options,
          correctIndex,
          explanation: String(q.explanation ?? '').trim(),
        };
      });
  }

  static async chat(
    message: string,
    context: string,
    history: Array<{ role: 'user' | 'bot'; text: string }> = []
  ): Promise<string> {
    // Compact transcript (newest last) so the model can hold a conversation
    // instead of treating every message as the first.
    const turns = [...history.slice(-10), { role: 'user' as const, text: message }];
    const transcript = turns
      .map((t) => `${t.role === 'user' ? 'Student' : 'Coach'}: ${t.text.slice(0, 500)}`)
      .join('\n');

    const out = await this.provider().complete({
      intent: 'chat',
      system: PROMPTS.chat.system,
      prompt: PROMPTS.chat.conversation(transcript, context),
      maxTokens: 500,
      temperature: 0.7, // conversation should feel alive, not templated
    });
    return out.trim();
  }

  /**
   * Analyze an image via a vision-capable provider (OCR + diagram description).
   * Returns null when no vision provider is configured, so the caller can fall
   * back to plain OCR (extractTextFromFile).
   */
  static async analyzeImage(imageUrl: string): Promise<string | null> {
    const provider = this.provider();
    if (!provider.describeImage) return null;
    const out = await provider.describeImage(imageUrl, PROMPTS.image.user);
    return out.trim();
  }

  static async explain(passage: string, level = "like I'm 5"): Promise<string> {
    const source = this.clip(passage);
    const out = await this.provider().complete({
      intent: 'explain',
      system: PROMPTS.explain.system,
      prompt: PROMPTS.explain.user(source, level),
      sourceText: source,
      maxTokens: 500,
    });
    return out.trim();
  }
}

export default AIService;
