'use strict';

import { appState, saveState, syncProfile } from './state.js';
import { t } from './i18n.js';
import { esc, fmtAgo, renderAnimatedBrandLayer, updateNotifBadge } from './utils.js';
import { navigate } from './router.js';
import { renderAuth } from './pages/auth.js';
import { doLogout } from './pages/auth.js';
import { delegate } from './event-delegation.js';

export function renderShell() {
  if (!appState.currentUser && !appState.isGuest) { renderAuth(); return; }
  document.body.classList.toggle('animations-off', !appState.S.animationsOn);
  const navItems = [
    { page: 'dashboard', icon: '⚡', label: t('dashboard') },
    { page: 'tasks', icon: '📋', label: t('tasks') },
    { page: 'createTask', icon: '✚', label: t('createTask') },
    { page: 'feed', icon: '📡', label: t('feed') },
    { page: 'profile', icon: '👤', label: t('profile') },
    { page: 'wallet', icon: '💎', label: t('wallet') },
    { page: 'chat', icon: '💬', label: t('chat') },
    { page: 'support', icon: '🛟', label: t('support') },
    { page: 'leaderboard', icon: '🏆', label: t('leaderboard') },
    { page: 'miniGames', icon: '🎮', label: t('miniGames') },
  ];
  const mobItems = [
    { page: 'dashboard', icon: '⚡', label: t('dashboard') },
    { page: 'tasks', icon: '📋', label: t('tasks') },
    { page: 'profile', icon: '👤', label: t('profile') },
    { page: 'createTask', icon: '✚', label: t('createTask') },
    { page: 'wallet', icon: '💎', label: t('wallet') },
  ];
  const unreadCount = (appState.S.notifications || []).filter(n => !n.read).length;
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="scroll-progress" aria-hidden="true"><span id="scrollProgressBar"></span></div>
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">L</div>
          <div>
            <div class="logo-text">LOL<em>ance</em></div>
            <div class="logo-tag">${t('appTag')}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(n => `<button class="nav-btn${appState.currentPage === n.page ? ' active' : ''}" data-page="${n.page}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span></button>`).join('')}
        </nav>
        <div class="sidebar-user">
          ${appState.currentUser ? `
            <div class="user-av" aria-hidden="true">${(appState.currentUser.name || '?').charAt(0).toUpperCase()}</div>
            <div><div class="user-name">${esc(appState.currentUser.name || appState.currentUser.username)}</div><div class="user-handle">@${esc(appState.currentUser.username)}</div></div>
          ` : `
            <div class="user-av" aria-hidden="true">🎭</div>
            <div><div class="user-name">${t('guest')}</div><div class="user-handle">@guest</div></div>
          `}
        </div>
      </aside>
      <div class="main-wrap">
        ${renderAnimatedBrandLayer('shell')}
        <header class="topbar" role="banner">
          <div><div class="topbar-title" id="topbarTitle">${t('dashboard')}</div></div>
          <div class="topbar-right">
            <div id="notifPanel" class="notif-panel" aria-hidden="true"></div>
            <button class="btn btn-ghost btn-sm btn-icon" id="notifToggle" aria-label="${t('notifications')}" aria-haspopup="true" aria-expanded="false" style="position:relative;">
              🔔<span class="nav-badge" id="notifBadge" style="position:absolute;top:2px;right:2px;display:${unreadCount ? 'flex' : 'none'};font-size:9px;min-width:14px;height:14px;">${unreadCount || ''}</span>
            </button>
            <select id="langToggle" class="btn btn-ghost btn-sm" style="padding:7px 10px;font-size:13px;border-radius:var(--r-sm);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);cursor:pointer;">
              <option value="UA" ${appState.S.lang === 'UA' ? 'selected' : ''}>🇺🇦 Українська</option>
              <option value="EN" ${appState.S.lang === 'EN' ? 'selected' : ''}>🇬🇧 English</option>
              <option value="DE" ${appState.S.lang === 'DE' ? 'selected' : ''}>🇩🇪 Deutsch</option>
              <option value="FR" ${appState.S.lang === 'FR' ? 'selected' : ''}>🇫🇷 Français</option>
              <option value="ES" ${appState.S.lang === 'ES' ? 'selected' : ''}>🇪🇸 Español</option>
              <option value="PL" ${appState.S.lang === 'PL' ? 'selected' : ''}>🇵🇱 Polski</option>
            </select>
            ${appState.isGuest ? `<button class="btn btn-primary btn-sm" id="guestLoginBtn">${t('login')}</button>` : `<button class="btn btn-danger btn-sm" id="logoutBtn">${t('logout')}</button>`}
          </div>
        </header>
        ${appState.isGuest ? `<div style="background:linear-gradient(90deg,rgba(184,255,92,.05),rgba(125,215,255,.05));border-bottom:1px solid rgba(184,255,92,.1);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;"><span>🎭 ${t('guestMode')} — ${t('welcomeGuestDesc')}</span><button class="btn btn-primary btn-xs" id="guestCreateBtn">${t('createAccount')}</button></div>` : ''}
        <main class="main-content" id="mainContent" tabindex="-1"></main>
      </div>
      <nav class="mobile-nav" aria-label="Mobile navigation">
        <div class="mobile-nav-inner">
          ${mobItems.map(n => `<button class="mob-btn${appState.currentPage === n.page ? ' active' : ''}" data-page="${n.page}" aria-label="${n.label}"><span class="icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></button>`).join('')}
        </div>
      </nav>
    </div>`;

  const np = document.getElementById('notifPanel');
  if (np) {
    np.innerHTML = `
      <div class="notif-head"><h4>${t('notifications')}</h4><button class="btn btn-ghost btn-xs" id="markReadBtn">${t('markRead')}</button></div>
      <div class="notif-list">${appState.S.notifications.length ? appState.S.notifications.map(n => `<div class="notif-item${n.read ? '' : ' unread'}"><div>${esc(n.text)}</div><div class="notif-time">${fmtAgo(n.timestamp)}</div></div>`).join('') : `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">${t('noNotifications')}</div>`}</div>`;
  }

  // Use event delegation for [data-page] navigation buttons
  delegate(app, 'click', '[data-page]', (e, btn) => navigate(btn.dataset.page));

  if (appState.isGuest) {
    document.getElementById('guestLoginBtn')?.addEventListener('click', () => renderAuth('login'));
    document.getElementById('guestCreateBtn')?.addEventListener('click', () => renderAuth('register'));
  } else {
    document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
  }
  document.getElementById('langToggle')?.addEventListener('change', e => { appState.S.lang = e.target.value; saveState(); renderShell(); navigate(appState.currentPage); });
  document.getElementById('notifToggle')?.addEventListener('click', toggleNotif);
  document.getElementById('markReadBtn')?.addEventListener('click', () => { appState.S.notifications.forEach(n => n.read = true); saveState(); updateNotifBadge(); renderShell(); navigate(appState.currentPage); });

  if (appState.currentUser && !appState.isGuest) syncProfile();

  navigate(appState.currentPage);
  updateNotifBadge();
}

export function toggleNotif() {
  appState.notifOpen = !appState.notifOpen;
  const p = document.getElementById('notifPanel');
  const btn = document.getElementById('notifToggle');
  if (p) { p.classList.toggle('open', appState.notifOpen); p.setAttribute('aria-hidden', String(!appState.notifOpen)); }
  if (btn) btn.setAttribute('aria-expanded', String(appState.notifOpen));
}
