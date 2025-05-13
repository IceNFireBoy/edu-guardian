import { http, HttpResponse } from 'msw';

// Define your API base URL, e.g., from an environment variable or config
// const API_BASE_URL = process.env.VITE_API_URL || '/api/v1'; // Vite uses VITE_ prefix for env vars
// For tests, it's often simpler to use relative paths if your proxy is set up or absolute if needed.

export const handlers = [
  // Example: Mocking a GET request to /api/v1/user/profile
  // http.get(`${API_BASE_URL}/auth/profile`, (resolver) => {
  //   return HttpResponse.json(
  //     {
  //       _id: 'mockUserId',
  //       name: 'Mock User',
  //       email: 'mock@example.com',
  //       // ... other user properties
  //     },
  //     { status: 200 }
  //   );
  // }),

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
    console.warn(`[MSW] Captured an unhandled ${request.method} request to ${request.url}`);
    // You can return a standard error response, or let it fall through if your tests expect network errors.
    // return new HttpResponse(null, { status: 404 }); 
    // Returning nothing here will let it pass through to the network if not handled above,
    // which might be desired if you want to see if any real requests are accidentally made.
    // For strict mocking, always return an error or a mock response.
    return HttpResponse.json({ error: `Unhandled request to ${request.url}` }, { status: 501 }); // Not Implemented
  })
]; 