'use strict';

import { STORAGE_KEY, API } from './constants.js';
import { apiFetch } from './api.js';
import { toast } from './utils.js';
import { t } from './i18n.js';

export const appState = {
  S: {},
  currentUser: null,
  isGuest: false,
  currentPage: 'dashboard',
  activeChatId: null,
  notifOpen: false,
  csrfToken: null
};

export function defaultState() {
  return {
    lang: 'UA', animationsOn: true,
    balance: 0, earnings: 0, spent: 0, pending: 0, pendingBalance: 0,
    level: 1, xp: 0, streak: 0, completedTasks: 0, activeTasks: 0,
    achievements: [],
    bio: '', role: '', skills: '', name: '', username: '',
    tasks: [],
    feed: [], feedPosts: [], feedPage: 1, feedHasMore: false,
    notifications: [],
    transactions: [],
    threads: [],
    tickets: [],
    coinBalance: 0, coinsPurchased: 0, coinsSpent: 0,
    cryptoDeposits: [], pendingCryptoCount: 0, coinHistory: [],
    cryptoWithdrawals: [],
    checkinStreak: 0, doneCheckinToday: false, checkins: [],
    chatRooms: [], activeRoomTier: 1, chatRoomMessages: [],
    leaderboard: [], userPosition: null,
    feedTodayPosts: 0, feedMaxPostsDay: 3, feedXpPerPost: 5,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { appState.S = JSON.parse(raw); }
  } catch (e) { console.error('loadState error:', e); }
  const defaults = defaultState();
  if (!appState.S || Object.keys(appState.S).length === 0) appState.S = defaults;
  else appState.S = { ...defaults, ...appState.S };
}

export function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.S)); } catch (e) { console.error('saveState error:', e); }
}

export async function syncProfile() {
  if (!appState.currentUser || appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.profile);
    if (ok && data.user) {
      appState.currentUser = data.user;
      appState.S.name = data.user.name;
      appState.S.username = data.user.username;
      appState.S.level = data.user.level || 1;
      appState.S.xp = data.user.xp || 0;
      appState.S.earnings = data.user.total_earnings || 0;
      appState.S.spent = data.user.total_spent || 0;
      appState.S.streak = data.user.streak || 0;
      appState.S.bio = data.user.bio || '';
      appState.S.role = data.user.role || '';
      appState.S.skills = data.user.skills || '';
      saveState();
    }
  } catch (e) { console.error('syncProfile error:', e); }
}

export async function loadTasks(filter = 'open') {
  try {
    const { ok, data } = await apiFetch(`${API.tasks}?filter=${filter}`);
    if (ok && data.tasks) {
      const apiTasks = data.tasks.map(t => ({
        id: String(t.id),
        title: t.title,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        reward: Number(t.reward || 0),
        slots: Number(t.slots || 1),
        deadline: t.deadline,
        status: t.status,
        creator_id: Number(t.creator_id || 0),
        owner: t.creator_username || `User #${t.creator_id}`,
        taken_slots: Number(t.taken_slots || 0),
        my_assignment_status: t.my_assignment_status || null,
        pending_submissions: Number(t.pending_submissions || 0),
        slotsLeft: Math.max(0, Number(t.slots || 1) - Number(t.taken_slots || 0)),
        participants: [],
        progress: t.status === 'completed' ? 100 : (t.status === 'in_progress' ? 55 : 0),
        createdAt: t.created_at || new Date().toISOString()
      }));
      const map = new Map((appState.S.tasks || []).map(task => [String(task.id), task]));
      apiTasks.forEach(task => {
        const key = String(task.id);
        map.set(key, { ...(map.get(key) || {}), ...task });
      });
      appState.S.tasks = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      saveState();
    }
  } catch (e) {
    console.error('loadTasks error:', e);
  }
}

