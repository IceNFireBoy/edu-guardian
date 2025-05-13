// backend/src/utils/__mocks__/extractTextFromFile.ts
const mockExtractTextFromFile = jest.fn();

// Default mock implementation
mockExtractTextFromFile.mockResolvedValue('Extracted text content from file.');

export { mockExtractTextFromFile }; // Named export for direct import in tests if needed

// For Jest automocking to work when `import { extractTextFromFile } from '../utils/extractTextFromFile';` is used,
// the module needs to export what the original module exports.
// If the original uses `export default`, then this should too.
// If the original uses `export const extractTextFromFile = ...`, then this mock needs to match.
// Assuming original is: export const extractTextFromFile = async (...) => { ... }
// Or: export default async function extractTextFromFile(...) { ... }
// Let's assume it's a named export for now based on typical util structure.

// To ensure Jest picks this up correctly for: import { extractTextFromFile } from '../../utils/extractTextFromFile';
// The module itself should be mocked as if it was the original.
// So, if original is `export const extractTextFromFile = ...`
// this file (the mock) should effectively do `export const extractTextFromFile = jest.fn()`

// Let's restructure to be more robust for automocking:
const actualMock = jest.fn().mockResolvedValue('Extracted text content from file.');

export const extractTextFromFile = actualMock; 