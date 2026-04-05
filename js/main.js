'use strict';

import { appState, loadState, loadPoints, saveState } from './state.js';
import { apiFetch } from './api.js';
import { API } from './constants.js';
import { initScroll, initHashRouting } from './router.js';
import { renderShell } from './shell.js';
import { renderLanding } from './pages/landing.js';

function showLoadingSpinner() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;">
      <div class="app-spinner" aria-label="Loading" style="width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:var(--accent,#b8ff5c);border-radius:50%;animation:spin .7s linear infinite;"></div>
    </div>`;
  }
}

// Global handler for uncaught promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

async function init() {
  showLoadingSpinner();
  loadState();

  // Check PHP session
  try {
    const { ok, data } = await apiFetch(API.session);
    if (ok && data.user) {
      appState.currentUser = data.user;
      appState.isGuest = data.user.is_guest || false;
    }
    // Store CSRF token from session response
    if (data && data.csrf_token) {
      appState.csrfToken = data.csrf_token;
    }
  } catch (e) { /* no PHP available, render auth */ }

  if (appState.currentUser) { renderShell(); }
  else { renderLanding(); }

  if (appState.currentUser && !appState.isGuest) {
    // Load daily_visit and points in parallel
    await Promise.all([
      apiFetch(API.xp, { method: 'POST', body: JSON.stringify({ action: 'daily_visit' }) }),
      loadPoints(),
    ]);
    // Refresh points after daily_visit has been recorded
    await loadPoints();
  }

  initScroll();
  initHashRouting();
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

init();
