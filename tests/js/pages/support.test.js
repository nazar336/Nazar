// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      tickets: [
        { id: '1', subject: 'Help me', type: 'technical', priority: 'normal', status: 'open', ts: '2025-01-01T10:00:00Z' },
      ],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester' },
    isGuest: false,
    currentPage: 'support',
    csrfToken: 'tok',
    notifOpen: false,
  },
  loadSupport: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: {} })),
}));

vi.mock('../../../js/utils.js', () => ({
  esc: vi.fn((s) => s || ''),
  fmtAgo: vi.fn(() => '1h ago'),
  toast: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  setLoading: vi.fn(),
  renderAnimatedBrandLayer: vi.fn(() => ''),
}));

vi.mock('../../../js/router.js', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../../js/constants.js', () => ({
  STORAGE_KEY: 'lolance_state_v5',
  API: {
    session: 'api/session.php', login: 'api/login.php', register: 'api/register.php',
    verify: 'api/verify.php', logout: 'api/logout.php', profile: 'api/profile.php',
    tasks: 'api/tasks.php', wallet: 'api/wallet.php', messages: 'api/messages.php',
    leaderboard: 'api/leaderboard.php', takeTask: 'api/take-task.php',
    completeTask: 'api/complete-task.php', cryptoDeposit: 'api/crypto-deposit.php',
    cryptoWithdraw: 'api/crypto-withdraw.php', coins: 'api/coins.php', xp: 'api/xp.php',
    chatRooms: 'api/chat-rooms.php', support: 'api/support.php', feed: 'api/feed.php',
    miniGames: 'api/mini-games.php',
  },
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderSupport } from '../../../js/pages/support.js';
import { appState, loadSupport } from '../../../js/state.js';
import { apiFetch } from '../../../js/api.js';
import { toast, showAlert, hideAlert } from '../../../js/utils.js';
import { renderAuth } from '../../../js/pages/auth.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.getElementById('mainContent');

  // Reset appState
  appState.isGuest = false;
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester' };
  appState.S.tickets = [
    { id: '1', subject: 'Help me', type: 'technical', priority: 'normal', status: 'open', ts: '2025-01-01T10:00:00Z' },
  ];
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderSupport', () => {
  it('renders support page with FAQ section', () => {
    renderSupport(el);
    expect(el.innerHTML).toContain('faq');
    expect(document.getElementById('faqList')).toBeTruthy();
  });

  it('guest mode shows register prompt', () => {
    appState.isGuest = true;
    renderSupport(el);
    expect(el.innerHTML).toContain('guestMode');
    expect(el.innerHTML).toContain('guestSupport');
    const btn = document.getElementById('guestRegisterSupport');
    expect(btn).toBeTruthy();
    btn.click();
    expect(renderAuth).toHaveBeenCalledWith('register');
  });

  it('has ticket creation form for logged-in users', () => {
    renderSupport(el);
    const form = document.getElementById('ticketForm');
    expect(form).toBeTruthy();
    expect(el.innerHTML).toContain('createTicket');
  });

  it('form has subject, type, priority, details fields', () => {
    renderSupport(el);
    expect(document.getElementById('tkSubject')).toBeTruthy();
    expect(document.getElementById('tkType')).toBeTruthy();
    expect(document.getElementById('tkPriority')).toBeTruthy();
    expect(document.getElementById('tkDetails')).toBeTruthy();
  });

  it('shows ticket history table', () => {
    renderSupport(el);
    expect(el.innerHTML).toContain('tickets');
    expect(el.innerHTML).toContain('Help me');
    expect(el.innerHTML).toContain('technical');
    expect(el.innerHTML).toContain('open');
  });

  it('shows ticket count badge', () => {
    renderSupport(el);
    const count = el.querySelector('.count');
    expect(count).toBeTruthy();
    expect(count.textContent).toContain('1');
  });

  it('empty subject shows error alert on submit', async () => {
    renderSupport(el);
    const form = document.getElementById('ticketForm');
    document.getElementById('tkSubject').value = '';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    // showAlert should be called with the alert id and error message
    await vi.waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith('tkAlert', 'required');
    });
  });

  it('successful ticket creation calls apiFetch with correct data', async () => {
    renderSupport(el);
    document.getElementById('tkSubject').value = 'Test Subject';
    document.getElementById('tkDetails').value = 'Test details';
    const form = document.getElementById('ticketForm');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(apiFetch).toHaveBeenCalled();
    });
    const callArgs = apiFetch.mock.calls[0];
    expect(callArgs[0]).toContain('support');
    const body = JSON.parse(callArgs[1].body);
    expect(body.subject).toBe('Test Subject');
    expect(body.description).toBe('Test details');
  });

  it('guest mode hides ticket form', () => {
    appState.isGuest = true;
    renderSupport(el);
    expect(document.getElementById('ticketForm')).toBeFalsy();
  });
});
