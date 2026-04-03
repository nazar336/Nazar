'use strict';

import { appState } from './state.js';
import { toast } from './utils.js';
import { t } from './i18n.js';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export async function apiFetch(url, opts = {}) {
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

    const data = await res.json().catch(() => ({ success: false, message: 'Server error.' }));

    if (!res.ok && res.status === 401) {
      toast(t('sessionExpired') || 'Session expired', 'error');
    }

    return { ok: res.ok && data.success, data, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      toast(t('requestTimeout') || 'Request timed out', 'error');
      return { ok: false, data: { success: false, message: 'Request timed out' }, status: 0 };
    }
    toast(t('networkError') || 'Network error', 'error');
    return { ok: false, data: { success: false, message: 'Network error' }, status: 0 };
  }
}
