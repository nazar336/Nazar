// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      balance: 5000,
      earnings: 3000,
      spent: 1000,
      pending: 200,
      pendingBalance: 200,
      transactions: [
        { id: 1, type: 'reward', amount: 100, description: 'Task done', created_at: '2025-01-01' },
      ],
      coinBalance: 500,
      coinsPurchased: 600,
      coinsSpent: 100,
      cryptoDeposits: [
        { id: 1, amount: 10, amount_native: 10, amount_usdt: 10, amount_coins: 1000, status: 'pending', network: 'TRC20', currency: 'USDT', created_at: '2025-01-01' },
      ],
      coinHistory: [
        { id: 1, amount: 50, description: 'Pack', type: 'spend', created_at: '2025-01-01' },
      ],
      cryptoWithdrawals: [
        { id: 1, amount: 5, amount_coins: 500, amount_native: 5, status: 'pending', network: 'BEP20', currency: 'USDT', wallet_address: '0xABC', fee_coins: 50, created_at: '2025-01-01' },
      ],
      pendingCryptoCount: 1,
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester' },
    isGuest: false,
    currentPage: 'wallet',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  loadWallet: vi.fn(() => Promise.resolve()),
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
  fmtDate: vi.fn((d) => d || ''),
  fmtTime: vi.fn(() => '10:00'),
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

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

vi.mock('../../../js/focus-trap.js', () => ({
  trapFocus: vi.fn(() => vi.fn()),
  onEscape: vi.fn(() => vi.fn()),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderWallet, showWalletModal, showWithdrawModal } from '../../../js/pages/wallet.js';
import { appState } from '../../../js/state.js';
import { renderAuth } from '../../../js/pages/auth.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.getElementById('mainContent');

  // Reset appState for each test
  appState.isGuest = false;
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester' };
  appState.S.balance = 5000;
  appState.S.earnings = 3000;
  appState.S.spent = 1000;
  appState.S.pending = 200;
  appState.S.coinBalance = 500;
  appState.S.coinsPurchased = 600;
  appState.S.coinsSpent = 100;
  appState.S.pendingCryptoCount = 1;
  appState.S.transactions = [
    { id: 1, type: 'reward', amount: 100, description: 'Task done', created_at: '2025-01-01' },
  ];
  appState.S.cryptoDeposits = [
    { id: 1, amount: 10, amount_native: 10, amount_usdt: 10, amount_coins: 1000, status: 'pending', network: 'TRC20', currency: 'USDT', created_at: '2025-01-01' },
  ];
  appState.S.coinHistory = [
    { id: 1, amount: 50, description: 'Pack', type: 'spend', created_at: '2025-01-01' },
  ];
  appState.S.cryptoWithdrawals = [
    { id: 1, amount: 5, amount_coins: 500, amount_native: 5, status: 'pending', network: 'BEP20', currency: 'USDT', wallet_address: '0xABC', fee_coins: 50, created_at: '2025-01-01' },
  ];
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderWallet', () => {
  it('renders wallet page with balance display', () => {
    renderWallet(el);
    expect(el.querySelector('.wallet-hero')).toBeTruthy();
    expect(el.querySelector('.wallet-balance')).toBeTruthy();
    expect(el.innerHTML).toContain('5,000');
  });

  it('shows earnings, spent, pending amounts', () => {
    renderWallet(el);
    expect(el.innerHTML).toContain('earnings');
    expect(el.innerHTML).toContain('spent');
    expect(el.innerHTML).toContain('pending');
    expect(el.innerHTML).toContain('3,000');
    expect(el.innerHTML).toContain('1,000');
    expect(el.innerHTML).toContain('200');
  });

  it('shows coin balance section', () => {
    renderWallet(el);
    expect(el.innerHTML).toContain('Game LOL');
    expect(el.innerHTML).toContain('500');
    expect(el.innerHTML).toContain('Purchased');
    expect(el.innerHTML).toContain('Spent');
  });

  it('guest mode shows register prompt', () => {
    appState.isGuest = true;
    renderWallet(el);
    expect(el.innerHTML).toContain('guestMode');
    expect(el.innerHTML).toContain('guestWallet');
    const btn = document.getElementById('guestRegisterWallet');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('register');
  });

  it('guest register button calls renderAuth', () => {
    appState.isGuest = true;
    renderWallet(el);
    document.getElementById('guestRegisterWallet').click();
    expect(renderAuth).toHaveBeenCalledWith('register');
  });

  it('has deposit button', () => {
    renderWallet(el);
    const btn = document.getElementById('buyCoinsBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Buy with Crypto');
  });

  it('has withdraw button', () => {
    renderWallet(el);
    const btn = document.getElementById('withdrawCoinsBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('withdrawCrypto');
  });

  it('shows transaction history', () => {
    renderWallet(el);
    expect(el.innerHTML).toContain('txHistory');
    const txBody = document.getElementById('txBody');
    expect(txBody).toBeTruthy();
    expect(txBody.innerHTML).toContain('reward');
    expect(txBody.innerHTML).toContain('Task done');
  });

  it('shows crypto deposits history', () => {
    renderWallet(el);
    expect(el.innerHTML).toContain('Crypto Deposits');
    const cryptoHistory = document.getElementById('cryptoHistory');
    expect(cryptoHistory).toBeTruthy();
    expect(cryptoHistory.innerHTML).toContain('TRC20');
    expect(cryptoHistory.innerHTML).toContain('pending');
  });

  it('shows coin spending history', () => {
    renderWallet(el);
    expect(el.innerHTML).toContain('LOL Spending');
    const coinHistory = document.getElementById('coinHistory');
    expect(coinHistory).toBeTruthy();
    expect(coinHistory.innerHTML).toContain('Pack');
  });

  it('shows crypto withdrawals', () => {
    renderWallet(el);
    const withdrawHistory = document.getElementById('withdrawHistory');
    expect(withdrawHistory).toBeTruthy();
    expect(withdrawHistory.innerHTML).toContain('BEP20');
    expect(withdrawHistory.innerHTML).toContain('0xABC');
    expect(withdrawHistory.innerHTML).toContain('pending');
  });
});
