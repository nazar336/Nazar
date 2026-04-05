// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      leaderboard: [
        { id: 1, name: 'Alice', username: 'alice', earnings: 5000, completed_tasks: 50, level: 10, xp: 8000, streak: 30, score: 15000, position: 1 },
        { id: 2, name: 'Bob', username: 'bob', earnings: 3000, completed_tasks: 30, level: 8, xp: 6000, streak: 20, score: 10000, position: 2 },
        { id: 3, name: 'Carol', username: 'carol', earnings: 1000, completed_tasks: 10, level: 5, xp: 3000, streak: 5, score: 5000, position: 3 },
      ],
      userPosition: 5,
      earnings: 500,
      completedTasks: 5,
      streak: 2,
      level: 3,
      xp: 1200,
      notifications: [],
    },
    currentUser: { id: 2, name: 'Bob', username: 'bob' },
    isGuest: false,
    currentPage: 'leaderboard',
    csrfToken: 'tok',
    notifOpen: false,
  },
  calcScore: vi.fn(() => 1500),
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

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderLeaderboard } from '../../../js/pages/leaderboard.js';
import { appState, calcScore } from '../../../js/state.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.getElementById('mainContent');

  // Reset appState
  appState.currentUser = { id: 2, name: 'Bob', username: 'bob' };
  appState.isGuest = false;
  appState.S.leaderboard = [
    { id: 1, name: 'Alice', username: 'alice', earnings: 5000, completed_tasks: 50, level: 10, xp: 8000, streak: 30, score: 15000, position: 1 },
    { id: 2, name: 'Bob', username: 'bob', earnings: 3000, completed_tasks: 30, level: 8, xp: 6000, streak: 20, score: 10000, position: 2 },
    { id: 3, name: 'Carol', username: 'carol', earnings: 1000, completed_tasks: 10, level: 5, xp: 3000, streak: 5, score: 5000, position: 3 },
  ];
  appState.S.userPosition = 5;
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderLeaderboard', () => {
  it('renders leaderboard with podium', () => {
    renderLeaderboard(el);
    expect(el.querySelector('.podium')).toBeTruthy();
    expect(el.innerHTML).toContain('leaderboard');
  });

  it('shows top 3 users on podium', () => {
    renderLeaderboard(el);
    const podium = el.querySelector('.podium');
    expect(podium).toBeTruthy();
    expect(podium.innerHTML).toContain('Alice');
    expect(podium.innerHTML).toContain('Bob');
    expect(podium.innerHTML).toContain('Carol');
    // First place has crown
    expect(podium.innerHTML).toContain('👑');
    // Medals for 2nd and 3rd
    expect(podium.innerHTML).toContain('🥈');
    expect(podium.innerHTML).toContain('🥉');
  });

  it('shows full ranking table', () => {
    renderLeaderboard(el);
    const table = el.querySelector('.rank-table');
    expect(table).toBeTruthy();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('table has correct columns (user, score, earnings, etc.)', () => {
    renderLeaderboard(el);
    const table = el.querySelector('.rank-table');
    const headers = table.querySelectorAll('thead th');
    expect(headers.length).toBe(7);
    // Check columns: #, User, Score, Earnings, Completed, Streak, Badges
    expect(headers[0].textContent).toBe('#');
    expect(headers[1].textContent).toBe('User');
    expect(headers[2].textContent).toContain('score');
    expect(headers[3].textContent).toContain('earnings');
    expect(headers[4].textContent).toContain('completed');
    expect(headers[5].textContent).toContain('streak');
    expect(headers[6].textContent).toContain('badges');
  });

  it('highlights current user row with "me" class', () => {
    renderLeaderboard(el);
    const table = el.querySelector('.rank-table');
    const meRow = table.querySelector('tr.me');
    expect(meRow).toBeTruthy();
    expect(meRow.innerHTML).toContain('Bob');
    expect(meRow.innerHTML).toContain('you');
  });

  it('shows user current position', () => {
    renderLeaderboard(el);
    expect(el.innerHTML).toContain('yourPosition');
    expect(el.innerHTML).toContain('#5');
  });

  it('shows medals/crowns for top positions', () => {
    renderLeaderboard(el);
    const podiumItems = el.querySelectorAll('.podium-item');
    expect(podiumItems.length).toBe(3);
    // Crown for 1st place
    expect(el.querySelector('.podium-crown')).toBeTruthy();
    expect(el.querySelector('.podium-crown').textContent).toContain('👑');
  });

  it('calls calcScore on render', () => {
    renderLeaderboard(el);
    expect(calcScore).toHaveBeenCalled();
  });

  it('shows user scores in table', () => {
    renderLeaderboard(el);
    expect(el.innerHTML).toContain('15,000');
    expect(el.innerHTML).toContain('10,000');
    expect(el.innerHTML).toContain('5,000');
  });

  it('shows streak badges with fire emoji', () => {
    renderLeaderboard(el);
    const streakBadges = el.querySelectorAll('.streak-badge');
    expect(streakBadges.length).toBeGreaterThan(0);
    expect(el.innerHTML).toContain('🔥');
  });
});
