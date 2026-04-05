// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      notifications: [],
    },
    currentUser: null,
    isGuest: false,
    currentPage: 'verify',
    csrfToken: 'tok',
    notifOpen: false,
  },
  loadState: vi.fn(),
  saveState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: { user: { id: 1, name: 'Test' } } })),
}));

vi.mock('../../../js/utils.js', () => ({
  renderAnimatedBrandLayer: vi.fn(() => '<div class="brand-layer"></div>'),
  toast: vi.fn(),
  showAlert: vi.fn(),
  setLoading: vi.fn(),
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

vi.mock('../../../js/shell.js', () => ({
  renderShell: vi.fn(),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderVerification, handleVerify } from '../../../js/pages/verify.js';
import { appState } from '../../../js/state.js';
import { showAlert } from '../../../js/utils.js';
import { renderAuth } from '../../../js/pages/auth.js';

/* ── helpers ──────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderVerification', () => {
  it('renders verification page with captcha puzzle', () => {
    renderVerification(1, 'test@example.com');
    expect(document.querySelector('.auth-landing')).toBeTruthy();
    expect(document.getElementById('app').innerHTML).toContain('solveCaptcha');
  });

  it('shows math expression (two numbers and operator)', () => {
    renderVerification(1, 'test@example.com');
    // The math expression contains = and ?
    const content = document.getElementById('app').innerHTML;
    expect(content).toContain('=');
    expect(content).toContain('?');
    // Should have an operator (+, -, or *)
    expect(content).toMatch(/[+\-*]/);
  });

  it('has captcha answer input', () => {
    renderVerification(1, 'test@example.com');
    const input = document.getElementById('captchaAnswer');
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('has solve captcha button', () => {
    renderVerification(1, 'test@example.com');
    const btn = document.getElementById('solveCaptchaBtn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('verifyCaptcha');
  });

  it('wrong captcha answer shows error', () => {
    renderVerification(1, 'test@example.com');
    const input = document.getElementById('captchaAnswer');
    const btn = document.getElementById('solveCaptchaBtn');
    const error = document.getElementById('captchaError');
    // Enter a definitely wrong answer
    input.value = '-99999';
    btn.click();
    expect(error.style.display).toBe('block');
    expect(error.textContent).toContain('wrongAnswer');
  });

  it('correct captcha answer shows verification code form', () => {
    // We need to solve the captcha to get the form visible
    // The captcha answer is stored in a closure, so we need to compute it
    // Spy on Math.random to control the captcha
    const randomValues = [0.3, 0.6, 0.1]; // num1, num2, op index
    let callIdx = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[callIdx++] || 0);

    renderVerification(1, 'test@example.com');

    Math.random.mockRestore();

    // With these values: num1 = floor(0.3*50)+1=16, num2 = floor(0.6*50)+1=31, op = operations[floor(0.1*3)] = operations[0] = '+'
    // So answer = 16 + 31 = 47
    const input = document.getElementById('captchaAnswer');
    input.value = '47';
    document.getElementById('solveCaptchaBtn').click();

    // After correct captcha, verifyCard should be visible
    const verifyCard = document.getElementById('verifyCard');
    expect(verifyCard.style.display).toBe('block');
  });

  it('has 6-digit code input', () => {
    renderVerification(1, 'test@example.com');
    const codeInput = document.getElementById('verifyCode');
    expect(codeInput).toBeTruthy();
    expect(codeInput.maxLength).toBe(6);
    expect(codeInput.pattern).toBe('[0-9]{6}');
  });

  it('has back to login button', () => {
    renderVerification(1, 'test@example.com');
    const btn = document.getElementById('backToAuth');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('backToLogin');
    btn.click();
    expect(renderAuth).toHaveBeenCalledWith('login');
  });

  it('invalid code (non-6-digit) shows error on form submit', () => {
    // Make captcha solvable first
    const randomValues = [0.3, 0.6, 0.1];
    let callIdx = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[callIdx++] || 0);
    renderVerification(1, 'test@example.com');
    Math.random.mockRestore();

    // Solve captcha
    document.getElementById('captchaAnswer').value = '47';
    document.getElementById('solveCaptchaBtn').click();

    // Try submitting with invalid code
    document.getElementById('verifyCode').value = '123';
    const form = document.getElementById('verifyForm');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(showAlert).toHaveBeenCalledWith('verifyAlert', 'invalidCode');
  });
});
