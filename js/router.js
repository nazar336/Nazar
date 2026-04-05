'use strict';

import { appState, saveState, loadTasks, loadLeaderboard, loadWallet, loadFeed, loadFeedPosts, loadChatRooms, loadPoints, loadSupport, loadMessages } from './state.js';
import { t } from './i18n.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderTasks } from './pages/tasks.js';
import { renderCreateTask } from './pages/create-task.js';
import { renderFeed } from './pages/feed.js';
import { renderWallet } from './pages/wallet.js';
import { renderChat } from './pages/chat.js';
import { renderSupport } from './pages/support.js';
import { renderProfile } from './pages/profile.js';
import { renderLeaderboard } from './pages/leaderboard.js';
import { renderMiniGames } from './pages/mini-games.js';
import { renderDM } from './pages/dm.js';

export function initScroll() {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
  }, { passive: true });
}

export function navigate(page) {
  appState.currentPage = page;
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.mob-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const mc = document.getElementById('mainContent');
  if (!mc) return;
  mc.style.opacity = '0';
  mc.style.transform = 'translateY(6px)';
  setTimeout(() => {
    mc.innerHTML = '';
    renderPage(page, mc);
    mc.style.transition = appState.S.animationsOn ? 'opacity .22s ease, transform .22s ease' : 'none';
    mc.style.opacity = '1';
    mc.style.transform = 'none';
    mc.scrollTop = 0;
  }, appState.S.animationsOn ? 100 : 10);
  const titles = { dashboard: t('dashboard'), tasks: t('tasks'), createTask: t('createTask'), feed: t('feed'), wallet: t('wallet'), chat: t('chat'), support: t('support'), profile: t('profile'), leaderboard: t('leaderboard'), miniGames: t('miniGames'), dm: t('directMessages') };
  const tb = document.getElementById('topbarTitle');
  if (tb) tb.textContent = titles[page] || page;
  document.title = `${titles[page] || page} — LOLance`;
}

export function renderPage(page, el) {
  const pages = { dashboard: renderDashboard, tasks: renderTasks, createTask: renderCreateTask, feed: renderFeed, wallet: renderWallet, chat: renderChat, support: renderSupport, profile: renderProfile, leaderboard: renderLeaderboard, miniGames: renderMiniGames, dm: renderDM };

  // Load data before rendering each page
  if (page === 'dashboard' && !appState.isGuest) {
    loadTasks('open');
    loadLeaderboard();
  }
  if (page === 'tasks' && !appState.isGuest) {
    loadTasks('open');
    loadTasks('my');
    loadTasks('taken');
  }
  if (page === 'wallet' && !appState.isGuest) loadWallet();
  if (page === 'feed') loadFeed();
  if (page === 'chat' && !appState.isGuest) { loadChatRooms(); loadPoints(); }
  if (page === 'feed') loadFeedPosts();
  if (page === 'support' && !appState.isGuest) loadSupport();
  if (page === 'profile' && !appState.isGuest) loadPoints();
  if (page === 'leaderboard') loadLeaderboard();
  if (page === 'miniGames' && !appState.isGuest) loadPoints();
  if (page === 'dm' && !appState.isGuest) loadMessages();

  (pages[page] || renderDashboard)(el);
}
