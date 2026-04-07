// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: { lang: 'EN', balance: 0, notifications: [] },
    currentUser: null,
    isGuest: false,
    currentPage: 'auth',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  setLang: vi.fn(),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: {} })),
}));

vi.mock('../../../js/utils.js', () => ({
  renderAnimatedBrandLayer: vi.fn(() => '<div class="brand-layer"></div>'),
  toast: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  setLoading: vi.fn(),
}));

vi.mock('../../../js/constants.js', () => ({
  STORAGE_KEY: 'lolanceizi_state_v5',
  API: {
    session: 'api/session.php',
    login: 'api/login.php',
    register: 'api/register.php',
    verify: 'api/verify.php',
    logout: 'api/logout.php',
    profile: 'api/profile.php',
    tasks: 'api/tasks.php',
    wallet: 'api/wallet.php',
    messages: 'api/messages.php',
    leaderboard: 'api/leaderboard.php',
    takeTask: 'api/take-task.php',
    completeTask: 'api/complete-task.php',
    cryptoDeposit: 'api/crypto-deposit.php',
    cryptoWithdraw: 'api/crypto-withdraw.php',
    coins: 'api/coins.php',
    xp: 'api/xp.php',
    chatRooms: 'api/chat-rooms.php',
    support: 'api/support.php',
    feed: 'api/feed.php',
    miniGames: 'api/mini-games.php',
  },
  CATEGORIES: ['Design','Video','Copy','Social','Community','QA','Localization','Product','Development','Marketing'],
  LEVEL_PRIVILEGES: {},
  getLvlPriv: () => ({ maxTasks: 10, canCreate: true, maxReward: 5000, feedMedia: 'image', takeDiff: ['easy','medium'], badge: '🛠', titleKey: 'lvlCreator' }),
  feedMediaLabel: (m) => m,
  diffLabel: (a) => (a || []).join(','),
}));

vi.mock('../../../js/shell.js', () => ({
  renderShell: vi.fn(),
}));

