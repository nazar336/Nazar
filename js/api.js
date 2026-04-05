'use strict';

import { appState } from './state.js';
import { toast } from './utils.js';
import { t } from './i18n.js';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;

function isGetRequest(opts) {
  return !opts.method || (typeof opts.method === 'string' && opts.method.toUpperCase() === 'GET');
}

function showToast(msg, type, silent) {
  if (!silent) toast(msg, type);
}

export async function apiFetch(url, opts = {}) {
  const silent = !!opts.silent;
  const maxAttempts = isGetRequest(opts) ? MAX_RETRIES + 1 : 1;
  let lastErr;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Exponential backoff before retry
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt - 1)));
    }

    const headers = { 'Content-Type': 'application/json' };
    if (appState.csrfToken) {
      headers['X-CSRF-Token'] = appState.csrfToken;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeout || DEFAULT_TIMEOUT);

    try {
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers,
        signal: controller.signal,
        ...opts,
      });
      clearTimeout(timeout);

      // Update CSRF token from response header if present
      const newToken = res.headers?.get?.('X-CSRF-Token');
      if (newToken) appState.csrfToken = newToken;

      const data = await res.json().catch(() => ({ success: false, message: 'Server error.' }));

      if (!res.ok && res.status === 401) {
        showToast(t('sessionExpired') || 'Session expired', 'error', silent);
      }

      return { ok: res.ok && data.success, data, status: res.status };
    } catch (err) {
      clearTimeout(timeout);

      // AbortError (timeout) — don't retry
      if (err.name === 'AbortError') {
        showToast(t('requestTimeout') || 'Request timed out', 'error', silent);
        return { ok: false, data: { success: false, message: 'Request timed out' }, status: 0 };
      }

      lastErr = err;
      // Retry on network errors for GET requests (loop continues)
    }
  }

  // All retries exhausted — network error
  showToast(t('networkError') || 'Network error', 'error', silent);
  return { ok: false, data: { success: false, message: 'Network error' }, status: 0 };
}
