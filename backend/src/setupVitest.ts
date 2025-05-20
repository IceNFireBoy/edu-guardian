// Set up Vitest to provide Jest-like functionality
import { vi } from 'vitest';

// Make vi available globally (like jest in the global scope)
// This allows tests to use jest.mock, jest.fn without errors
globalThis.jest = vi; 