export async function loadWallet() {
  if (appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.wallet);
    if (ok) {
      appState.S.balance = data.balance || 0;
      appState.S.pendingBalance = data.pending_balance || 0;
      appState.S.pending = data.pending_balance || 0;
      appState.S.transactions = data.transactions || [];
      appState.S.coinBalance = data.coin_balance || 0;
      appState.S.coinsPurchased = data.coins_purchased || 0;
      appState.S.coinsSpent = data.coins_spent || 0;
      appState.S.pendingCryptoCount = data.crypto_pending_count || 0;
    }

    const { ok: cryptoOk, data: cryptoData } = await apiFetch(`${API.cryptoDeposit}?action=history`);
    if (cryptoOk) {
      appState.S.cryptoDeposits = cryptoData.deposits || [];
      appState.S.coinBalance = cryptoData.coin_balance ?? appState.S.coinBalance ?? 0;
      appState.S.coinsPurchased = cryptoData.total_purchased ?? appState.S.coinsPurchased ?? 0;
      appState.S.coinsSpent = cryptoData.total_spent ?? appState.S.coinsSpent ?? 0;
    }

    const { ok: coinsOk, data: coinsData } = await apiFetch(API.coins);
    if (coinsOk) {
      appState.S.coinBalance = coinsData.coin_balance ?? appState.S.coinBalance ?? 0;
      appState.S.coinsPurchased = coinsData.total_purchased ?? appState.S.coinsPurchased ?? 0;
      appState.S.coinsSpent = coinsData.total_spent ?? appState.S.coinsSpent ?? 0;
      appState.S.coinHistory = coinsData.spending_history || [];
    }

    const { ok: wdOk, data: wdData } = await apiFetch(`${API.cryptoWithdraw}?action=history`);
    if (wdOk) {
      appState.S.cryptoWithdrawals = wdData.withdrawals || [];
    }

    saveState();
  } catch (e) { console.error('loadWallet error:', e); }
}

export async function loadMessages() {
  if (appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.messages);
    if (ok) {
      appState.S.threads = data.threads || [];
      saveState();
    }
  } catch (e) { console.error('loadMessages error:', e); }
}

export async function loadSupport() {
  if (appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.support);
    if (ok) {
      appState.S.tickets = (data.tickets || []).map(ticket => ({
        id: String(ticket.id),
        subject: ticket.subject,
        type: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        ts: ticket.created_at,
        updatedAt: ticket.updated_at,
        description: ticket.description || ''
      }));
      saveState();
      if (appState.currentPage === 'support') {
        const main = document.getElementById('mainContent');
        if (main) {
          // Re-render support page dynamically imported
          import('./pages/support.js').then(mod => mod.renderSupport(main));
        }
      }
    }
  } catch (e) { console.error('loadSupport error:', e); }
}

export async function loadPoints() {
  if (appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.xp);
    if (ok) {
      appState.S.xp = Number(data.xp ?? appState.S.xp ?? 0);
      appState.S.level = Number(data.level ?? appState.S.level ?? 1);
      appState.S.checkinStreak = Number(data.checkin_streak || 0);
      appState.S.doneCheckinToday = !!data.done_today;
      appState.S.checkins = Array.isArray(data.checkins) ? data.checkins : [];
      saveState();
    }
  } catch (e) { console.error('loadPoints error:', e); }
}

export async function loadChatRooms(tier) {
  if (appState.isGuest) return;
  try {
    const { ok, data } = await apiFetch(API.chatRooms);
    if (ok) {
      appState.S.chatRooms = Array.isArray(data.rooms) ? data.rooms : [];
      appState.S.xp = Number(data.user_xp ?? appState.S.xp ?? 0);
      appState.S.level = Number(data.user_level ?? appState.S.level ?? 1);
      if (!tier) {
        const firstAccessible = (appState.S.chatRooms || []).find(r => r.has_access) || appState.S.chatRooms[0];
        tier = Number(firstAccessible?.tier || appState.S.activeRoomTier || 1);
      }
      const activeRoom = (appState.S.chatRooms || []).find(r => Number(r.tier) === Number(tier));
      if (activeRoom && activeRoom.has_access) {
        appState.S.activeRoomTier = Number(tier);
        const msgRes = await apiFetch(`${API.chatRooms}?tier=${appState.S.activeRoomTier}`);
        if (msgRes.ok) {
          appState.S.chatRoomMessages = Array.isArray(msgRes.data.messages) ? msgRes.data.messages : [];
          appState.S.xp = Number(msgRes.data.user_xp ?? appState.S.xp ?? 0);
          appState.S.level = Number(msgRes.data.user_level ?? appState.S.level ?? 1);
        } else {
          appState.S.chatRoomMessages = [];
        }
      } else {
        appState.S.chatRoomMessages = [];
      }
      saveState();
    }
  } catch (e) { console.error('loadChatRooms error:', e); }
}

