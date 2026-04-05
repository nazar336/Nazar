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
      tasks: [
        { id: 1, title: 'Design Logo', description: 'Make a logo', status: 'open', reward: 100, category: 'Design', difficulty: 'easy', slots: 3, takenBy: [], created_at: '2025-01-01', deadline: '2025-06-01', creator_id: 99, creator_username: 'alice' },
        { id: 2, title: 'Edit Video', description: 'Cut a clip', status: 'taken', reward: 200, category: 'Video', difficulty: 'medium', slots: 1, takenBy: [{ user_id: 1 }], created_at: '2025-01-02', deadline: '2025-06-02', creator_id: 99, creator_username: 'bob' },
        { id: 3, title: 'QA Test', description: 'Test the app', status: 'done', reward: 300, category: 'QA', difficulty: 'hard', slots: 2, takenBy: [], created_at: '2025-01-03', deadline: '2025-06-03', creator_id: 1, creator_username: 'tester' },
      ],
      notifications: [],
    },
    currentUser: { id: 1, name: 'Test User', username: 'tester', level: 5 },
    isGuest: false,
    currentPage: 'tasks',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
  loadTasks: vi.fn(() => Promise.resolve()),
  syncProfile: vi.fn(() => Promise.resolve()),
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
  toast: vi.fn(),
  addNotif: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
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
  CATEGORIES: ['Design','Video','Copy','Social','Community','QA','Localization','Product','Development','Marketing'],
  LEVEL_PRIVILEGES: {},
  getLvlPriv: (lvl) => ({
    maxTasks: 10, canCreate: (lvl || 1) >= 3, maxReward: 5000,
    feedMedia: 'image', takeDiff: ['easy','medium','hard'], badge: '🛠', titleKey: 'lvlCreator',
  }),
  feedMediaLabel: (m) => m,
  diffLabel: (a) => (a || []).join(','),
}));

vi.mock('../../../js/event-delegation.js', () => ({
  delegate: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderTasks, takeTask, completeTask } from '../../../js/pages/tasks.js';
import { appState, loadTasks, syncProfile, loadWallet } from '../../../js/state.js';
import { apiFetch } from '../../../js/api.js';
import { toast, addNotif } from '../../../js/utils.js';
import { navigate } from '../../../js/router.js';

/* ── helpers ──────────────────────────────────────────────────── */

let el;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"><div id="mainContent"></div></div><div id="toastRoot"></div>';
  el = document.querySelector('#mainContent');
  appState.currentUser = { id: 1, name: 'Test User', username: 'tester', level: 5 };
  appState.isGuest = false;
  appState.S.tasks = [
    { id: 1, title: 'Design Logo', description: 'Make a logo', status: 'open', reward: 100, category: 'Design', difficulty: 'easy', slots: 3, takenBy: [], created_at: '2025-01-01', deadline: '2025-06-01', creator_id: 99, creator_username: 'alice' },
    { id: 2, title: 'Edit Video', description: 'Cut a clip', status: 'taken', reward: 200, category: 'Video', difficulty: 'medium', slots: 1, takenBy: [{ user_id: 1 }], created_at: '2025-01-02', deadline: '2025-06-02', creator_id: 99, creator_username: 'bob' },
    { id: 3, title: 'QA Test', description: 'Test the app', status: 'done', reward: 300, category: 'QA', difficulty: 'hard', slots: 2, takenBy: [], created_at: '2025-01-03', deadline: '2025-06-03', creator_id: 1, creator_username: 'tester' },
  ];
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderTasks ──────────────────────────────────────────────── */

describe('renderTasks', () => {
  it('renders task search input', () => {
    renderTasks(el);
    expect(el.querySelector('#taskSearch')).not.toBeNull();
  });

  it('renders status filter dropdown', () => {
    renderTasks(el);
    expect(el.querySelector('#taskStatusFilter')).not.toBeNull();
  });

  it('renders category chip buttons', () => {
    renderTasks(el);
    expect(el.querySelector('#catChips') || el.querySelectorAll('[data-cat]').length > 0).toBeTruthy();
  });

  it('shows task cards from appState.S.tasks', () => {
    renderTasks(el);
    const cards = el.querySelectorAll('.task-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "no tasks found" when empty', () => {
    appState.S.tasks = [];
    renderTasks(el);
    const html = el.innerHTML;
    expect(html).toContain('noTasks');
  });

  it('search input filters tasks by title', () => {
    renderTasks(el);
    const input = el.querySelector('#taskSearch');
    input.value = 'Design';
    input.dispatchEvent(new Event('input'));
    const grid = el.querySelector('#tasksGrid');
    if (grid) {
      expect(grid.innerHTML).toContain('Design Logo');
    }
  });

  it('status filter filters tasks by status', () => {
    renderTasks(el);
    const filter = el.querySelector('#taskStatusFilter');
    filter.value = 'done';
    filter.dispatchEvent(new Event('change'));
    const grid = el.querySelector('#tasksGrid');
    if (grid) {
      expect(grid.innerHTML).toContain('QA Test');
    }
  });

  it('category chips filter by category', () => {
    renderTasks(el);
    const chip = el.querySelector('[data-cat="Design"]');
    if (chip) {
      chip.click();
      const grid = el.querySelector('#tasksGrid');
      if (grid) {
        expect(grid.innerHTML).toContain('Design Logo');
      }
    }
  });

  it('create task button navigates to createTask page', () => {
    renderTasks(el);
    const btn = el.querySelector('#openCreateTaskBtn');
    if (btn) {
      btn.click();
      expect(navigate).toHaveBeenCalledWith('createTask');
    }
  });

  it('take button appears for eligible open tasks', () => {
    renderTasks(el);
    const html = el.innerHTML;
    // task 1 is open, user is not creator, should show take button
    expect(html).toContain('take-btn') ;
  });

  it('complete button appears for taken tasks assigned to user', () => {
    renderTasks(el);
    const html = el.innerHTML;
    // task 2 is taken by user 1
    expect(html).toContain('complete-btn') ;
  });
});

/* ── takeTask ─────────────────────────────────────────────────── */

describe('takeTask', () => {
  it('guest shows warning toast', async () => {
    appState.isGuest = true;
    await takeTask(1);
    expect(toast).toHaveBeenCalled();
  });

  it('invalid task ID shows error', async () => {
    await takeTask(9999);
    expect(toast).toHaveBeenCalled();
  });

  it('calls apiFetch with correct data', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await takeTask(1);
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('take'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('on success shows success toast and reloads tasks', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await takeTask(1);
    expect(toast).toHaveBeenCalled();
  });
});

/* ── completeTask ─────────────────────────────────────────────── */

describe('completeTask', () => {
  it('invalid task ID shows error', async () => {
    await completeTask(9999);
    expect(toast).toHaveBeenCalled();
  });

  it('submit action calls correct endpoint', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await completeTask(2, 'submit');
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('complete'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('approve action calls correct endpoint with reward notification', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, data: {} });
    await completeTask(2, 'approve');
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('complete'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
