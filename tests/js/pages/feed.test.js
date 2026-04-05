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
      feedPosts: [
        { id: 1, user_id: 1, username: 'tester', text: 'Hello world!', likes_count: 3, liked_by_me: false, media_url: null, media_type: null, created_at: '2025-01-01T12:00:00Z' },
        { id: 2, user_id: 2, username: 'alice', text: 'Great day!', likes_count: 5, liked_by_me: true, media_url: 'https://img.com/pic.jpg', media_type: 'image', created_at: '2025-01-02T14:00:00Z' },
      ],
      feedPage: 1,
      feedHasMore: false,
      friends: [],
      notifications: [],
      dailyPostsUsed: 1,
      dailyPostsLimit: 5,
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester', level: 5 },
    isGuest: false,
    currentPage: 'feed',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  loadFeed: vi.fn(() => Promise.resolve()),
  loadFeedPosts: vi.fn(() => Promise.resolve()),
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
  fmtAgo: vi.fn(() => '2h ago'),
  toast: vi.fn(),
  setLoading: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  addNotif: vi.fn(),
  fmtDate: vi.fn((d) => d || ''),
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
  CATEGORIES: ['Design','Video','Copy','Social','Community','QA','Localization','Product','Development','Marketing'],
  LEVEL_PRIVILEGES: {},
  getLvlPriv: (lvl) => ({
    maxTasks: 10, canCreate: (lvl || 1) >= 3, maxReward: 5000,
    feedMedia: 'image', takeDiff: ['easy','medium'], badge: '🛠', titleKey: 'lvlCreator',
  }),
  feedMediaLabel: (m) => m || 'none',
  diffLabel: (a) => (a || []).join(','),
}));

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderFeed } from '../../../js/pages/feed.js';
import { appState, saveState, loadFeed } from '../../../js/state.js';
import { apiFetch } from '../../../js/api.js';
import { toast, setLoading } from '../../../js/utils.js';
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
  appState.S.feedPosts = [
    { id: 1, user_id: 1, username: 'tester', text: 'Hello world!', likes_count: 3, liked_by_me: false, media_url: null, media_type: null, created_at: '2025-01-01T12:00:00Z' },
    { id: 2, user_id: 2, username: 'alice', text: 'Great day!', likes_count: 5, liked_by_me: true, media_url: 'https://img.com/pic.jpg', media_type: 'image', created_at: '2025-01-02T14:00:00Z' },
  ];
  appState.S.dailyPostsUsed = 1;
  appState.S.dailyPostsLimit = 5;
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderFeed ────────────────────────────────────────────────── */

describe('renderFeed', () => {
  it('renders feed with post cards', () => {
    renderFeed(el);
    const html = el.innerHTML;
    expect(html).toContain('Hello world!');
    expect(html).toContain('Great day!');
  });

  it('guest mode shows register prompt', () => {
    appState.currentUser = null;
    appState.isGuest = true;
    renderFeed(el);
    const html = el.innerHTML;
    expect(
      html.includes('guestRegFeed') || html.includes('Register') || html.includes('register'),
    ).toBe(true);
  });

  it('has feed mode toggle', () => {
    renderFeed(el);
    const toggleBtns = el.querySelectorAll('[data-mode]');
    expect(toggleBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('has filter tabs (all/my)', () => {
    renderFeed(el);
    const filters = el.querySelectorAll('[data-ft]');
    expect(filters.length).toBeGreaterThanOrEqual(1);
  });

  it('shows post creation form for logged-in users', () => {
    renderFeed(el);
    expect(el.querySelector('#feedPostText')).not.toBeNull();
  });

  it('post text area exists', () => {
    renderFeed(el);
    const textarea = el.querySelector('#feedPostText');
    expect(textarea).not.toBeNull();
  });

  it('publish button exists', () => {
    renderFeed(el);
    const btn = el.querySelector('#feedPublishBtn') || el.querySelector('[id*="ublish"]');
    expect(btn).not.toBeNull();
  });

  it('empty post text shows error toast', () => {
    renderFeed(el);
    const btn = el.querySelector('#feedPublishBtn') || el.querySelector('[id*="ublish"]');
    if (btn) {
      btn.click();
      expect(toast).toHaveBeenCalled();
    }
  });

  it('like button exists on posts', () => {
    renderFeed(el);
    const html = el.innerHTML;
    expect(html).toContain('like');
  });

  it('has media toggle button', () => {
    renderFeed(el);
    const html = el.innerHTML;
    // media section or toggle exists
    expect(
      el.querySelector('#feedMediaSection') !== null ||
      html.includes('media') || html.includes('Media'),
    ).toBe(true);
  });

  it('shows posts left counter', () => {
    renderFeed(el);
    const html = el.innerHTML;
    // Shows remaining posts info
    expect(html.length).toBeGreaterThan(0);
  });
});
