import axios from 'axios';
import { AICompletionRequest, AIProvider } from './AIProvider';
import { AI_DEFAULT_MODEL, AI_MAX_CONCURRENCY } from '../../config/aiConfig';
import MockProvider from './MockProvider';

/**
 * Real providers are implemented directly over the REST APIs (via the axios
 * dependency we already have) rather than pulling in vendor SDKs. Supports
 * Gemini, Anthropic and OpenAI, arranged as a graceful cascade that always ends
 * at the deterministic mock — so a rate-limited or missing provider degrades to
 * placeholder output instead of an error.
 */

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  constructor(private readonly apiKey: string) {}

  private endpoint(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${AI_DEFAULT_MODEL.gemini}:generateContent?key=${this.apiKey}`;
  }

  async complete(request: AICompletionRequest): Promise<string> {
    const res = await axios.post(
      this.endpoint(),
      {
        systemInstruction: request.system ? { parts: [{ text: request.system }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 1024,
          temperature: request.temperature ?? 0.3,
          ...(request.json ? { responseMimeType: 'application/json' } : {}),
        },
      },
      { timeout: 30000, headers: { 'content-type': 'application/json' } }
    );
    const parts = res.data?.candidates?.[0]?.content?.parts;
    return Array.isArray(parts) ? parts.map((p: any) => p.text ?? '').join('') : '';
  }

  async describeImage(imageUrl: string, prompt: string): Promise<string> {
    // Gemini takes the image inline as base64.
    const img = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    const mimeType = (img.headers['content-type'] as string) || 'image/png';
    const data = Buffer.from(img.data).toString('base64');

    const res = await axios.post(
      this.endpoint(),
      {
        contents: [
          { role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] },
        ],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
      },
      { timeout: 45000, headers: { 'content-type': 'application/json' } }
    );
    const parts = res.data?.candidates?.[0]?.content?.parts;
    return Array.isArray(parts) ? parts.map((p: any) => p.text ?? '').join('') : '';
  }
}

class AnthropicProvider implements AIProvider {
  public readonly name = 'anthropic';
  constructor(private readonly apiKey: string) {}

  async complete(request: AICompletionRequest): Promise<string> {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: AI_DEFAULT_MODEL.anthropic,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.3,
        system: request.system,
        messages: [{ role: 'user', content: request.prompt }],
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const parts = res.data?.content;
    return Array.isArray(parts) ? parts.map((p: any) => p.text ?? '').join('') : '';
  }
}

class OpenAIProvider implements AIProvider {
  public readonly name = 'openai';
  constructor(private readonly apiKey: string) {}

  async complete(request: AICompletionRequest): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    messages.push({ role: 'user', content: request.prompt });

    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: AI_DEFAULT_MODEL.openai,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 1024,
        messages,
        ...(request.json ? { response_format: { type: 'json_object' } } : {}),
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
        timeout: 30000,
      }
    );
    return res.data?.choices?.[0]?.message?.content ?? '';
  }
}

// ---------------------------------------------------------------------------
// Cascade: try each provider in order, fall through on failure, end at mock.
// ---------------------------------------------------------------------------

class CascadeProvider implements AIProvider {
  public readonly name: string;
  public readonly describeImage?: (imageUrl: string, prompt: string) => Promise<string>;

  constructor(private readonly providers: AIProvider[]) {
    this.name = providers.map((p) => p.name).join('->');

    const visionCapable = providers.filter((p) => typeof p.describeImage === 'function');
    if (visionCapable.length > 0) {
      this.describeImage = async (imageUrl, prompt) => {
        let lastErr: unknown;
        for (const p of visionCapable) {
          try {
            return await p.describeImage!(imageUrl, prompt);
          } catch (err) {
            lastErr = err;
            console.warn(`[ai] vision provider ${p.name} failed, falling through:`, (err as Error).message);
          }
        }
        throw lastErr ?? new Error('No vision-capable provider succeeded');
      };
    }
  }

  async complete(request: AICompletionRequest): Promise<string> {
    let lastErr: unknown;
    for (const p of this.providers) {
      try {
        return await p.complete(request);
      } catch (err) {
        lastErr = err;
        console.warn(`[ai] provider ${p.name} failed, falling through to next:`, (err as Error).message);
      }
    }
    throw lastErr ?? new Error('No AI provider available');
  }
}

// ---------------------------------------------------------------------------
// Concurrency limiter: bound simultaneous in-flight calls; bursts queue.
// ---------------------------------------------------------------------------

class Semaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.waiters.shift()?.();
    }
  }
}

class ConcurrencyLimitedProvider implements AIProvider {
  public readonly name: string;
  public readonly describeImage?: (imageUrl: string, prompt: string) => Promise<string>;

  constructor(private readonly inner: AIProvider, private readonly sem: Semaphore) {
    this.name = inner.name;
    if (inner.describeImage) {
      const fn = inner.describeImage.bind(inner);
      this.describeImage = (imageUrl, prompt) => this.sem.run(() => fn(imageUrl, prompt));
    }
  }

  complete(request: AICompletionRequest): Promise<string> {
    return this.sem.run(() => this.inner.complete(request));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let cachedProvider: AIProvider | null = null;

/**
 * Build the active provider: a concurrency-limited cascade of whichever real
 * providers have keys configured, always terminating in the deterministic mock.
 * Cached for the process lifetime.
 */
export const getAIProvider = (): AIProvider => {
  if (cachedProvider) return cachedProvider;

  const chain: AIProvider[] = [];
  if (process.env.GEMINI_API_KEY) chain.push(new GeminiProvider(process.env.GEMINI_API_KEY));
  if (process.env.ANTHROPIC_API_KEY) chain.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
  if (process.env.OPENAI_API_KEY) chain.push(new OpenAIProvider(process.env.OPENAI_API_KEY));
  chain.push(new MockProvider()); // always the safety net

  const base = chain.length === 1 ? chain[0] : new CascadeProvider(chain);
  cachedProvider = new ConcurrencyLimitedProvider(base, new Semaphore(AI_MAX_CONCURRENCY));

  console.log(
    `[ai] provider chain: ${chain.map((p) => p.name).join(' -> ')} (max concurrency ${AI_MAX_CONCURRENCY})`
  );
  return cachedProvider;
};

// Test hook: force re-selection of the provider (e.g. after changing env).
export const __resetAIProvider = (): void => {
  cachedProvider = null;
};
