import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock factories are hoisted — no external references allowed
vi.mock('../../js/state.js', () => ({
  appState: { csrfToken: null, S: { lang: 'EN' } },
}));

vi.mock('../../js/utils.js', () => ({
  toast: vi.fn(),
}));

vi.mock('../../js/i18n.js', () => ({
  t: (key) => {
    const map = {
      sessionExpired: 'Session expired',
      requestTimeout: 'Request timed out',
      networkError: 'Network error',
    };
    return map[key] || key;
  },
}));

import { apiFetch } from '../../js/api.js';
import { appState } from '../../js/state.js';
import { toast } from '../../js/utils.js';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appState.csrfToken = null;
    globalThis.fetch = vi.fn();
  });

  it('successful fetch returns ok:true with data', async () => {
    const body = { success: true, items: [1, 2] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    });

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(body);
    expect(result.status).toBe(200);
  });

  it('includes CSRF token in headers when set', async () => {
    appState.csrfToken = 'tok-abc';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiFetch('/api/test');

    const callHeaders = globalThis.fetch.mock.calls[0][1].headers;
    expect(callHeaders['X-CSRF-Token']).toBe('tok-abc');
    expect(callHeaders['Content-Type']).toBe('application/json');
  });

  it('does not include X-CSRF-Token header when csrfToken is null', async () => {
    appState.csrfToken = null;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiFetch('/api/test');

    const callHeaders = globalThis.fetch.mock.calls[0][1].headers;
    expect(callHeaders['X-CSRF-Token']).toBeUndefined();
  });

  it('401 response triggers session expired toast', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ success: false, message: 'Unauthorized' }),
    });

    const result = await apiFetch('/api/test');

    expect(toast).toHaveBeenCalledWith('Session expired', 'error');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('JSON parse error returns server error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
    expect(result.data.message).toBe('Server error.');
  });

  it('network error returns proper error object', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
    expect(result.data.message).toBe('Network error');
    expect(result.status).toBe(0);
    expect(toast).toHaveBeenCalledWith('Network error', 'error');
  });

  it('AbortError (timeout) returns proper error', async () => {
    const abortErr = new DOMException('The operation was aborted.', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr);

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
    expect(result.data.message).toBe('Request timed out');
    expect(result.status).toBe(0);
    expect(toast).toHaveBeenCalledWith('Request timed out', 'error');
  });

  it('custom timeout option is respected', async () => {
    vi.useFakeTimers();
    let fetchSignal;
    globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
      fetchSignal = opts.signal;
      return new Promise(() => {}); // never resolves
    });

    apiFetch('/api/test', { timeout: 500 });

    expect(fetchSignal.aborted).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fetchSignal.aborted).toBe(true);

    vi.useRealTimers();
  });

  it('ok is false when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
  });

  it('ok is false when data.success is false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: false, message: 'Validation failed' }),
    });

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
  });
});
