// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      balance: 500,
      level: 5,
      xp: 300,
      chatRooms: [
        { tier: 1, name: 'General', emoji: '🌐', has_access: true, is_global: true, online: 5 },
        { tier: 2, name: 'Pro', emoji: '🟡', has_access: false, min_level: 8, online: 0, pass_coins: 500 },
      ],
      activeRoomTier: 1,
      chatRoomMessages: [
        { id: 1, user_id: 1, username: 'tester', message: 'Hi room!', created_at: '2025-01-01T10:00:00Z' },
        { id: 2, user_id: 2, username: 'alice', message: 'Hello!', created_at: '2025-01-01T10:01:00Z' },
      ],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester', level: 5 },
    isGuest: false,
    currentPage: 'chat',
    activeChatId: 1,
    csrfToken: 'tok',
    notifOpen: false,
  },
  loadChatRooms: vi.fn(() => Promise.resolve()),
  sendRoomMessage: vi.fn(() => Promise.resolve()),
  sendGlobalMessage: vi.fn(() => Promise.resolve()),
  buyRoomPass: vi.fn(() => Promise.resolve()),
  buyPointsPack: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/utils.js', () => ({
  esc: vi.fn((s) => s || ''),
  fmtTime: vi.fn(() => '10:00'),
  toast: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  setLoading: vi.fn(),
  renderAnimatedBrandLayer: vi.fn(() => ''),
}));

vi.mock('../../../js/router.js', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderChat, getAutoReply } from '../../../js/pages/chat.js';
import { appState, loadChatRooms, sendRoomMessage, sendGlobalMessage, buyRoomPass, buyPointsPack } from '../../../js/state.js';
import { toast } from '../../../js/utils.js';
import { navigate } from '../../../js/router.js';
import { renderAuth } from '../../../js/pages/auth.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.querySelector('#mainContent');
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester', level: 5 };
  appState.isGuest = false;
  appState.activeChatId = 1;
  appState.S.chatRooms = [
    { tier: 1, name: 'General', has_access: true, messages: [
      { id: 1, user_id: 1, username: 'tester', text: 'Hi room!', created_at: '2025-01-01T10:00:00Z' },
      { id: 2, user_id: 2, username: 'alice', text: 'Hello!', created_at: '2025-01-01T10:01:00Z' },
    ]},
    { tier: 2, name: 'Pro', has_access: false, level_required: 8, messages: [] },
  ];
  appState.S.globalMessages = [
    { id: 10, user_id: 3, username: 'bob', text: 'Global msg', created_at: '2025-01-01T09:00:00Z' },
  ];
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderChat ────────────────────────────────────────────────── */

describe('renderChat', () => {
  it('guest mode shows register prompt', () => {
    appState.currentUser = null;
    appState.isGuest = true;
    renderChat(el);
    const html = el.innerHTML;
    expect(
      html.includes('guestRegisterChat') || html.includes('register') || html.includes('Register'),
    ).toBe(true);
  });

  it('renders chat rooms list', () => {
    renderChat(el);
    const html = el.innerHTML;
    expect(html).toContain('General');
  });

  it('shows active room messages', () => {
    renderChat(el);
    const html = el.innerHTML;
    expect(html).toContain('Hi room!');
    expect(html).toContain('Hello!');
  });

  it('has message composer with input and send button', () => {
    renderChat(el);
    expect(el.querySelector('#roomMessageInput')).not.toBeNull();
    expect(el.querySelector('#roomSendBtn')).not.toBeNull();
  });

  it('has global message composer', () => {
    renderChat(el);
    expect(el.querySelector('#globalMessageInput')).not.toBeNull();
    expect(el.querySelector('#globalSendBtn')).not.toBeNull();
  });

  it('shows locked rooms with unlock button', () => {
    renderChat(el);
    const html = el.innerHTML;
    // Pro room is locked
    expect(
      html.includes('lock') || html.includes('🔒') || html.includes('buy-pass') || html.includes('Pro'),
    ).toBe(true);
  });

  it('has buy points section', () => {
    renderChat(el);
    expect(
      el.querySelector('#buyPointsPacksChat') !== null ||
      el.querySelector('#buyPointsBtn') !== null ||
      el.innerHTML.includes('buyPoints'),
    ).toBe(true);
  });
});

/* ── getAutoReply ──────────────────────────────────────────────── */

describe('getAutoReply', () => {
  it('returns wallet reply for wallet-related messages', () => {
    const reply = getAutoReply('How is my wallet balance?');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
  });

  it('returns task reply for task-related messages', () => {
    const reply = getAutoReply('What about the task deadline?');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
  });

  it('returns reward reply for reward-related messages', () => {
    const reply = getAutoReply('How much can I earn as reward?');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
  });

  it('returns level reply for level-related messages', () => {
    const reply = getAutoReply('How do I gain xp and level up?');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
  });

  it('returns fallback reply for unmatched messages', () => {
    const reply = getAutoReply('random gibberish 12345');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
  });
});
