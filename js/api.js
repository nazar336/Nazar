'use strict';

import { appState } from './state.js';

export async function apiFetch(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (appState.csrfToken) {
    headers['X-CSRF-Token'] = appState.csrfToken;
  }
  const res = await fetch(url, { credentials: 'same-origin', headers, ...opts });
  const data = await res.json().catch(() => ({ success: false, message: 'Server error.' }));
  return { ok: res.ok && data.success, data };
}
