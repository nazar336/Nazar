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

const SKELETON_HTML = `<div class="loading-skeleton" aria-busy="true" style="padding:24px;display:flex;flex-direction:column;gap:16px;">
  <div style="height:24px;width:40%;border-radius:6px;background:var(--surface,#1a1a2e);animation:pulse 1.2s ease infinite;"></div>
  <div style="height:80px;border-radius:8px;background:var(--surface,#1a1a2e);animation:pulse 1.2s ease infinite;"></div>
  <div style="height:16px;width:60%;border-radius:6px;background:var(--surface,#1a1a2e);animation:pulse 1.2s ease infinite;"></div>
</div>`;

let _hashListenerActive = false;
let _beforeNavigateHook = null;

/**
 * Register a hook that runs before every SPA navigation.
 * Return false from the hook to cancel the navigation.
 */
export function setBeforeNavigateHook(fn) {
  _beforeNavigateHook = fn;
}

/**
 * Clear the before-navigate hook.
 */
export function clearBeforeNavigateHook() {
  _beforeNavigateHook = null;
}

function _pageTitles() {
  return { dashboard: t('dashboard'), tasks: t('tasks'), createTask: t('createTask'), feed: t('feed'), wallet: t('wallet'), chat: t('chat'), support: t('support'), profile: t('profile'), leaderboard: t('leaderboard'), miniGames: t('miniGames'), dm: t('directMessages') };
}

export function initScroll() {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
  }, { passive: true });
}

export function initHashRouting() {
  if (_hashListenerActive) return;
  _hashListenerActive = true;

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const page = location.hash.replace('#', '') || 'dashboard';
    if (page !== appState.currentPage) {
      appState.currentPage = page;
      const mc = document.getElementById('mainContent');
      if (mc) {
        mc.innerHTML = '';
        renderPage(page, mc);
        requestAnimationFrame(() => {
          mc.style.transition = appState.S.animationsOn ? 'opacity .22s ease, transform .22s ease' : 'none';
          mc.style.opacity = '1';
          mc.style.transform = 'none';
        });
      }
      document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      document.querySelectorAll('.mob-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      const titles = _pageTitles();
      const tb = document.getElementById('topbarTitle');
      if (tb) tb.textContent = titles[page] || page;
      document.title = `${titles[page] || page} — Lolanceizi`;
    }
  });

  // Handle hash changes from other sources
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '') || 'dashboard';
    if (page !== appState.currentPage) navigate(page);
  });

  // Navigate to initial hash if present
  const initial = location.hash.replace('#', '');
  if (initial && initial !== appState.currentPage) navigate(initial);
}

export function navigate(page) {
  // Check if a beforeNavigate hook wants to cancel navigation
  if (_beforeNavigateHook && typeof _beforeNavigateHook === 'function') {
    if (_beforeNavigateHook(page) === false) return;
  }

  appState.currentPage = page;

  // Sync URL hash — use pushState so browser back/forward works
  if (typeof location !== 'undefined' && location.hash !== '#' + page) {
    history.pushState({ page }, '', '#' + page);
  }

  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.mob-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const mc = document.getElementById('mainContent');
  if (!mc) return;
  mc.style.opacity = '0';
  mc.style.transform = 'translateY(6px)';

  // Show loading skeleton while waiting for transition
  mc.innerHTML = SKELETON_HTML;

  setTimeout(() => {
    mc.innerHTML = '';
    renderPage(page, mc);
    requestAnimationFrame(() => {
      mc.style.transition = appState.S.animationsOn ? 'opacity .22s ease, transform .22s ease' : 'none';
      mc.style.opacity = '1';
      mc.style.transform = 'none';
    });
    mc.scrollTop = 0;
    window.scrollTo(0, 0);
  }, appState.S.animationsOn ? 100 : 10);
  const titles = _pageTitles();
  const tb = document.getElementById('topbarTitle');
  if (tb) tb.textContent = titles[page] || page;
  document.title = `${titles[page] || page} — Lolanceizi`;
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
  if (page === 'feed') { loadFeed(); loadFeedPosts(); }
  if (page === 'chat' && !appState.isGuest) { loadChatRooms(); loadPoints(); }
  if (page === 'support' && !appState.isGuest) loadSupport();
  if (page === 'profile' && !appState.isGuest) loadPoints();
  if (page === 'leaderboard') loadLeaderboard();
  if (page === 'miniGames' && !appState.isGuest) loadPoints();
  if (page === 'dm' && !appState.isGuest) loadMessages();

  const renderer = Object.prototype.hasOwnProperty.call(pages, page) ? pages[page] : renderDashboard;
  try {
    renderer(el);
  } catch (err) {
    console.error('Page render error:', page, err);
    el.innerHTML = `<div class="card" style="text-align:center;padding:32px;">
      <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
      <h3 style="margin-bottom:8px;">${t('errorGeneric') || 'Something went wrong'}</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">${t('pageLoadError') || 'Failed to load this page. Please try again.'}</p>
      <button class="btn btn-primary btn-sm" onclick="location.reload()">🔄 ${t('refresh') || 'Refresh'}</button>
    </div>`;
  }
}
