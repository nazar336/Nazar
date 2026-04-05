'use strict';

import { appState, saveState, loadMessages } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtAgo, fmtTime, toast, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { API } from '../constants.js';
import { delegate } from '../event-delegation.js';
import { renderAuth } from './auth.js';

export function renderDM(el) {
  if (appState.isGuest) {
    el.innerHTML = `
      <div class="fade-up">
        <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);">
          <div class="empty">
            <div class="empty-icon">🎭</div>
            <h3>${t('guestMode')}</h3>
            <p>${t('guestChat')}</p>
            <button class="btn btn-primary btn-sm" id="guestRegisterDM">${t('register')}</button>
          </div>
        </div>
      </div>`;
    document.getElementById('guestRegisterDM')?.addEventListener('click', () => renderAuth('register'));
    return;
  }

  const threads = appState.S.threads || [];
  const activeThreadId = appState.S.activeDmThread || null;
  const activeThread = threads.find(th => String(th.id) === String(activeThreadId)) || null;
  const dmMessages = appState.S.dmMessages || [];

  el.innerHTML = `
    <div class="fade-up">
      <div class="dm-layout">
        <div class="dm-sidebar" id="dmSidebar">
          <div class="dm-sidebar-head">
            <div style="font-size:15px;font-weight:800;">✉️ ${t('directMessages')}</div>
            <button class="btn btn-primary btn-xs" id="dmNewChatBtn">${t('dmNewChat')}</button>
          </div>
          <div class="dm-search">
            <input type="text" id="dmSearchInput" placeholder="${t('dmSearch')}">
          </div>
          <div class="dm-threads" id="dmThreads">
            ${threads.length ? threads.map(th => `
              <div class="dm-thread${String(th.id) === String(activeThreadId) ? ' active' : ''}" data-thread-id="${th.id}">
                <div class="user-av" style="width:36px;height:36px;font-size:13px;flex-shrink:0;">${esc((th.other_username || '?').charAt(0).toUpperCase())}</div>
                <div class="dm-thread-info">
                  <div class="dm-thread-name">@${esc(th.other_username || 'user')}</div>
                  <div class="dm-thread-preview">${esc(th.last_message || '')}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                  <div class="dm-thread-time">${th.last_at ? fmtAgo(th.last_at) : ''}</div>
                  ${th.unread ? `<div class="dm-thread-unread">${th.unread}</div>` : ''}
                </div>
              </div>
            `).join('') : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">${t('noConversations')}</div>`}
          </div>
        </div>

        <div class="dm-main" id="dmMain">
          ${activeThread ? `
            <div class="dm-header">
              <button class="btn btn-ghost btn-xs dm-back-btn" id="dmBackBtn" style="display:none;">←</button>
              <div class="user-av" style="width:34px;height:34px;font-size:13px;">${esc((activeThread.other_username || '?').charAt(0).toUpperCase())}</div>
              <div>
                <div style="font-size:14px;font-weight:700;">@${esc(activeThread.other_username || 'user')}</div>
                <div style="font-size:12px;color:var(--muted);">${t('directMessages')}</div>
              </div>
              <div style="margin-left:auto;">
                <button class="friend-btn${(appState.S.friends || []).includes(activeThread.other_user_id) ? ' added' : ''}" data-friend-id="${activeThread.other_user_id}" data-friend-name="${esc(activeThread.other_username)}">
                  ${(appState.S.friends || []).includes(activeThread.other_user_id) ? `✓ ${t('friends')}` : `+ ${t('addFriend')}`}
                </button>
              </div>
            </div>
            <div class="dm-messages" id="dmMessages">
              ${dmMessages.length ? dmMessages.map(m => `
                <div class="dm-msg${Number(m.sender_id) === Number(appState.currentUser.id) ? ' self' : ''}">
                  ${Number(m.sender_id) !== Number(appState.currentUser.id) ? `<div class="user-av" style="width:28px;height:28px;font-size:11px;flex-shrink:0;">${esc((m.sender_name || '?').charAt(0).toUpperCase())}</div>` : ''}
                  <div>
                    <div class="dm-msg-bubble">${esc(m.message || '')}</div>
                    <div class="dm-msg-time">${fmtTime(m.created_at)}</div>
                  </div>
                </div>
              `).join('') : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">${t('noMsgsYet')}</div>`}
            </div>
            <div class="dm-composer">
              <textarea id="dmMessageInput" placeholder="${t('dmPlaceholder')}" rows="1"></textarea>
              <button class="btn btn-primary btn-sm" id="dmSendBtn">${t('dmSend')}</button>
            </div>
          ` : `
            <div class="dm-empty">
              <div class="dm-empty-icon">✉️</div>
              <div style="font-size:15px;font-weight:600;">${t('dmEmpty')}</div>
              <button class="btn btn-primary btn-sm" id="dmNewChatBtn2">${t('dmNewChat')}</button>
            </div>
          `}
        </div>
      </div>

      ${(appState.S.friends || []).length ? `
        <div class="card" style="margin-top:16px;">
          <div class="section-title">👥 ${t('friendsList')}</div>
          <div class="friends-list">
            ${(appState.S.friendProfiles || []).map(f => `
              <div class="friend-item" data-start-dm="${f.id}" data-friend-username="${esc(f.username)}">
                <div class="user-av" style="width:32px;height:32px;font-size:12px;">${esc((f.username || '?').charAt(0).toUpperCase())}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:14px;font-weight:600;">@${esc(f.username)}</div>
                  <div style="font-size:12px;color:var(--muted);">${esc(f.role || '')}</div>
                </div>
                <button class="btn btn-ghost btn-xs" data-start-dm="${f.id}">${t('startChatWith')}</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>`;

  // Scroll messages to bottom
  const msgs = document.getElementById('dmMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  // Thread selection
  const threadList = document.getElementById('dmThreads');
  if (threadList) {
    delegate(threadList, 'click', '[data-thread-id]', async (e, b) => {
      const threadId = b.dataset.threadId;
      appState.S.activeDmThread = threadId;
      // Load messages for this thread
      try {
        const { ok, data } = await apiFetch(`${API.messages}?thread_id=${threadId}`);
        if (ok) {
          appState.S.dmMessages = data.messages || [];
          saveState();
        }
      } catch (err) {
        console.error('loadDmMessages error:', err);
      }
      navigate('dm');
    });
  }

  // Send message
  document.getElementById('dmSendBtn')?.addEventListener('click', sendDmMessage);
  document.getElementById('dmMessageInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDmMessage(); }
  });

  // New chat
  document.getElementById('dmNewChatBtn')?.addEventListener('click', openNewChatModal);
  document.getElementById('dmNewChatBtn2')?.addEventListener('click', openNewChatModal);

  // Friend actions
  delegate(el, 'click', '[data-friend-id]', (e, b) => {
    toggleFriend(Number(b.dataset.friendId), b.dataset.friendName);
  });

  // Start DM from friends list
  delegate(el, 'click', '[data-start-dm]', async (e, b) => {
    const userId = b.dataset.startDm;
    const username = b.dataset.friendUsername || '';
    await startDmWith(userId, username);
  });

  // Mobile back button
  document.getElementById('dmBackBtn')?.addEventListener('click', () => {
    appState.S.activeDmThread = null;
    saveState();
    navigate('dm');
  });

  // Responsive: show back button on mobile
  if (activeThread && window.innerWidth <= 768) {
    const backBtn = document.getElementById('dmBackBtn');
    const sidebar = document.getElementById('dmSidebar');
    if (backBtn) backBtn.style.display = 'inline-flex';
    if (sidebar) sidebar.classList.add('hidden');
  } else if (!activeThread && window.innerWidth <= 768) {
    const main = document.getElementById('dmMain');
    if (main) main.classList.add('hidden');
  }

  // Search filter
  document.getElementById('dmSearchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.dm-thread').forEach(t => {
      const name = t.querySelector('.dm-thread-name')?.textContent?.toLowerCase() || '';
      t.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

async function sendDmMessage() {
  const input = document.getElementById('dmMessageInput');
  if (!input) return;
  const message = input.value.trim();
  if (!message) { toast(t('noMessage'), 'error'); return; }
  const threadId = appState.S.activeDmThread;
  if (!threadId) return;
  const btn = document.getElementById('dmSendBtn');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch(API.messages, {
      method: 'POST',
      body: JSON.stringify({ action: 'send', thread_id: threadId, message })
    });
    if (!ok) { toast(data.message || 'Error', 'error'); return; }
    input.value = '';
    // Append message locally
    const newMsg = data.message_obj || {
      sender_id: appState.currentUser.id,
      sender_name: appState.currentUser.username,
      message,
      created_at: new Date().toISOString()
    };
    appState.S.dmMessages = [...(appState.S.dmMessages || []), newMsg];
    saveState();
    toast(t('dmSent'), 'success');
    navigate('dm');
  } finally {
    setLoading(btn, false);
  }
}

function openNewChatModal() {
  const existing = document.getElementById('newChatModal');
  if (existing) { existing.remove(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'newChatModal';
  overlay.className = 'lang-modal-overlay';
  overlay.innerHTML = `
    <div class="lang-modal" style="max-width:420px;">
      <div class="lang-modal-title">✉️ ${t('dmNewChat')}</div>
      <div style="margin-bottom:14px;">
        <input type="text" id="newChatUsername" class="form-input" placeholder="${t('dmSearch')}" style="width:100%;">
      </div>
      <div id="newChatResults" style="max-height:300px;overflow-y:auto;"></div>
      <div style="margin-top:12px;text-align:right;">
        <button class="btn btn-ghost btn-sm" id="newChatClose">${t('cancel')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
  document.getElementById('newChatClose')?.addEventListener('click', () => overlay.remove());

  // Search users
  let searchTimer;
  document.getElementById('newChatUsername')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      document.getElementById('newChatResults').innerHTML = '';
      return;
    }
    searchTimer = setTimeout(async () => {
      const results = document.getElementById('newChatResults');
      // Use feed posts users or leaderboard as search source
      const users = getKnownUsers().filter(u =>
        u.username.toLowerCase().includes(q.toLowerCase()) &&
        Number(u.id) !== Number(appState.currentUser.id)
      );
      results.innerHTML = users.length ? users.map(u => `
        <div class="friend-item" data-new-dm-user="${u.id}" data-new-dm-name="${esc(u.username)}" style="cursor:pointer;">
          <div class="user-av" style="width:32px;height:32px;font-size:12px;">${esc((u.username || '?').charAt(0).toUpperCase())}</div>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:600;">@${esc(u.username)}</div>
          </div>
          <button class="btn btn-primary btn-xs">${t('startChatWith')}</button>
        </div>
      `).join('') : `<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">${t('noResults') || 'No results'}</div>`;

      delegate(results, 'click', '[data-new-dm-user]', async (ev, b) => {
        await startDmWith(b.dataset.newDmUser, b.dataset.newDmName);
        overlay.remove();
      });
    }, 300);
  });
}

function getKnownUsers() {
  const userMap = new Map();
  // From feed posts
  (appState.S.feedPosts || []).forEach(p => {
    if (p.user_id && p.username) userMap.set(String(p.user_id), { id: p.user_id, username: p.username });
  });
  // From leaderboard
  (appState.S.leaderboard || []).forEach(u => {
    if (u.id && u.username) userMap.set(String(u.id), { id: u.id, username: u.username });
  });
  // From chat messages
  (appState.S.chatRoomMessages || []).forEach(m => {
    if (m.user_id && m.username) userMap.set(String(m.user_id), { id: m.user_id, username: m.username });
  });
  return Array.from(userMap.values());
}

async function startDmWith(userId, username) {
  // Check if thread already exists
  const existing = (appState.S.threads || []).find(th =>
    String(th.other_user_id) === String(userId)
  );
  if (existing) {
    appState.S.activeDmThread = existing.id;
    try {
      const { ok, data } = await apiFetch(`${API.messages}?thread_id=${existing.id}`);
      if (ok) appState.S.dmMessages = data.messages || [];
    } catch (err) { console.error(err); }
    saveState();
    navigate('dm');
    return;
  }
  // Create new thread
  const { ok, data } = await apiFetch(API.messages, {
    method: 'POST',
    body: JSON.stringify({ action: 'create_thread', recipient_id: userId })
  });
  if (ok && data.thread) {
    appState.S.threads = [data.thread, ...(appState.S.threads || [])];
    appState.S.activeDmThread = data.thread.id;
    appState.S.dmMessages = [];
    saveState();
  }
  navigate('dm');
}

function toggleFriend(userId, username) {
  if (!appState.S.friends) appState.S.friends = [];
  if (!appState.S.friendProfiles) appState.S.friendProfiles = [];
  const idx = appState.S.friends.indexOf(userId);
  if (idx >= 0) {
    appState.S.friends.splice(idx, 1);
    appState.S.friendProfiles = appState.S.friendProfiles.filter(f => f.id !== userId);
    toast(t('friendRemoved'), 'info');
  } else {
    appState.S.friends.push(userId);
    appState.S.friendProfiles.push({ id: userId, username: username || 'user', role: '' });
    toast(t('friendAdded'), 'success');
  }
  saveState();
  navigate('dm');
}
