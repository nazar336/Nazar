// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      animationsOn: true,
      notifications: [
        { id: 'n1', text: 'New task', read: false, timestamp: '2025-01-01T10:00:00Z' },
      ],
      activeRoomTier: 1,
    },
    currentUser: { id: 1, name: 'Test', username: 'test' },
    isGuest: false,
    currentPage: 'dashboard',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  syncProfile: vi.fn(),
}));

vi.mock('../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  setLang: vi.fn(),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../js/utils.js', () => ({
  esc: vi.fn((s) => s || ''),
  fmtAgo: vi.fn(() => '1h ago'),
  renderAnimatedBrandLayer: vi.fn(() => '<div class="brand-layer"></div>'),
  updateNotifBadge: vi.fn(),
}));

vi.mock('../../js/router.js', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
  doLogout: vi.fn(),
}));

vi.mock('../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderShell, toggleNotif } from '../../js/shell.js';
import { appState, syncProfile } from '../../js/state.js';
import { navigate } from '../../js/router.js';
import { renderAuth, doLogout } from '../../js/pages/auth.js';
import { delegate } from '../../js/event-delegation.js';
import { updateNotifBadge } from '../../js/utils.js';

/* ── helpers ──────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"></div><div id="toastRoot"></div>';

  // Reset appState
  appState.currentUser = { id: 1, name: 'Test', username: 'test' };
  appState.isGuest = false;
  appState.currentPage = 'dashboard';
  appState.notifOpen = false;
  appState.S.lang = 'EN';
  appState.S.animationsOn = true;
  appState.S.notifications = [
    { id: 'n1', text: 'New task', read: false, timestamp: '2025-01-01T10:00:00Z' },
  ];
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderShell', () => {
  it('renders the app shell with sidebar', () => {
    renderShell();
    expect(document.querySelector('.shell')).toBeTruthy();
    expect(document.querySelector('.sidebar')).toBeTruthy();
    expect(document.querySelector('.sidebar-nav')).toBeTruthy();
  });

  it('creates navigation buttons for all pages', () => {
    renderShell();
    const navBtns = document.querySelectorAll('.nav-btn');
    expect(navBtns.length).toBeGreaterThanOrEqual(10);
    // Check some key pages
    const pages = Array.from(navBtns).map(b => b.dataset.page);
    expect(pages).toContain('dashboard');
    expect(pages).toContain('tasks');
    expect(pages).toContain('profile');
    expect(pages).toContain('wallet');
    expect(pages).toContain('leaderboard');
    expect(pages).toContain('dm');
  });

  it('shows user avatar and name in sidebar', () => {
    renderShell();
    const sidebar = document.querySelector('.sidebar-user');
    expect(sidebar).toBeTruthy();
    expect(sidebar.innerHTML).toContain('Test');
    expect(sidebar.innerHTML).toContain('@test');
    expect(sidebar.querySelector('.user-av')).toBeTruthy();
  });

  it('has notification toggle button', () => {
    renderShell();
    const btn = document.getElementById('notifToggle');
    expect(btn).toBeTruthy();
    expect(btn.innerHTML).toContain('●');
  });

  it('has fullscreen button', () => {
    renderShell();
    const btn = document.getElementById('fullscreenBtn');
    expect(btn).toBeTruthy();
    expect(btn.innerHTML).toContain('⛶');
  });

  it('has language toggle button', () => {
    renderShell();
    const btn = document.getElementById('langToggleBtn');
    expect(btn).toBeTruthy();
    expect(btn.innerHTML).toContain('EN');
  });

  it('has logout button for authenticated user', () => {
    renderShell();
    const btn = document.getElementById('logoutBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('logout');
    expect(document.getElementById('guestLoginBtn')).toBeFalsy();
  });

  it('has login button for guest', () => {
    appState.isGuest = true;
    appState.currentUser = null;
    renderShell();
    const btn = document.getElementById('guestLoginBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('login');
    expect(document.getElementById('logoutBtn')).toBeFalsy();
  });

  it('shows guest mode banner for guest', () => {
    appState.isGuest = true;
    appState.currentUser = null;
    renderShell();
    expect(document.getElementById('app').innerHTML).toContain('guestMode');
    expect(document.getElementById('app').innerHTML).toContain('welcomeGuestDesc');
    const createBtn = document.getElementById('guestCreateBtn');
    expect(createBtn).toBeTruthy();
    expect(createBtn.textContent).toContain('createAccount');
  });

  it('toggleNotif toggles notification panel open/close', () => {
    renderShell();
    const panel = document.getElementById('notifPanel');
    expect(panel).toBeTruthy();
    expect(panel.classList.contains('open')).toBe(false);
    expect(appState.notifOpen).toBe(false);

    toggleNotif();
    expect(appState.notifOpen).toBe(true);
    expect(panel.classList.contains('open')).toBe(true);
    expect(panel.getAttribute('aria-hidden')).toBe('false');

    toggleNotif();
    expect(appState.notifOpen).toBe(false);
    expect(panel.classList.contains('open')).toBe(false);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('navigation buttons call navigate with correct page via delegate', () => {
    renderShell();
    // delegate is used for [data-page] buttons
    expect(delegate).toHaveBeenCalled();
    const navDelegateCalls = delegate.mock.calls.filter(c => c[2] === '[data-page]');
    expect(navDelegateCalls.length).toBeGreaterThan(0);
    // Simulate clicking a nav button through the delegate callback
    const callback = navDelegateCalls[0][3];
    callback({}, { dataset: { page: 'tasks' } });
    expect(navigate).toHaveBeenCalledWith('tasks');
  });

  it('has mobile navigation bar', () => {
    renderShell();
    expect(document.querySelector('.mobile-nav')).toBeTruthy();
    const mobBtns = document.querySelectorAll('.mob-btn');
    expect(mobBtns.length).toBeGreaterThanOrEqual(5);
    const mobPages = Array.from(mobBtns).map(b => b.dataset.page);
    expect(mobPages).toContain('dashboard');
    expect(mobPages).toContain('tasks');
    expect(mobPages).toContain('profile');
  });

  it('calls syncProfile for authenticated user', () => {
    renderShell();
    expect(syncProfile).toHaveBeenCalled();
  });

  it('guest login button calls renderAuth', () => {
    appState.isGuest = true;
    appState.currentUser = null;
    renderShell();
    document.getElementById('guestLoginBtn').click();
    expect(renderAuth).toHaveBeenCalledWith('login');
  });

  it('logout button calls doLogout', () => {
    renderShell();
    document.getElementById('logoutBtn').click();
    expect(doLogout).toHaveBeenCalled();
  });

  it('shows notification items in panel', () => {
    renderShell();
    const panel = document.getElementById('notifPanel');
    expect(panel.innerHTML).toContain('New task');
    expect(panel.querySelector('.notif-item.unread')).toBeTruthy();
  });
});
