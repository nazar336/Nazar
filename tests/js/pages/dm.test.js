// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      threads: [
        { id: 't1', other_user_id: 2, other_username: 'alice', last_message: 'Hey', last_at: '2025-01-01T10:00:00Z', unread: 1 },
      ],
      activeDmThread: null,
      dmMessages: [],
      friends: [2],
      friendProfiles: [{ id: 2, username: 'alice', role: 'dev' }],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester' },
    isGuest: false,
    currentPage: 'dm',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  loadMessages: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: { messages: [] } })),
}));

vi.mock('../../../js/utils.js', () => ({
  esc: vi.fn((s) => s || ''),
  fmtAgo: vi.fn(() => '1h ago'),
  fmtTime: vi.fn(() => '10:00'),
  toast: vi.fn(),
  setLoading: vi.fn(),
  renderAnimatedBrandLayer: vi.fn(() => ''),
}));

vi.mock('../../../js/router.js', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../../js/constants.js', () => ({
  STORAGE_KEY: 'lolanceizi_state_v5',
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

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderDM } from '../../../js/pages/dm.js';
import { appState } from '../../../js/state.js';
import { renderAuth } from '../../../js/pages/auth.js';
import { delegate } from '../../../js/event-delegation.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.getElementById('mainContent');

  // Reset appState
  appState.isGuest = false;
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester' };
  appState.S.threads = [
    { id: 't1', other_user_id: 2, other_username: 'alice', last_message: 'Hey', last_at: '2025-01-01T10:00:00Z', unread: 1 },
  ];
  appState.S.activeDmThread = null;
  appState.S.dmMessages = [];
  appState.S.friends = [2];
  appState.S.friendProfiles = [{ id: 2, username: 'alice', role: 'dev' }];
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderDM', () => {
  it('guest mode shows register prompt', () => {
    appState.isGuest = true;
    renderDM(el);
    expect(el.innerHTML).toContain('guestMode');
    expect(el.innerHTML).toContain('guestChat');
    const btn = document.getElementById('guestRegisterDM');
    expect(btn).toBeTruthy();
    btn.click();
    expect(renderAuth).toHaveBeenCalledWith('register');
  });

  it('renders thread list with threads', () => {
    renderDM(el);
    const threadList = document.getElementById('dmThreads');
    expect(threadList).toBeTruthy();
    expect(threadList.innerHTML).toContain('alice');
    expect(threadList.innerHTML).toContain('Hey');
    expect(threadList.querySelector('[data-thread-id="t1"]')).toBeTruthy();
  });

  it('shows new chat button', () => {
    renderDM(el);
    const btn = document.getElementById('dmNewChatBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('dmNewChat');
  });

  it('shows search input', () => {
    renderDM(el);
    const input = document.getElementById('dmSearchInput');
    expect(input).toBeTruthy();
    expect(input.placeholder).toContain('dmSearch');
  });

  it('thread selection sets active thread via delegate', () => {
    renderDM(el);
    const threadList = document.getElementById('dmThreads');
    expect(threadList).toBeTruthy();
    // delegate is called for thread-id clicks
    expect(delegate).toHaveBeenCalled();
    const threadDelegateCalls = delegate.mock.calls.filter(
      c => c[2] === '[data-thread-id]'
    );
    expect(threadDelegateCalls.length).toBeGreaterThan(0);
  });

  it('shows DM composer when thread is active', () => {
    appState.S.activeDmThread = 't1';
    renderDM(el);
    const input = document.getElementById('dmMessageInput');
    const sendBtn = document.getElementById('dmSendBtn');
    expect(input).toBeTruthy();
    expect(sendBtn).toBeTruthy();
    expect(sendBtn.textContent).toContain('dmSend');
  });

  it('shows friends list', () => {
    renderDM(el);
    expect(el.innerHTML).toContain('friendsList');
    expect(el.innerHTML).toContain('alice');
    expect(el.innerHTML).toContain('dev');
    const friendItems = el.querySelectorAll('[data-start-dm]');
    expect(friendItems.length).toBeGreaterThan(0);
  });

  it('shows empty state when no active thread', () => {
    appState.S.activeDmThread = null;
    renderDM(el);
    expect(el.innerHTML).toContain('dmEmpty');
    const btn2 = document.getElementById('dmNewChatBtn2');
    expect(btn2).toBeTruthy();
  });
});
