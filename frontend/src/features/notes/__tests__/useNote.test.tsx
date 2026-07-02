import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../api/notes', () => ({
  callAuthenticatedApi: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

import { useNote } from '../useNote';
import { callAuthenticatedApi } from '../../../api/notes';

const apiMock = callAuthenticatedApi as unknown as ReturnType<typeof vi.fn>;

const note = (id: string) => ({ _id: id, title: `Note ${id}`, subject: 'Biology' });

describe('useNote.fetchNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // fetchNotes caches per-filter in localStorage
  });

  it('normalizes the backend list shape into { data, count, totalPages, currentPage }', async () => {
    apiMock.mockResolvedValue({
      success: true,
      data: [note('a'), note('b')],
      count: 2,
      totalPages: 3,
      currentPage: 1,
    });

    const { result } = renderHook(() => useNote());
    let res: any;
    await act(async () => {
      res = await result.current.fetchNotes({ subject: 'Biology' });
    });

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.count).toBe(2);
    expect(res.totalPages).toBe(3);
    expect(res.currentPage).toBe(1);
  });

  it('serves the second identical request from the localStorage cache', async () => {
    apiMock.mockResolvedValue({ success: true, data: [note('a')], count: 1 });

    const { result } = renderHook(() => useNote());
    await act(async () => {
      await result.current.fetchNotes({ subject: 'Chemistry' });
      await result.current.fetchNotes({ subject: 'Chemistry' });
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  it('returns the empty fallback shape on API failure instead of throwing', async () => {
    apiMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useNote());
    let res: any;
    await act(async () => {
      res = await result.current.fetchNotes({ subject: 'Physics' });
    });

    expect(res).toEqual({ data: [], count: 0, totalPages: 0, currentPage: 0 });
  });
});
