'use strict';

import { appState, loadState, loadPoints, saveState } from './state.js';
import { apiFetch } from './api.js';
import { API } from './constants.js';
import { initScroll, initHashRouting } from './router.js';
import { renderShell } from './shell.js';
import { renderLanding } from './pages/landing.js';
import { setLang, t } from './i18n.js';
import { startSync, stopSync } from './sync.js';

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
  loadState();

  // Sync document language with saved preference
  setLang(appState.S.lang);

  // Render landing immediately if no stored user (avoid waiting for API)
  if (!appState.currentUser) {
    renderLanding();
  } else {
    showLoadingSpinner();
  }

  // Check PHP session
  try {
    const { ok, data } = await apiFetch(API.session);
    if (ok && data.user) {
      // Only treat as logged-in user if NOT a guest
      if (data.user.is_guest) {
        appState.currentUser = null;
        appState.isGuest = true;
      } else {
        appState.currentUser = data.user;
        appState.isGuest = false;
      }
    }
    // Store CSRF token from session response
    if (data && data.csrf_token) {
      appState.csrfToken = data.csrf_token;
    }
  } catch (e) { /* no PHP available, render landing */ }

  if (appState.currentUser && !appState.isGuest) { renderShell(); startSync(); }
  else {
    // Check if user was in the middle of verification (page refresh recovery)
    let verifyState = null;
    try { const raw = localStorage.getItem('lolanceizi_verify'); if (raw) verifyState = JSON.parse(raw); } catch(e) {}
    
    if (verifyState && verifyState.userId && verifyState.email) {
      const { renderVerification } = await import('./pages/verify.js');
      renderVerification(verifyState.userId, verifyState.email);
    } else if (document.querySelector('.landing-page') === null) {
      renderLanding();
    }
  }

  if (appState.currentUser && !appState.isGuest) {
    // Record daily_visit, then load points once (daily_visit awards XP on server)
    await apiFetch(API.xp, { method: 'POST', body: JSON.stringify({ action: 'daily_visit' }) });
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

init().catch((err) => {
  console.error('Init error:', err);
  const app = document.getElementById('app');
  if (app && !app.innerHTML.trim()) {
    const msg = (typeof t === 'function' ? t('initError') : '') || 'Щось пішло не так. Перезавантажте сторінку.';
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:var(--danger,#ff6b6b);font-size:15px;text-align:center;padding:20px;gap:16px;">
      <div>${msg}</div>
      <button onclick="location.reload()" style="padding:8px 20px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font-size:14px;">🔄 ${(typeof t === 'function' ? t('refresh') : '') || 'Оновити'}</button>
    </div>`;
  }
});
