'use strict';

import { appState, saveState } from './state.js';
import { t } from './i18n.js';

export const uid = () => Math.random().toString(36).slice(2, 9);

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

export function fmtDate(s) {
  if (!s) return '—';
  const loc = { UA: 'uk-UA', EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', PL: 'pl-PL' }[appState.S.lang] || 'uk-UA';
  return new Date(s).toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(s) {
  if (!s) return '';
  const loc = { UA: 'uk-UA', EN: 'en-US', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', PL: 'pl-PL' }[appState.S.lang] || 'uk-UA';
  return new Date(s).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

export function fmtAgo(s) {
  const diff = Math.floor((Date.now() - new Date(s)) / 60000);
  if (diff < 1) return t('justNow');
  if (diff < 60) return diff + t('minsAgo');
  if (diff < 1440) return Math.floor(diff / 60) + t('hoursAgo');
  return Math.floor(diff / 1440) + t('daysAgo');
}

export function renderAnimatedBrandLayer(scope = 'default') {
  return `
    <div class="brand-sprites brand-sprites-${scope}" aria-hidden="true">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-a">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-b">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-c">
    </div>`;
}

export function toast(msg, type = 'info') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${esc(msg)}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 300); }, 3200);
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
  if (badge) { badge.textContent = count || ''; badge.style.display = count ? 'flex' : 'none'; }
}