vi.mock('../../../js/pages/verify.js', () => ({
  renderVerification: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderAuth, handleLogin, handleRegister, doLogout } from '../../../js/pages/auth.js';
import { appState, saveState } from '../../../js/state.js';
import { apiFetch } from '../../../js/api.js';
import { toast, showAlert, hideAlert, setLoading } from '../../../js/utils.js';
import { renderShell } from '../../../js/shell.js';
import { renderVerification } from '../../../js/pages/verify.js';

/* ── helpers ──────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"></div><div id="toastRoot"></div>';
  appState.currentUser = null;
  appState.isGuest = false;
  appState.S = { lang: 'EN', balance: 0, notifications: [] };
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderAuth ────────────────────────────────────────────────── */

describe('renderAuth', () => {
  it('renders login form by default', () => {
    renderAuth();
    expect(document.querySelector('#loginForm')).not.toBeNull();
  });

  it('renders register form when mode is register', () => {
    renderAuth('register');
    expect(document.querySelector('#registerForm')).not.toBeNull();
  });

  it('has login and register tab buttons', () => {
    renderAuth();
    expect(document.querySelector('#tabLogin')).not.toBeNull();
    expect(document.querySelector('#tabRegister')).not.toBeNull();
  });

  it('has language selector', () => {
    renderAuth();
    expect(document.querySelector('#authLangSelector')).not.toBeNull();
  });

  it('login form has email and password inputs', () => {
    renderAuth('login');
    const form = document.querySelector('#loginForm');
    expect(form.querySelector('input[type="email"]')).not.toBeNull();
    expect(form.querySelector('input[type="password"]')).not.toBeNull();
  });

  it('register form has name, username, email, password and terms checkbox', () => {
    renderAuth('register');
    const form = document.querySelector('#registerForm');
    expect(form.querySelector('#regName')).not.toBeNull();
    expect(form.querySelector('#regUser')).not.toBeNull();
    expect(form.querySelector('#regEmail')).not.toBeNull();
    expect(form.querySelector('#regPwd')).not.toBeNull();
    expect(form.querySelector('#regAcceptTerms')).not.toBeNull();
  });

  it('tab switch buttons render correct mode', () => {
    renderAuth('login');
    const tabRegister = document.querySelector('#tabRegister');
    expect(tabRegister).not.toBeNull();
    tabRegister.click();
    expect(document.querySelector('#registerForm')).not.toBeNull();
  });

  it('login form has submit button', () => {
    renderAuth('login');
    const form = document.querySelector('#loginForm');
    expect(form.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('register form has submit button', () => {
    renderAuth('register');
    const form = document.querySelector('#registerForm');
    expect(form.querySelector('button[type="submit"]')).not.toBeNull();
  });
});

/* ── handleLogin ──────────────────────────────────────────────── */

describe('handleLogin', () => {
  let fakeEvent;

  beforeEach(() => {
    renderAuth('login');
    const form = document.querySelector('#loginForm');
    fakeEvent = {
      preventDefault: vi.fn(),
      target: form,
    };
  });

  it('shows error for empty email or password', async () => {
    document.querySelector('#loginEmail').value = '';
    document.querySelector('#loginPwd').value = '';
    await handleLogin(fakeEvent);
    expect(showAlert).toHaveBeenCalled();
  });

  it('calls apiFetch with correct endpoint and POST method', async () => {
    document.querySelector('#loginEmail').value = 'a@b.com';
    document.querySelector('#loginPwd').value = 'secret';
    apiFetch.mockResolvedValueOnce({ ok: true, data: { user: { id: 1, name: 'T' } } });
    await handleLogin(fakeEvent);
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('login'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('on success sets currentUser and calls renderShell', async () => {
    document.querySelector('#loginEmail').value = 'a@b.com';
    document.querySelector('#loginPwd').value = 'secret';
    const user = { id: 1, name: 'Test' };
    apiFetch.mockResolvedValueOnce({ ok: true, data: { user } });
    await handleLogin(fakeEvent);
    expect(appState.currentUser).toEqual(user);
    expect(renderShell).toHaveBeenCalled();
  });

  it('on failure shows alert', async () => {
    document.querySelector('#loginEmail').value = 'a@b.com';
    document.querySelector('#loginPwd').value = 'secret';
    apiFetch.mockResolvedValueOnce({ ok: false, data: { error: 'bad creds' } });
    await handleLogin(fakeEvent);
    expect(showAlert).toHaveBeenCalled();
  });
});

/* ── handleRegister ───────────────────────────────────────────── */

describe('handleRegister', () => {
  let fakeEvent;

  beforeEach(() => {
    renderAuth('register');
    const form = document.querySelector('#registerForm');
    fakeEvent = {
      preventDefault: vi.fn(),
      target: form,
    };
  });

  it('shows error for empty required fields', async () => {
    document.querySelector('#regName').value = '';
    document.querySelector('#regUser').value = '';
    document.querySelector('#regEmail').value = '';
    document.querySelector('#regPwd').value = '';
    await handleRegister(fakeEvent);
    expect(showAlert).toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    document.querySelector('#regName').value = 'Test';
    document.querySelector('#regUser').value = 'tester';
    document.querySelector('#regEmail').value = 'not-an-email';
    document.querySelector('#regPwd').value = 'pass123';
    document.querySelector('#regAcceptTerms').checked = true;
    await handleRegister(fakeEvent);
    expect(showAlert).toHaveBeenCalled();
  });

  it('shows error when terms not accepted', async () => {
    document.querySelector('#regName').value = 'Test';
    document.querySelector('#regUser').value = 'tester';
    document.querySelector('#regEmail').value = 'a@b.com';
    document.querySelector('#regPwd').value = 'password1';
    document.querySelector('#regAcceptTerms').checked = false;
    await handleRegister(fakeEvent);
    expect(showAlert).toHaveBeenCalled();
  });

  it('calls apiFetch with register endpoint', async () => {
    document.querySelector('#regName').value = 'Test';
    document.querySelector('#regUser').value = 'tester';
    document.querySelector('#regEmail').value = 'a@b.com';
    document.querySelector('#regPwd').value = 'password1';
    document.querySelector('#regAcceptTerms').checked = true;
    apiFetch.mockResolvedValueOnce({ ok: true, data: { user_id: 99 } });
    await handleRegister(fakeEvent);
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('register'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('on success calls renderVerification', async () => {
    document.querySelector('#regName').value = 'Test';
    document.querySelector('#regUser').value = 'tester';
    document.querySelector('#regEmail').value = 'a@b.com';
    document.querySelector('#regPwd').value = 'password1';
    document.querySelector('#regAcceptTerms').checked = true;
    apiFetch.mockResolvedValueOnce({ ok: true, data: { user_id: 99 } });
    await handleRegister(fakeEvent);
    expect(renderVerification).toHaveBeenCalled();
  });
});

/* ── doLogout ─────────────────────────────────────────────────── */

describe('doLogout', () => {
  it('calls apiFetch on logout endpoint', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await doLogout();
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('logout'),
      expect.anything(),
    );
  });

  it('sets currentUser to null', async () => {
    appState.currentUser = { id: 1 };
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await doLogout();
    expect(appState.currentUser).toBeNull();
  });

  it('calls renderAuth after logout', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await doLogout();
    // renderAuth is called internally – check DOM shows auth page
    expect(document.querySelector('#app').innerHTML).not.toBe('');
  });
});
