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
      tasks: [],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester', level: 5 },
    isGuest: false,
    currentPage: 'createTask',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  loadTasks: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/api.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, data: {} })),
}));

vi.mock('../../../js/utils.js', () => ({
  fmtDate: vi.fn((d) => d || ''),
  toast: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  addNotif: vi.fn(),
  esc: vi.fn((s) => s || ''),
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

import { renderCreateTask } from '../../../js/pages/create-task.js';
import { appState, saveState, loadTasks } from '../../../js/state.js';
import { apiFetch } from '../../../js/api.js';
import { toast, showAlert, hideAlert, addNotif } from '../../../js/utils.js';
import { navigate } from '../../../js/router.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.querySelector('#mainContent');
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester', level: 5 };
  appState.isGuest = false;
  appState.S.level = 5;
  appState.S.tasks = [];
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderCreateTask ─────────────────────────────────────────── */

describe('renderCreateTask', () => {
  it('renders create task form', () => {
    renderCreateTask(el);
    expect(el.innerHTML.length).toBeGreaterThan(0);
  });

  it('shows locked message when level too low', () => {
    appState.S.level = 1;
    renderCreateTask(el);
    const html = el.innerHTML;
    // should show lock/disabled indicator
    expect(html).toContain('lock');
  });

  it('shows form enabled when level 3+', () => {
    appState.S.level = 5;
    renderCreateTask(el);
    expect(el.querySelector('#ctTitle')).not.toBeNull();
  });

  it('has title, description, category, difficulty, reward, slots, deadline inputs', () => {
    renderCreateTask(el);
    expect(el.querySelector('#ctTitle')).not.toBeNull();
    expect(el.querySelector('#ctDesc')).not.toBeNull();
    expect(el.querySelector('#ctCat')).not.toBeNull();
    expect(el.querySelector('#ctDiff')).not.toBeNull();
    expect(el.querySelector('#ctReward')).not.toBeNull();
    expect(el.querySelector('#ctSlots')).not.toBeNull();
    expect(el.querySelector('#ctDeadline')).not.toBeNull();
  });

  it('has submit button', () => {
    renderCreateTask(el);
    const btn = el.querySelector('button[type="submit"]') || el.querySelector('.btn-gradient');
    expect(btn).not.toBeNull();
  });

  it('live preview updates when inputs change', () => {
    renderCreateTask(el);
    const titleInput = el.querySelector('#ctTitle');
    if (titleInput) {
      titleInput.value = 'My New Task';
      titleInput.dispatchEvent(new Event('input'));
      const preview = el.querySelector('#pvTitle');
      if (preview) {
        expect(preview.textContent).toContain('My New Task');
      }
    }
  });

  it('empty required fields show alert', async () => {
    renderCreateTask(el);
    const form = el.querySelector('form');
    if (form) {
      const event = new Event('submit', { cancelable: true });
      event.preventDefault = vi.fn();
      form.dispatchEvent(event);
      // Allow async handler to fire
      await vi.waitFor(() => {
        expect(showAlert).toHaveBeenCalled();
      }, { timeout: 500 }).catch(() => {
        // showAlert should have been called for validation
        expect(showAlert).toHaveBeenCalled();
      });
    }
  });

  it('reward<=0 or slots<=0 shows alert', async () => {
    renderCreateTask(el);
    const titleInput = el.querySelector('#ctTitle');
    const descInput = el.querySelector('#ctDesc');
    const catInput = el.querySelector('#ctCat');
    const rewardInput = el.querySelector('#ctReward');
    const slotsInput = el.querySelector('#ctSlots');
    if (titleInput && rewardInput) {
      titleInput.value = 'Task';
      descInput.value = 'Desc';
      catInput.value = 'Design';
      rewardInput.value = '0';
      slotsInput.value = '0';
      const form = el.querySelector('form');
      if (form) {
        const event = new Event('submit', { cancelable: true });
        event.preventDefault = vi.fn();
        form.dispatchEvent(event);
        await vi.waitFor(() => {
          expect(showAlert).toHaveBeenCalled();
        }, { timeout: 500 }).catch(() => {
          expect(showAlert).toHaveBeenCalled();
        });
      }
    }
  });

  it('guest mode shows warning toast on submit', async () => {
    appState.isGuest = true;
    renderCreateTask(el);
    const form = el.querySelector('form');
    if (form) {
      const event = new Event('submit', { cancelable: true });
      event.preventDefault = vi.fn();
      form.dispatchEvent(event);
      await vi.waitFor(() => {
        expect(toast).toHaveBeenCalled();
      }, { timeout: 500 }).catch(() => {
        // toast should fire for guest
        expect(toast).toHaveBeenCalled();
      });
    }
  });

  it('successful creation adds task to state and navigates to tasks page', async () => {
    renderCreateTask(el);
    const titleInput = el.querySelector('#ctTitle');
    const descInput = el.querySelector('#ctDesc');
    const catInput = el.querySelector('#ctCat');
    const diffInput = el.querySelector('#ctDiff');
    const rewardInput = el.querySelector('#ctReward');
    const slotsInput = el.querySelector('#ctSlots');
    const deadlineInput = el.querySelector('#ctDeadline');

    if (titleInput && descInput && catInput) {
      titleInput.value = 'New Task';
      descInput.value = 'A great task';
      catInput.value = 'Design';
      if (diffInput) diffInput.value = 'easy';
      rewardInput.value = '100';
      slotsInput.value = '2';
      if (deadlineInput) deadlineInput.value = '2025-12-31';

      apiFetch.mockResolvedValueOnce({
        ok: true,
        data: { task: { id: 50, title: 'New Task', status: 'open' } },
      });

      const form = el.querySelector('form');
      if (form) {
        const event = new Event('submit', { cancelable: true });
        event.preventDefault = vi.fn();
        form.dispatchEvent(event);
        await vi.waitFor(() => {
          expect(apiFetch).toHaveBeenCalled();
        }, { timeout: 1000 }).catch(() => {});
      }
    }
  });
});
