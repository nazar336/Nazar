// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: {
      lang: 'EN',
      xp: 780,
      level: 5,
      streak: 3,
      balance: 500,
      earnings: 1000,
      completedTasks: 8,
      checkinStreak: 5,
      doneCheckinToday: false,
      checkins: [{ checkin_date: '2025-01-01' }],
      bio: 'Test bio',
      role: 'Developer',
      skills: 'JS,PHP',
      friends: [2],
      friendProfiles: [{ id: 2, username: 'alice', role: 'dev' }],
      profilePosts: [{ id: 1, text: 'Hello!', created_at: '2025-01-01T10:00:00Z' }],
      coinBalance: 500,
      pendingCryptoCount: 0,
      animationsOn: true,
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester' },
    isGuest: false,
    currentPage: 'profile',
    csrfToken: 'tok',
    notifOpen: false,
  },
  calcScore: vi.fn(() => 2000),
  saveState: vi.fn(),
  loadState: vi.fn(),
  dailyCheckin: vi.fn(),
  buyPointsPack: vi.fn(),
  loadWallet: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  setLang: vi.fn(),
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

vi.mock('../../../js/shell.js', () => ({
  renderShell: vi.fn(),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderProfile } from '../../../js/pages/profile.js';
import { appState, calcScore, dailyCheckin, buyPointsPack } from '../../../js/state.js';
import { renderAuth } from '../../../js/pages/auth.js';
import { renderShell } from '../../../js/shell.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.getElementById('mainContent');

  // Reset appState
  appState.isGuest = false;
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester' };
  appState.S.xp = 780;
  appState.S.level = 5;
  appState.S.streak = 3;
  appState.S.balance = 500;
  appState.S.earnings = 1000;
  appState.S.completedTasks = 8;
  appState.S.checkinStreak = 5;
  appState.S.doneCheckinToday = false;
  appState.S.checkins = [{ checkin_date: '2025-01-01' }];
  appState.S.bio = 'Test bio';
  appState.S.role = 'Developer';
  appState.S.skills = 'JS,PHP';
  appState.S.friends = [2];
  appState.S.friendProfiles = [{ id: 2, username: 'alice', role: 'dev' }];
  appState.S.profilePosts = [{ id: 1, text: 'Hello!', created_at: '2025-01-01T10:00:00Z' }];
  appState.S.coinBalance = 500;
  appState.S.pendingCryptoCount = 0;
  appState.S.animationsOn = true;
  appState.S.lang = 'EN';
});

afterEach(() => { document.body.innerHTML = ''; });

/* ── tests ────────────────────────────────────────────────────── */

describe('renderProfile', () => {
  it('renders user profile with name and avatar', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('Test User');
    expect(el.innerHTML).toContain('@tester');
    expect(el.querySelector('.user-av')).toBeTruthy();
  });

  it('shows stats (earnings, completed tasks)', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('earnings');
    expect(el.innerHTML).toContain('1,000');
    expect(el.innerHTML).toContain('completed');
    expect(el.innerHTML).toContain('8');
  });

  it('shows XP progress bar', () => {
    renderProfile(el);
    expect(el.querySelector('.xp-bar-wrap')).toBeTruthy();
    expect(el.querySelector('.xp-bar')).toBeTruthy();
    expect(el.innerHTML).toContain('xpProgress');
    expect(el.innerHTML).toContain('780');
  });

  it('shows level and streak info', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('Lvl 5');
    expect(el.innerHTML).toContain('🔥');
    expect(el.innerHTML).toContain('3');
    expect(el.innerHTML).toContain('dayStreak');
  });

  it('has edit profile form (role, bio, skills)', () => {
    renderProfile(el);
    const form = document.getElementById('profileForm');
    expect(form).toBeTruthy();
    expect(document.getElementById('pfRole')).toBeTruthy();
    expect(document.getElementById('pfBio')).toBeTruthy();
    expect(document.getElementById('pfSkills')).toBeTruthy();
    expect(document.getElementById('pfRole').value).toBe('Developer');
    expect(document.getElementById('pfBio').value).toBe('Test bio');
    expect(document.getElementById('pfSkills').value).toBe('JS,PHP');
  });

  it('has daily checkin button', () => {
    renderProfile(el);
    const btn = document.getElementById('dailyCheckinBtn');
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Check-in');
  });

  it('disables checkin button when already checked in', () => {
    appState.S.doneCheckinToday = true;
    renderProfile(el);
    const btn = document.getElementById('dailyCheckinBtn');
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('checkinDone');
  });

  it('has buy points section', () => {
    renderProfile(el);
    expect(document.getElementById('buyPointsPacks')).toBeTruthy();
    expect(document.getElementById('buyPointsBtn')).toBeTruthy();
    expect(el.innerHTML).toContain('buyPoints');
  });

  it('shows settings (language, animations)', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('settings');
    expect(document.getElementById('profileLangBtn')).toBeTruthy();
    expect(document.getElementById('animToggleBtn')).toBeTruthy();
    expect(el.innerHTML).toContain('languageLabel');
    expect(el.innerHTML).toContain('animationsLabel');
  });

  it('guest mode shows register prompt instead of edit form', () => {
    appState.isGuest = true;
    appState.currentUser = null;
    renderProfile(el);
    expect(el.innerHTML).toContain('readyToStartQ');
    expect(el.innerHTML).toContain('register');
    const btn = document.getElementById('guestCreateBtn');
    expect(btn).toBeTruthy();
    expect(document.getElementById('profileForm')).toBeFalsy();
  });

  it('guest register button calls renderAuth', () => {
    appState.isGuest = true;
    appState.currentUser = null;
    renderProfile(el);
    document.getElementById('guestCreateBtn').click();
    expect(renderAuth).toHaveBeenCalledWith('register');
  });

  it('shows profile posts section', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('profilePosts');
    expect(document.getElementById('profilePostsList')).toBeTruthy();
    expect(el.innerHTML).toContain('Hello!');
  });

  it('has post creation form', () => {
    renderProfile(el);
    expect(document.getElementById('profilePostText')).toBeTruthy();
    expect(document.getElementById('profilePostBtn')).toBeTruthy();
    expect(el.innerHTML).toContain('postOnProfile');
  });

  it('shows point calendar', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('pointsCalendar');
    // Calendar renders 30 days
    const calendarCells = el.querySelectorAll('[title]');
    expect(calendarCells.length).toBeGreaterThanOrEqual(30);
  });

  it('shows exchanger section', () => {
    renderProfile(el);
    expect(el.innerHTML).toContain('exchangerTitle');
    expect(document.getElementById('exchAmount')).toBeTruthy();
    expect(document.getElementById('exchNetwork')).toBeTruthy();
    expect(document.getElementById('exchInitBtn')).toBeTruthy();
  });

  it('calls calcScore on render', () => {
    renderProfile(el);
    expect(calcScore).toHaveBeenCalled();
  });

  it('checkin button click calls dailyCheckin', () => {
    renderProfile(el);
    document.getElementById('dailyCheckinBtn').click();
    expect(dailyCheckin).toHaveBeenCalled();
  });

  it('buy points button click calls buyPointsPack', () => {
    renderProfile(el);
    document.getElementById('buyPointsBtn').click();
    expect(buyPointsPack).toHaveBeenCalled();
  });
});
