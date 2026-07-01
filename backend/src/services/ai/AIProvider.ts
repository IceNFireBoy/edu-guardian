/**
 * Provider-agnostic AI interface.
 *
 * The rest of the app talks to `AIProvider.complete()` and never to a specific
 * vendor SDK. `getAIProvider()` (see ./index.ts) returns a real provider when an
 * API key is configured, or a deterministic mock otherwise — so every AI feature
 * runs and is testable with no external dependencies, and upgrades to a real LLM
 * simply by setting an env var.
 */

export type AIIntent = 'summary' | 'flashcards' | 'quiz' | 'chat' | 'explain' | 'image';

export interface AICompletionRequest {
  /** High-level system instruction (persona / rules). */
  system?: string;
  /** The user prompt. */
  prompt: string;
  /** What the caller is trying to do — used by the mock to shape output. */
  intent?: AIIntent;
  /** Raw source material; the mock derives deterministic output from this. */
  sourceText?: string;
  /** Hint that a JSON response is expected. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  readonly name: string;
  complete(request: AICompletionRequest): Promise<string>;
  /**
   * Optional vision capability — extract text from / describe an image.
   * Only implemented by providers that support it (e.g. Gemini). Callers must
   * feature-detect (`if (provider.describeImage)`) and fall back to OCR.
   */
  describeImage?(imageUrl: string, prompt: string): Promise<string>;
}
