// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      xp: 500,
      level: 3,
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester' },
    isGuest: false,
    currentPage: 'miniGames',
    csrfToken: 'tok',
    notifOpen: false,
  },
  loadPoints: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: { xp_earned: 5, xp: 505, level: 3 } })),
}));

vi.mock('../../../js/utils.js', () => ({
  toast: vi.fn(),
  setLoading: vi.fn(),
  renderAnimatedBrandLayer: vi.fn(() => ''),
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

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderMiniGames } from '../../../js/pages/mini-games.js';
import { appState } from '../../../js/state.js';
import { toast } from '../../../js/utils.js';
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
  appState.S.xp = 500;
  appState.S.level = 3;
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderMiniGames', () => {
  it('renders mini games page with game cards', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('miniGames');
    expect(el.innerHTML).toContain('miniGamesInfo');
    expect(el.querySelectorAll('.game-card').length).toBe(2);
  });

  it('shows memory match game card', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('🧠');
    expect(el.innerHTML).toContain('memoryMatch');
    expect(el.innerHTML).toContain('memoryMatchDesc');
    const memoryCard = el.querySelector('[data-game="memory"]');
    expect(memoryCard).toBeTruthy();
  });

  it('shows color tap game card', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('🎨');
    expect(el.innerHTML).toContain('colorTap');
    expect(el.innerHTML).toContain('colorTapDesc');
    const colorCard = el.querySelector('[data-game="colortap"]');
    expect(colorCard).toBeTruthy();
  });

  it('shows XP and level info', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('XP');
    expect(el.innerHTML).toContain('500');
    expect(el.innerHTML).toContain('level');
    expect(el.innerHTML).toContain('3');
  });

  it('guest mode shows error toast when trying to play', () => {
    appState.isGuest = true;
    renderMiniGames(el);
    // delegate is used for game card clicks
    expect(delegate).toHaveBeenCalled();
    // Simulate the delegate callback for a guest
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    expect(gameClickCall).toBeTruthy();
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'memory' } };
    callback({}, fakeBtn);
    expect(toast).toHaveBeenCalledWith('loginToPlay', 'error');
  });

  it('clicking memory card starts memory game (creates memory grid)', () => {
    renderMiniGames(el);
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'memory' } };
    callback({}, fakeBtn);
    const gameArea = document.getElementById('gameArea');
    expect(gameArea).toBeTruthy();
    expect(gameArea.innerHTML).toContain('memory-grid');
    expect(gameArea.querySelectorAll('.memory-card').length).toBe(12);
  });

  it('clicking color tap card starts color tap game (creates color buttons)', () => {
    renderMiniGames(el);
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'colortap' } };
    callback({}, fakeBtn);
    const gameArea = document.getElementById('gameArea');
    expect(gameArea).toBeTruthy();
    expect(gameArea.querySelectorAll('.color-btn').length).toBe(4);
  });

  it('memory game has restart button', () => {
    renderMiniGames(el);
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'memory' } };
    callback({}, fakeBtn);
    const restartBtn = document.getElementById('memoryRestart');
    expect(restartBtn).toBeTruthy();
    expect(restartBtn.textContent).toContain('playAgain');
  });
});
