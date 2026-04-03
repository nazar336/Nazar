'use strict';

import { appState, loadState, loadPoints, saveState } from './state.js';
import { apiFetch } from './api.js';
import { API } from './constants.js';
import { initScroll } from './router.js';
import { renderShell } from './shell.js';
import { renderLanding } from './pages/landing.js';

async function init() {
  loadState();

  // Check PHP session
  try {
    const { ok, data } = await apiFetch(API.session);
    if (ok && data.user) {
      appState.currentUser = data.user;
      appState.isGuest = data.user.is_guest || false;
    }
  } catch (e) { /* no PHP available, render auth */ }

  if (appState.currentUser) { renderShell(); }
  else { renderLanding(); }

  if (appState.currentUser && !appState.isGuest) {
    await loadPoints();
    await apiFetch(API.xp, { method: 'POST', body: JSON.stringify({ action: 'daily_visit' }) });
    await loadPoints();
  }

  initScroll();
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

init();
