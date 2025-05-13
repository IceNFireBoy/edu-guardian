import '@testing-library/jest-dom/extend-expect';
import { server } from './mocks/server'; // Import the MSW server

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' })); // Warn on unhandled requests

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Optional: if you have global mocks or setup for specific libraries (e.g., mocking localStorage)
// beforeEach(() => {
//   // Example: Mock localStorage
//   const mockLocalStorage = (() => {
//     let store: { [key: string]: string } = {};
//     return {
//       getItem: (key: string) => store[key] || null,
//       setItem: (key: string, value: string) => {
//         store[key] = value.toString();
//       },
//       removeItem: (key: string) => {
//         delete store[key];
//       },
//       clear: () => {
//         store = {};
//       }
//     };
//   })();
//   Object.defineProperty(window, 'localStorage', {
//     value: mockLocalStorage
//   });
// }); 