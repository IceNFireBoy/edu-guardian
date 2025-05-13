const mockChatCompletionsCreate = jest.fn();

const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockChatCompletionsCreate,
    },
  },
  // Mock other OpenAI modules or methods if used elsewhere (e.g., embeddings, moderations)
}));

// Helper to reset the mock before each test (optional, can be done in setupTests.ts or test files)
(mockOpenAI as any)._resetMocks = () => {
  mockChatCompletionsCreate.mockReset();
};

// Helper to set a specific resolved value for chat.completions.create
(mockOpenAI as any)._setChatCompletionsCreateResponse = (response: any) => {
  mockChatCompletionsCreate.mockResolvedValue(response);
};

// Default mock response for chat completions (can be overridden in tests)
(mockOpenAI as any)._setDefaultChatCompletionsCreateResponse = () => {
  mockChatCompletionsCreate.mockResolvedValue({
    id: 'chatcmpl-mockId',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-3.5-turbo-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({ summary: 'Mocked AI summary.', keyPoints: ['Mocked point 1'] }),
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  });
};

(mockOpenAI as any)._setDefaultChatCompletionsCreateResponse(); // Set default response initially

export default mockOpenAI; 