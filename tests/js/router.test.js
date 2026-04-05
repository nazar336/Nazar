import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// vi.mock factories are hoisted — no external references allowed
vi.mock('../../js/state.js', () => ({
  appState: { currentPage: 'dashboard', isGuest: false, S: { lang: 'EN', animationsOn: false } },
  saveState: vi.fn(),
  loadTasks: vi.fn(),
  loadLeaderboard: vi.fn(),
  loadWallet: vi.fn(),
  loadFeed: vi.fn(),
  loadFeedPosts: vi.fn(),
  loadChatRooms: vi.fn(),
  loadPoints: vi.fn(),
  loadSupport: vi.fn(),
  loadMessages: vi.fn(),
}));

vi.mock('../../js/i18n.js', () => ({
  t: (key) => key,
}));

vi.mock('../../js/pages/dashboard.js', () => ({ renderDashboard: vi.fn() }));
vi.mock('../../js/pages/tasks.js', () => ({ renderTasks: vi.fn() }));
vi.mock('../../js/pages/create-task.js', () => ({ renderCreateTask: vi.fn() }));
vi.mock('../../js/pages/feed.js', () => ({ renderFeed: vi.fn() }));
vi.mock('../../js/pages/wallet.js', () => ({ renderWallet: vi.fn() }));
vi.mock('../../js/pages/chat.js', () => ({ renderChat: vi.fn() }));
vi.mock('../../js/pages/support.js', () => ({ renderSupport: vi.fn() }));
vi.mock('../../js/pages/profile.js', () => ({ renderProfile: vi.fn() }));
vi.mock('../../js/pages/leaderboard.js', () => ({ renderLeaderboard: vi.fn() }));
vi.mock('../../js/pages/mini-games.js', () => ({ renderMiniGames: vi.fn() }));
vi.mock('../../js/pages/dm.js', () => ({ renderDM: vi.fn() }));

import { initScroll, navigate, renderPage } from '../../js/router.js';
import { appState, loadTasks, loadLeaderboard, loadWallet, loadFeed, loadFeedPosts, loadChatRooms, loadPoints, loadSupport, loadMessages } from '../../js/state.js';
import { renderDashboard } from '../../js/pages/dashboard.js';
import { renderTasks } from '../../js/pages/tasks.js';
import { renderCreateTask } from '../../js/pages/create-task.js';
import { renderFeed } from '../../js/pages/feed.js';
import { renderWallet } from '../../js/pages/wallet.js';
import { renderChat } from '../../js/pages/chat.js';
import { renderSupport } from '../../js/pages/support.js';
import { renderProfile } from '../../js/pages/profile.js';
import { renderLeaderboard } from '../../js/pages/leaderboard.js';
import { renderMiniGames } from '../../js/pages/mini-games.js';
import { renderDM } from '../../js/pages/dm.js';

describe('navigate', () => {
  let mc;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    appState.currentPage = 'dashboard';
    appState.isGuest = false;
    appState.S.animationsOn = false;

    mc = document.createElement('div');
    mc.id = 'mainContent';
    document.body.appendChild(mc);
  });

  afterEach(() => {
    vi.useRealTimers();
    mc.remove();
  });

  it('sets appState.currentPage', () => {
    navigate('tasks');
    expect(appState.currentPage).toBe('tasks');
  });

  it('updates active nav buttons', () => {
    const btn1 = document.createElement('button');
    btn1.className = 'nav-btn';
    btn1.dataset.page = 'tasks';
    const btn2 = document.createElement('button');
    btn2.className = 'nav-btn';
    btn2.dataset.page = 'dashboard';
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);

    navigate('tasks');

    expect(btn1.classList.contains('active')).toBe(true);
    expect(btn2.classList.contains('active')).toBe(false);

    btn1.remove();
    btn2.remove();
  });

  it('updates document.title', () => {
    navigate('tasks');
    expect(document.title).toContain('LOLance');
    expect(document.title).toContain('tasks');
  });

  it('calls renderPage after timeout', () => {
    navigate('tasks');

    // Before timeout, mainContent should have opacity 0
    expect(mc.style.opacity).toBe('0');

    // After timeout, renderPage should be called
    vi.advanceTimersByTime(200);
    expect(renderTasks).toHaveBeenCalledWith(mc);
  });
});

describe('renderPage', () => {
  let el;

  beforeEach(() => {
    vi.clearAllMocks();
    appState.isGuest = false;
    el = document.createElement('div');
  });

  it('calls correct render function for dashboard', () => {
    renderPage('dashboard', el);
    expect(renderDashboard).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for tasks', () => {
    renderPage('tasks', el);
    expect(renderTasks).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for createTask', () => {
    renderPage('createTask', el);
    expect(renderCreateTask).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for feed', () => {
    renderPage('feed', el);
    expect(renderFeed).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for wallet', () => {
    renderPage('wallet', el);
    expect(renderWallet).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for chat', () => {
    renderPage('chat', el);
    expect(renderChat).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for support', () => {
    renderPage('support', el);
    expect(renderSupport).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for profile', () => {
    renderPage('profile', el);
    expect(renderProfile).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for leaderboard', () => {
    renderPage('leaderboard', el);
    expect(renderLeaderboard).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for miniGames', () => {
    renderPage('miniGames', el);
    expect(renderMiniGames).toHaveBeenCalledWith(el);
  });

  it('calls correct render function for dm', () => {
    renderPage('dm', el);
    expect(renderDM).toHaveBeenCalledWith(el);
  });

  it('falls back to renderDashboard for unknown page', () => {
    renderPage('nonExistentPage', el);
    expect(renderDashboard).toHaveBeenCalledWith(el);
  });

  it('loads tasks for tasks page', () => {
    renderPage('tasks', el);
    expect(loadTasks).toHaveBeenCalledWith('open');
    expect(loadTasks).toHaveBeenCalledWith('my');
    expect(loadTasks).toHaveBeenCalledWith('taken');
  });

  it('loads wallet for wallet page', () => {
    renderPage('wallet', el);
    expect(loadWallet).toHaveBeenCalled();
  });

  it('loads leaderboard for leaderboard page', () => {
    renderPage('leaderboard', el);
    expect(loadLeaderboard).toHaveBeenCalled();
  });

  it('loads feed data for feed page', () => {
    renderPage('feed', el);
    expect(loadFeed).toHaveBeenCalled();
    expect(loadFeedPosts).toHaveBeenCalled();
  });

  it('loads chat rooms for chat page', () => {
    renderPage('chat', el);
    expect(loadChatRooms).toHaveBeenCalled();
    expect(loadPoints).toHaveBeenCalled();
  });

  it('loads support for support page', () => {
    renderPage('support', el);
    expect(loadSupport).toHaveBeenCalled();
  });

  it('loads messages for dm page', () => {
    renderPage('dm', el);
    expect(loadMessages).toHaveBeenCalled();
  });

  it('skips data loading for guest users', () => {
    appState.isGuest = true;
    renderPage('tasks', el);

    expect(loadTasks).not.toHaveBeenCalled();
    expect(renderTasks).toHaveBeenCalledWith(el);
  });
});

describe('initScroll', () => {
  it('sets up scroll event listener when scrollBar exists', () => {
    const bar = document.createElement('div');
    bar.id = 'scrollBar';
    document.body.appendChild(bar);

    const spy = vi.spyOn(window, 'addEventListener');
    initScroll();

    expect(spy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    spy.mockRestore();
    bar.remove();
  });

  it('does nothing when scrollBar element does not exist', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    initScroll();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
