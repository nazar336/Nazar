// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      xp: 500,
      level: 3,
      coinBalance: 1000,
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
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: { coin_balance: 950, xp: 505, level: 3 } })),
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
  appState.S.coinBalance = 1000;
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

  it('shows case opening game card', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('📦');
    expect(el.innerHTML).toContain('caseOpening');
    expect(el.innerHTML).toContain('caseOpeningDesc');
    const casesCard = el.querySelector('[data-game="cases"]');
    expect(casesCard).toBeTruthy();
  });

  it('shows price prediction game card', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('📊');
    expect(el.innerHTML).toContain('pricePrediction');
    expect(el.innerHTML).toContain('pricePredictionDesc');
    const predictCard = el.querySelector('[data-game="predict"]');
    expect(predictCard).toBeTruthy();
  });

  it('shows coin balance and level info', () => {
    renderMiniGames(el);
    expect(el.innerHTML).toContain('XP');
    expect(el.innerHTML).toContain('500');
    expect(el.innerHTML).toContain('level');
    expect(el.innerHTML).toContain('3');
    expect(el.innerHTML).toContain('1000');
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
    const fakeBtn = { dataset: { game: 'cases' } };
    callback({}, fakeBtn);
    expect(toast).toHaveBeenCalledWith('loginToPlay', 'error');
  });

  it('clicking cases card starts case opening (shows case cards)', () => {
    renderMiniGames(el);
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'cases' } };
    callback({}, fakeBtn);
    const gameArea = document.getElementById('gameArea');
    expect(gameArea).toBeTruthy();
    expect(gameArea.innerHTML).toContain('caseBronze');
    expect(gameArea.innerHTML).toContain('caseDiamond');
    expect(gameArea.querySelectorAll('.open-case-btn').length).toBe(5);
  });

  it('clicking predict card starts price prediction (shows chart and controls)', () => {
    renderMiniGames(el);
    const gameClickCall = delegate.mock.calls.find(c => c[2] === '[data-game]');
    const callback = gameClickCall[3];
    const fakeBtn = { dataset: { game: 'predict' } };
    callback({}, fakeBtn);
    const gameArea = document.getElementById('gameArea');
    expect(gameArea).toBeTruthy();
    expect(gameArea.innerHTML).toContain('predCanvas');
    expect(document.getElementById('predUpBtn')).toBeTruthy();
    expect(document.getElementById('predDownBtn')).toBeTruthy();
    expect(document.getElementById('predBet')).toBeTruthy();
    expect(document.getElementById('predTimeframe')).toBeTruthy();
  });
});
