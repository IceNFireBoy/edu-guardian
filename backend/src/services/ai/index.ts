import axios from 'axios';
import { AICompletionRequest, AIProvider } from './AIProvider';
import { AI_DEFAULT_MODEL } from '../../config/aiConfig';
import MockProvider from './MockProvider';

/**
 * Real providers are implemented directly over the REST APIs (via the axios
 * dependency we already have) rather than pulling in a vendor SDK. This keeps
 * the dependency surface small while still supporting Anthropic and OpenAI.
 */

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
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return res.data?.choices?.[0]?.message?.content ?? '';
  }
}

let cachedProvider: AIProvider | null = null;

/**
 * Returns the active AI provider, chosen by which API key is configured:
 * Anthropic → OpenAI → deterministic mock. Cached for the process lifetime.
 */
export const getAIProvider = (): AIProvider => {
  if (cachedProvider) return cachedProvider;

  if (process.env.ANTHROPIC_API_KEY) {
    cachedProvider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  } else if (process.env.OPENAI_API_KEY) {
    cachedProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
  } else {
    cachedProvider = new MockProvider();
  }

  console.log(`[ai] Using "${cachedProvider.name}" provider`);
  return cachedProvider;
};

// Test hook: force re-selection of the provider (e.g. after changing env).
export const __resetAIProvider = (): void => {
  cachedProvider = null;
};