export async function sendRoomMessage() {
  const input = document.getElementById('roomMessageInput');
  if (!input) return;
  const message = input.value.trim();
  if (!message) { toast(t('noMessage'), 'error'); return; }
  const tier = Number(appState.S.activeRoomTier || 1);
  const { ok, data } = await apiFetch(API.chatRooms, { method: 'POST', body: JSON.stringify({ action: 'send', tier, message }) });
  if (!ok) { toast(data.message || 'Error', 'error'); return; }
  input.value = '';
  await loadChatRooms(tier);
  const { navigate } = await import('./router.js');
  navigate('chat');
}

export async function sendGlobalMessage() {
  const input = document.getElementById('globalMessageInput');
  if (!input) return;
  const message = input.value.trim();
  if (!message) { toast(t('noMessage'), 'error'); return; }
  const { ok, data } = await apiFetch(API.chatRooms, { method: 'POST', body: JSON.stringify({ action: 'send', tier: 1, message }) });
  if (!ok) { toast(data.message || 'Error', 'error'); return; }
  input.value = '';
  await loadChatRooms(1);
  toast(t('globalMsgSent'), 'success');
  const { navigate } = await import('./router.js');
  navigate('chat');
}

export async function buyRoomPass(tier) {
  const { ok, data } = await apiFetch(API.chatRooms, { method: 'POST', body: JSON.stringify({ action: 'buy_pass', tier: Number(tier) }) });
  if (!ok) { toast(data.message || 'Error', 'error'); return; }
  await loadWallet();
  await loadPoints();
  await loadChatRooms(Number(tier));
  toast(data.message || 'Pass purchased', 'success');
  const { navigate } = await import('./router.js');
  navigate('chat');
}

export async function dailyCheckin() {
  const { ok, data } = await apiFetch(API.xp, { method: 'POST', body: JSON.stringify({ action: 'checkin' }) });
  if (!ok) { toast(data.message || 'Check-in failed', 'error'); return; }
  await loadPoints();
  toast(`+${Number(data.xp_earned || 0)} XP`, 'success');
  const { navigate } = await import('./router.js');
  navigate('profile');
}

export async function buyPointsPack() {
  const packs = Math.max(1, Number(document.getElementById('buyPointsPacksChat')?.value || document.getElementById('buyPointsPacks')?.value || 1));
  const { ok, data } = await apiFetch(API.xp, { method: 'POST', body: JSON.stringify({ action: 'buy_xp', packs }) });
  if (!ok) { toast(data.message || 'Purchase failed', 'error'); return; }
  await loadWallet();
  await loadPoints();
  toast(`+${Number(data.xp_earned || 0)} XP`, 'success');
  const { navigate } = await import('./router.js');
  if (appState.currentPage === 'chat') navigate('chat');
  else navigate('profile');
}

export async function loadLeaderboard() {
  try {
    const { ok, data } = await apiFetch(API.leaderboard);
    if (ok) {
      appState.S.leaderboard = data.leaderboard || [];
      appState.S.userPosition = data.user_position;
      saveState();
    }
  } catch (e) { console.error('loadLeaderboard error:', e); }
}

export async function loadFeed(page = 1, append = false) {
  try {
    const { ok, data } = await apiFetch(`${API.feed}?page=${page}`);
    if (ok) {
      if (append) {
        appState.S.feedPosts = [...(appState.S.feedPosts || []), ...(data.posts || [])];
      } else {
        appState.S.feedPosts = data.posts || [];
      }
      appState.S.feedPage = data.page || 1;
      appState.S.feedHasMore = !!data.has_more;
      appState.S.feedTodayPosts = data.today_posts || 0;
      appState.S.feedMaxPostsDay = data.max_posts_day || 3;
      appState.S.feedXpPerPost = data.xp_per_post || 5;
      saveState();
    }
  } catch (e) { console.error('loadFeed error:', e); }
}

// Alias for loadFeed
export const loadFeedPosts = loadFeed;

export function calcScore(u) {
  return Math.round((u.earnings || 0) * 1.02 + (u.completedTasks || 0) * 65 + (u.streak || 0) * 20 + (u.level || 1) * 110 + (u.xp || 0));
}
