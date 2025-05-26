import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { mockNotes, mockUsers, mockBadges } from './data';

// Define your API base URL, e.g., from an environment variable or config
// const API_BASE_URL = process.env.VITE_API_URL || '/api/v1'; // Vite uses VITE_ prefix for env vars
// For tests, it's often simpler to use relative paths if your proxy is set up or absolute if needed.

export const handlers = [
  rest.get('/api/v1/notes', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockNotes }));
  }),

  rest.get('/api/v1/notes/:id', (req, res, ctx) => {
    const note = mockNotes.find(n => n._id === req.params.id);
    if (!note) {
      return res(ctx.status(404), ctx.json({ success: false, message: 'Note not found' }));
    }
    return res(ctx.json({ success: true, data: note }));
  }),

  rest.post('/api/v1/notes', async (req, res, ctx) => {
    const newNote = await req.json();
    return res(ctx.json({ success: true, data: { ...newNote, _id: 'new-id' } }));
  }),

  rest.put('/api/v1/notes/:id', async (req, res, ctx) => {
    const updatedNote = await req.json();
    return res(ctx.json({ success: true, data: updatedNote }));
  }),

  rest.delete('/api/v1/notes/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true, message: 'Note deleted successfully' }));
  }),

  rest.get('/api/v1/users', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockUsers }));
  }),

  rest.get('/api/v1/users/:id', (req, res, ctx) => {
    const user = mockUsers.find(u => u._id === req.params.id);
    if (!user) {
      return res(ctx.status(404), ctx.json({ success: false, message: 'User not found' }));
    }
    return res(ctx.json({ success: true, data: user }));
  }),

  rest.get('/api/v1/badges', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockBadges }));
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
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled request: ${req.method} ${req.url}`);
    return res(ctx.status(404), ctx.json({ success: false, message: 'Not found' }));
  })
];

export const server = setupServer(...handlers); 