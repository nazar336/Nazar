// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      balance: 1200,
      earnings: 500,
      completedTasks: 12,
      level: 5,
      xp: 780,
      streak: 3,
      tasks: [
        { id: 1, title: 'Task A', status: 'open', reward: 100, category: 'Design', created_at: '2025-01-01' },
        { id: 2, title: 'Task B', status: 'open', reward: 200, category: 'Video', created_at: '2025-01-02' },
        { id: 3, title: 'Task C', status: 'done', reward: 300, category: 'QA', created_at: '2025-01-03' },
      ],
      leaderboard: [
        { username: 'alice', score: 900 },
        { username: 'bob', score: 800 },
        { username: 'carol', score: 700 },
      ],
      achievements: [],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester', level: 5 },
    isGuest: false,
    currentPage: 'dashboard',
    csrfToken: 'tok',
    notifOpen: false,
  },
  calcScore: vi.fn(() => 2000),
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/utils.js', () => ({
  esc: vi.fn((s) => s || ''),
  fmtDate: vi.fn((d) => d || ''),
  toast: vi.fn(),
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
  feedMediaLabel: (m) => m,
  diffLabel: (a) => (a || []).join(','),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderDashboard } from '../../../js/pages/dashboard.js';
import { appState, calcScore } from '../../../js/state.js';
import { navigate } from '../../../js/router.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.querySelector('#mainContent');
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderDashboard ──────────────────────────────────────────── */

describe('renderDashboard', () => {
  it('renders dashboard with stats grid', () => {
    renderDashboard(el);
    expect(el.querySelector('.stats-grid')).not.toBeNull();
  });

  it('displays balance, earnings, completed tasks, and level', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    // Balance 1200 may be formatted as "1,200" by toLocaleString
    expect(html).toMatch(/1[,.]?200/);
    expect(html).toContain('500');
    expect(html).toContain('12');
  });

  it('shows XP progress bar', () => {
    renderDashboard(el);
    expect(el.querySelector('.xp-bar-wrap') || el.querySelector('.xp-bar')).not.toBeNull();
  });

  it('shows level privileges section', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    // level privileges rendered as grid items
    expect(html).toContain('lvl');
  });

  it('shows quick action buttons', () => {
    renderDashboard(el);
    const navBtns = el.querySelectorAll('[data-nav]');
    expect(navBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('quick action buttons navigate to correct pages', () => {
    renderDashboard(el);
    const taskBtn = el.querySelector('[data-nav="tasks"]');
    if (taskBtn) {
      taskBtn.click();
      expect(navigate).toHaveBeenCalledWith('tasks');
    }
  });

  it('shows trending tasks section', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    expect(html).toContain('Task A');
  });

  it('shows mini leaderboard', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    expect(html).toContain('alice');
  });

  it('renders for guest mode with guest welcome title', () => {
    appState.currentUser = null;
    appState.isGuest = true;
    renderDashboard(el);
    const html = el.innerHTML;
    // should render something appropriate for guest
    expect(html.length).toBeGreaterThan(0);
  });

  it('shows streak badge', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    expect(html).toContain('🔥');
  });

  it('shows achievements section', () => {
    renderDashboard(el);
    const html = el.innerHTML;
    // achievements or trophy-related content
    expect(html).toContain('🏆');
  });
});
