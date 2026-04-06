'use strict';

import { appState, loadChatRooms, sendRoomMessage, sendGlobalMessage, buyRoomPass, buyPointsPack } from '../state.js';
import { t } from '../i18n.js';
import { esc, fmtTime, toast } from '../utils.js';
import { navigate } from '../router.js';
import { delegate } from '../event-delegation.js';
import { renderAuth } from './auth.js';

export function getAutoReply(msg){
  const rules=[
    {re:/wallet|balance|funds/i,keys:['chatReplyWallet1','chatReplyWallet2']},
    {re:/task|deadline|slots/i,keys:['chatReplyTask1','chatReplyTask2']},
    {re:/reward|earn|pay/i,keys:['chatReplyReward1','chatReplyReward2']},
    {re:/level|xp|streak/i,keys:['chatReplyLevel1','chatReplyLevel2']},
  ];
  for(const r of rules){if(r.re.test(msg)){return t(r.keys[Math.floor(Math.random()*r.keys.length)]);}}
  const fk=['chatFallback1','chatFallback2','chatFallback3'];
  return t(fk[Math.floor(Math.random()*fk.length)]);
}

export function renderChat(el){
  if(appState.isGuest){
    el.innerHTML=`
      <div class="fade-up">
        <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);">
          <div class="empty">
            <div class="empty-icon">🎭</div>
            <h3>${t('guestMode')}</h3>
            <p>${t('guestChat')}</p>
            <button class="btn btn-primary btn-sm" id="guestRegisterChat">${t('register')}</button>
          </div>
        </div>
      </div>`;
    document.getElementById('guestRegisterChat')?.addEventListener('click',()=>renderAuth('register'));
    return;
  }
  const rooms=(appState.S.chatRooms||[]);
  const activeTier=Number(appState.S.activeRoomTier||1);
  const activeRoom=rooms.find(r=>Number(r.tier)===activeTier) || rooms[0] || null;
  const messages=(appState.S.chatRoomMessages||[]);

  el.innerHTML=`
    <div class="fade-up">
      <!-- Page header -->
      <div class="page-header card" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div class="page-header-label">💬 ${t('chatRooms')}</div>
            <h1 class="page-header-title">${t('chatRooms')}</h1>
            <p class="page-header-desc">${t('chatPageDesc')}</p>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">XP: <b>${Number(appState.S.xp||0).toLocaleString()}</b> · Lv <b>${Number(appState.S.level||1)}</b></div>
            <div style="display:flex;align-items:center;gap:8px;">
              <input id="buyPointsPacksChat" type="number" min="1" max="100" value="1" class="form-input" style="width:90px;">
              <button id="buyPointsBtn" class="btn btn-ghost btn-sm">${t('buyPoints')}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="tip-bar" style="margin-bottom:14px;">
        <span>💡</span> ${t('chatTip')}
      </div>

      <div class="chat-wrap">
        <div class="chat-threads">
          <div class="chat-threads-head">${t('chatRooms')}</div>
          <div class="thread-list">
            ${rooms.map(room=>{
              const locked=!room.has_access;
              return `<button class="thread-btn ${Number(room.tier)===Number(activeTier)?'active':''}" data-room-tier="${room.tier}">
                <div class="user-av" style="width:34px;height:34px;font-size:13px;">${room.emoji}</div>
                <div style="flex:1;min-width:0;text-align:left;">
                  <div class="thread-name">${esc(room.name)}</div>
                  <div class="thread-prev">${locked?`${t('lockRoom')} · Lv ${Number(room.min_level||1)}+`:`${Number(room.online||0)} ${t('roomOnline')}`}</div>
                </div>
              </button>`;
            }).join('')}
          </div>
        </div>

        <div class="chat-main">
          ${activeRoom?`
            <div class="chat-header">
              <div class="user-av" style="width:34px;height:34px;font-size:13px;">${activeRoom.emoji}</div>
              <div>
                <div style="font-size:14px;font-weight:700;">${esc(activeRoom.name)}</div>
                <div style="font-size:12px;color:var(--muted);">${activeRoom.is_global?t('globalRoomDesc'):`${Number(activeRoom.online||0)} ${t('roomOnline')}`}</div>
              </div>
            </div>

            ${activeRoom.has_access?`
              <div class="chat-messages" id="chatMessages">
                ${messages.length?messages.map(m=>`
                  <div class="msg ${Number(m.user_id)===Number(appState.currentUser.id)?'self':''}">
                    ${Number(m.user_id)===Number(appState.currentUser.id)?'':`<div class="msg-av">${esc((m.username||'?').charAt(0).toUpperCase())}</div>`}
                    <div>
                      ${Number(m.user_id)===Number(appState.currentUser.id)?'':`<div style="font-size:11px;color:var(--muted);margin-bottom:2px;">@${esc(m.username||'user')}</div>`}
                      <div class="msg-bubble">${esc(m.message||'')}</div>
                      <div class="msg-time">${fmtTime(m.created_at)}</div>
                    </div>
                  </div>`).join(''):`<div class="empty" style="padding:24px;"><p>${t('noMsgsYet')}</p></div>`}
              </div>
              <div class="chat-composer">
                <textarea class="chat-input" id="roomMessageInput" placeholder="${t('typeMessage')}" rows="1"></textarea>
                <button class="btn btn-primary btn-sm" id="roomSendBtn">${t('sendMessage')}</button>
              </div>
            `:`
              <div class="card-flat" style="padding:14px;margin:12px;">
                <div style="font-weight:800;margin-bottom:6px;">🔒 ${t('lockRoom')}</div>
                <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">Lv ${Number(activeRoom.min_level||1)}+</div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <button class="btn btn-primary btn-sm" data-buy-pass="${activeRoom.tier}">${t('unlockRoom')} ${Number(activeRoom.pass_coins||0)} ${t('passCost')}</button>
                </div>
              </div>
            `}
          `:``}
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">🌐 ${t('globalRoomDesc')}</div>
        <div class="chat-composer">
          <textarea class="chat-input" id="globalMessageInput" placeholder="${t('typeMessage')}" rows="1"></textarea>
          <button class="btn btn-success btn-sm" id="globalSendBtn">${t('sendMessage')}</button>
        </div>
      </div>
    </div>`;

  // Room tier selection via delegate
  const threadList = el.querySelector('.thread-list');
  if (threadList) {
    delegate(threadList, 'click', '[data-room-tier]', async (e, b) => {
      const tier=Number(b.dataset.roomTier||1);
      await loadChatRooms(tier);
      navigate('chat');
    });
  }

  // Buy pass via delegate
  const chatMain = el.querySelector('.chat-main');
  if (chatMain) {
    delegate(chatMain, 'click', '[data-buy-pass]', (e, b) => buyRoomPass(Number(b.dataset.buyPass||0)));
  }

  document.getElementById('buyPointsBtn')?.addEventListener('click',buyPointsPack);

  document.getElementById('roomSendBtn')?.addEventListener('click',sendRoomMessage);
  document.getElementById('roomMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendRoomMessage();}});
  document.getElementById('globalSendBtn')?.addEventListener('click',sendGlobalMessage);
  document.getElementById('globalMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendGlobalMessage();}});

  const msgs=document.getElementById('chatMessages');
  if(msgs)msgs.scrollTop=msgs.scrollHeight;
}
