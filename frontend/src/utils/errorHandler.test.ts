import { describe, it, expect, vi, beforeEach } from 'vitest';

// errorHandler imports the named `toast` from react-hot-toast.
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { handleApiError, ErrorType } from './errorHandler';
import { toast } from 'react-hot-toast';

describe('handleApiError', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('maps HTTP 429 to the QUOTA type and surfaces the server message', () => {
    const result = handleApiError({
      response: { status: 429, data: { error: 'Daily summary limit reached (20/day).' } },
    });
    expect(result.type).toBe(ErrorType.QUOTA);
    expect(result.message).toBe('Daily summary limit reached (20/day).');
    expect(toast.error).toHaveBeenCalled();
  });

  it('falls back to a friendly rate-limit message when the server sends none', () => {
    const result = handleApiError({ response: { status: 429, data: {} } }, { showToast: false });
    expect(result.type).toBe(ErrorType.QUOTA);
    expect(result.message.toLowerCase()).toContain('too many requests');
  });

  it('still maps 401 to AUTHENTICATION', () => {
    const result = handleApiError({ response: { status: 401, data: {} } }, { showToast: false });
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
  });
});
