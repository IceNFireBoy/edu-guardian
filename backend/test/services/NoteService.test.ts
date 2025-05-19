import { describe, test, expect } from 'vitest';
import { createNote } from '../../src/services/NoteService';
import { mockNoteData } from '../utils/mockNote';

describe('NoteService', () => {
  test('creates note with correct fields', async () => {
    const note = await createNote(mockNoteData());
    expect(note.title).toBeDefined();
    expect(note.subject).toMatch(/Math|Science|Filipino/);
  });

  test('rejects note with missing required fields', async () => {
    await expect(createNote({})).rejects.toThrow();
  });
});
