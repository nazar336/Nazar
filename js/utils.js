'use strict';

import { appState, saveState } from './state.js';
import { t } from './i18n.js';

export const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(7);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
};

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

export function fmtDate(s) {
  if (!s) return '—';
  const loc = { UA: 'uk-UA', EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', PL: 'pl-PL' }[appState.S.lang] || 'en-US';
  return new Date(s).toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(s) {
  if (!s) return '';
  const loc = { UA: 'uk-UA', EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', PL: 'pl-PL' }[appState.S.lang] || 'en-US';
  return new Date(s).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

export function fmtAgo(s) {
  const diff = Math.floor((Date.now() - new Date(s)) / 60000);
  if (diff < 1) return t('justNow') || 'just now';
  if (diff < 60) return diff + (t('minsAgo') || 'm ago');
  if (diff < 1440) return Math.floor(diff / 60) + (t('hoursAgo') || 'h ago');
  return Math.floor(diff / 1440) + (t('daysAgo') || 'd ago');
}

export function renderAnimatedBrandLayer(scope = 'default') {
  return `
    <div class="brand-sprites brand-sprites-${scope}" aria-hidden="true">
      <img src="assets/lolanceizi-logo.svg" alt="" class="brand-sprite sprite-a">
      <img src="assets/lolanceizi-logo.svg" alt="" class="brand-sprite sprite-b">
      <img src="assets/lolanceizi-logo.svg" alt="" class="brand-sprite sprite-c">
    </div>`;
}

const MAX_VISIBLE_TOASTS = 3;
const TOAST_DEDUP_MS = 2000;
let _lastToastMsg = '';
let _lastToastTime = 0;

export function toast(msg, type = 'info') {
  const root = document.getElementById('toastRoot');
  if (!root) return;

  // Deduplicate: skip if same message was shown recently
  const now = Date.now();
  if (msg === _lastToastMsg && now - _lastToastTime < TOAST_DEDUP_MS) return;
  _lastToastMsg = msg;
  _lastToastTime = now;

  // Enforce max visible toasts — remove oldest if at limit
  const visible = root.querySelectorAll('.toast:not(.hiding)');
  if (visible.length >= MAX_VISIBLE_TOASTS) {
    const oldest = visible[0];
    oldest.classList.add('hiding');
    setTimeout(() => oldest.remove(), 300);
  }

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${esc(msg)}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 300); }, 3200);
}

// Expose for testing/reset
export function _resetToastState() {
  _lastToastMsg = '';
  _lastToastTime = 0;
}

export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit) {
  let waiting = false;
  let lastArgs = null;
  return function (...args) {
    if (!waiting) {
      fn.apply(this, args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
        if (lastArgs) { fn.apply(this, lastArgs); lastArgs = null; }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  const num = Number(n);
  const abs = Math.abs(num);
  if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

export function showAlert(id, msg, type = 'error') {
  const e = document.getElementById(id);
  if (e) { e.className = `alert alert-${type} show`; e.textContent = msg; }
}

export function hideAlert(id) {
  const e = document.getElementById(id);
  if (e) e.className = 'alert';
}

export function setLoading(btn, state) {
  if (!btn) return;
  if (state) {
    btn.dataset.o = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-txt">${btn.dataset.o}</span>`;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    if (btn.dataset.o) btn.innerHTML = btn.dataset.o;
  }
}

export function addNotif(text, type = 'info') {
  appState.S.notifications.unshift({ id: uid(), text, type, read: false, timestamp: new Date().toISOString() });
  saveState();
  updateNotifBadge();
}

export function updateNotifBadge() {
  const count = appState.S.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) {
    badge.textContent = count || '';
    badge.style.display = count ? 'flex' : 'none';
    badge.setAttribute('aria-label', count ? count + ' notifications' : '');
  }
}
