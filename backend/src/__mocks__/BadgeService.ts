// backend/src/__mocks__/BadgeService.ts

export const mockCheckAndAwardBadges = jest.fn();

const mockBadgeServiceInstance = {
  checkAndAwardBadges: mockCheckAndAwardBadges,
  // Add other BadgeService methods here if they are called and need mocking
  // e.g., getAllActiveBadges: jest.fn(),
};

// This will mock the default export of BadgeService (which is an instance)
const MockBadgeService = jest.fn(() => mockBadgeServiceInstance);
(MockBadgeService as any).prototype.checkAndAwardBadges = mockCheckAndAwardBadges;

// Reset helper
(MockBadgeService as any)._resetMocks = () => {
  mockCheckAndAwardBadges.mockReset();
  // Reset other method mocks if added
};

// Default implementation
(MockBadgeService as any)._setDefaultResponses = () => {
  mockCheckAndAwardBadges.mockResolvedValue([]); // Default to no new badges awarded
};

(MockBadgeService as any)._setDefaultResponses();

// To mock: import BadgeService from './BadgeService'; (assuming it's a default export of the instance)
// The NoteService imports `import BadgeService from './BadgeService';` which means it imports the instance.
// So the mock should replicate this structure.

// If BadgeService is `export default new BadgeService()`, then we mock that instance.
// If BadgeService is `export class BadgeService {...}` and NoteService does `new BadgeService()`, then we mock the class.
// Based on `import BadgeService from './BadgeService';` and `import userService from './UserService';` (which is `export default new UserService()`),
// it's highly likely BadgeService also `export default new BadgeService()`.

// Therefore, we need to mock the instance properties.
export default mockBadgeServiceInstance;
