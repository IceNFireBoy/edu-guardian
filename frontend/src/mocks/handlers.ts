import { http, HttpResponse } from 'msw';

// Define your API base URL, e.g., from an environment variable or config
// const API_BASE_URL = process.env.VITE_API_URL || '/api/v1'; // Vite uses VITE_ prefix for env vars
// For tests, it's often simpler to use relative paths if your proxy is set up or absolute if needed.

export const handlers = [
  http.get('/api/v1/auth/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        xp: 100,
        level: 2,
        streak: { current: 3, max: 5, lastUsed: new Date().toISOString() },
        aiUsage: { summaryUsed: 1, flashcardUsed: 2, lastReset: new Date().toISOString() },
        profileImage: 'no-photo.jpg',
        biography: 'Test bio',
        preferences: { darkMode: false, emailNotifications: true },
        badges: [],
        activity: [],
        subjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
        favoriteNotes: [],
        totalSummariesGenerated: 1,
        totalFlashcardsGenerated: 2
      }
    });
  }),

  // TODO: Add more handlers here as you test components that make API calls.
  // Example for a POST request
  // http.post(`${API_BASE_URL}/notes`, async ({ request }) => {
  //   const newNote = await request.json();
  //   return HttpResponse.json(
  //     {
  //       _id: `mockNoteId_${Date.now()}`,
  //       ...newNote,
  //       user: 'mockUserId',
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString(),
  //     },
  //     { status: 201 } // 201 Created
  //   );
  // }),

  // Handler to catch unhandled requests during tests to prevent them from going to the actual network
  // This should generally be the last handler.
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  })
]; 