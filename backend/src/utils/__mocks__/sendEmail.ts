// backend/src/utils/__mocks__/sendEmail.ts
const mockSendEmail = jest.fn();

// Default mock implementation (resolves successfully)
mockSendEmail.mockResolvedValue(undefined);

export default mockSendEmail; 