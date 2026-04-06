'use strict';

import { appState, saveState, calcScore, dailyCheckin, buyPointsPack, loadWallet } from '../state.js';
import { t, setLang } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtDate, fmtTime, fmtAgo, toast, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { API } from '../constants.js';
import { renderShell } from '../shell.js';
import { renderAuth } from './auth.js';
import { delegate } from '../event-delegation.js';

function _formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  const num = Number(n), abs = Math.abs(num);
  if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

export function renderProfile(el){
  const fmtNum = _formatNumber;
  const myScore=calcScore({earnings:appState.S.earnings,completedTasks:appState.S.completedTasks,streak:appState.S.streak,level:appState.S.level,xp:appState.S.xp});
  const xpPct=Math.min(100,Math.round(((appState.S.xp||0)%1000)/10));
  const todayStr=new Date().toISOString().slice(0,10);
  const checkinSet=new Set((appState.S.checkins||[]).map(ci=>ci.checkin_date));
  const last30=Array.from({length:30},(_,idx)=>{
    const d=new Date();
    d.setDate(d.getDate()-(29-idx));
    const iso=d.toISOString().slice(0,10);
    return {iso,done:checkinSet.has(iso),today:iso===todayStr};
  });

  const pointsCard=appState.isGuest?'':`
    <div class="card card-sm" style="margin-bottom:16px;">
      <div class="section-title">⭐ ${t('earnPoints')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div class="card-flat" style="padding:10px;"><div class="stat-label">XP</div><div style="font-size:20px;font-weight:900;">${Number(appState.S.xp||0).toLocaleString()} XP</div></div>
        <div class="card-flat" style="padding:10px;"><div class="stat-label">${t('checkinStreak')}</div><div style="font-size:20px;font-weight:900;">${Number(appState.S.checkinStreak||0)} 🔥</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <button id="dailyCheckinBtn" class="btn btn-${appState.S.doneCheckinToday?'ghost':'success'} btn-sm" ${appState.S.doneCheckinToday?'disabled':''}>${appState.S.doneCheckinToday?t('checkinDone'):'Check-in (+10 XP)'}</button>
        <input id="buyPointsPacks" type="number" min="1" max="100" value="1" class="form-input" style="width:90px;">
        <button id="buyPointsBtn" class="btn btn-ghost btn-sm">${t('buyPoints')}</button>
      </div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;">
        <div>• ${t('earnTaskEasy')}</div>
        <div>• ${t('earnTaskMedium')}</div>
        <div>• ${t('earnTaskHard')}</div>
        <div>• ${t('earnCheckin')}</div>
        <div>• ${t('earnVisit')}</div>
        <div>• ${t('earnBuyLabel')}</div>
      </div>
    </div>`;

  const calendarHtml=appState.isGuest?'':`
    <div class="card" style="margin-top:20px;">
      <div class="section-title">📅 ${t('pointsCalendar')}</div>
      <div style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;">
        ${last30.map(day=>`<div title="${day.iso}" style="border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;text-align:center;font-size:12px;${day.done?'background:rgba(184,255,92,.15);border-color:rgba(184,255,92,.45);':''}${day.today?'box-shadow:0 0 0 1px rgba(125,215,255,.55) inset;':''}"><div style="font-size:11px;color:var(--muted);">${day.iso.slice(8)}</div><div>${day.done?'✅':'•'}</div></div>`).join('')}
      </div>
    </div>`;

  const rightCol=appState.isGuest
    ? `<div class="card"><div class="section-title">👉 ${t('readyToStartQ')}</div><p style="font-size:14px;color:var(--text-soft);margin-bottom:14px;">${t('readyToStartDesc')}</p><button class="btn btn-primary btn-block" id="guestCreateBtn"><span class="btn-txt">${t('register')}</span></button></div>`
    : `<div class="card"><div class="section-title">✏️ ${t('editProfileTitle')}</div><form id="profileForm" style="display:flex;flex-direction:column;gap:14px;"><div class="form-group"><label class="form-label">${t('roleTitle')}</label><input type="text" id="pfRole" class="form-input" value="${esc(appState.S.role||'')}" placeholder="${t('rolePlaceholder')}" maxlength="60"><div id="pfRoleCounter" style="font-size:11px;color:var(--muted);text-align:right;margin-top:2px;">${(appState.S.role||'').length}/60</div></div><div class="form-group"><label class="form-label">${t('bioLabel')}</label><textarea id="pfBio" class="form-textarea" rows="3" maxlength="500" placeholder="${t('bioPlaceholder')}">${esc(appState.S.bio||'')}</textarea><div id="pfBioCounter" style="font-size:11px;color:var(--muted);text-align:right;margin-top:2px;">${(appState.S.bio||'').length}/500</div></div><div class="form-group"><label class="form-label">${t('skillsLabel')}</label><input type="text" id="pfSkills" class="form-input" value="${esc(appState.S.skills||'')}" placeholder="${t('skillsPlaceholder')}"></div><button type="submit" id="profileSaveBtn" class="btn btn-primary btn-block"><span class="btn-txt">${t('saveProfile')}</span></button></form>${!appState.isGuest&&appState.currentUser?`<button class="btn btn-ghost btn-sm" id="copyProfileLinkBtn" style="margin-top:10px;width:100%;">🔗 ${t('copyProfileLink') || 'Copy profile link'}</button>`:''}</div>`;

  const exchanger=appState.isGuest?'':`<div class="card" style="margin-top:20px;"><div class="section-title">🪙 ${t('exchangerTitle')}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;"><div class="card-flat" style="padding:10px;"><div class="stat-label">Coins</div><div style="font-weight:800;">${Number(appState.S.coinBalance||0).toLocaleString()}</div></div><div class="card-flat" style="padding:10px;"><div class="stat-label">Rate</div><div style="font-weight:800;">1 USD = 100 🪙</div></div><div class="card-flat" style="padding:10px;"><div class="stat-label">${t('pending')}</div><div style="font-weight:800;">${Number(appState.S.pendingCryptoCount||0)}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><input id="exchAmount" class="form-input" type="number" min="0.0001" step="any" max="10000" placeholder="Amount"><select id="exchNetwork" class="form-select"><option value="TRC20">TRC20 (USDT)</option><option value="BEP20">BEP20 (USDT)</option><option value="ERC20">ERC20 (ETH)</option><option value="BTC">BTC</option><option value="SOL">SOL</option></select></div><div id="exchangeAlert" class="alert" style="margin-top:10px;"></div><button id="exchInitBtn" class="btn btn-primary btn-block" style="margin-top:10px;"><span class="btn-txt">${t('exchangerGetAddress')}</span></button><div id="exchangeStep2" style="margin-top:10px;"></div></div>`;

  const friendsCount = (appState.S.friends||[]).length;
  const profilePosts = appState.S.profilePosts || [];

  el.innerHTML=`
    <div class="fade-up" style="max-width:800px;">
      <!-- Page header -->
      <div class="page-header card" style="margin-bottom:16px;">
        <div>
          <div class="page-header-label">👤 ${t('profile')}</div>
          <h1 class="page-header-title">${appState.isGuest?t('guestMode'):t('profile')}</h1>
          <p class="page-header-desc">${t('profilePageDesc')}</p>
        </div>
      </div>
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <div class="user-av lg" style="border:2px solid rgba(184,255,92,.3);">${appState.isGuest?'🎭':(appState.currentUser.name||'?').charAt(0).toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-size:20px;font-weight:900;">${appState.isGuest?t('guestAccount'):esc(appState.currentUser.name||appState.currentUser.username)}</div>
            <div style="font-size:14px;color:var(--muted);">${appState.isGuest?t('browseWithout'):'@'+esc(appState.currentUser.username)+' · '+esc(appState.S.role||t('defaultRole'))}</div>
            ${!appState.isGuest&&appState.S.bio?`<div style="font-size:14px;color:var(--text-soft);margin-top:6px;">${esc(appState.S.bio)}</div>`:''}
            ${!appState.isGuest?`<div style="display:flex;gap:16px;margin-top:8px;font-size:13px;">
              <span style="color:var(--primary);font-weight:700;">👥 ${friendsCount} ${t('friends')}</span>
              <span style="color:var(--muted);">📝 ${profilePosts.length} ${t('profilePosts')}</span>
            </div>`:''}
          </div>
          <div style="text-align:right">
            <div class="streak-badge"><span class="streak-fire">🔥</span>${appState.S.streak} ${t('dayStreak')}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">Lvl ${appState.S.level} · ${myScore.toLocaleString()} ${t('pts')}</div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:12px;color:var(--muted);">
            <span>${t('xpProgress')}</span><span>${(appState.S.xp||0)%1000}/1000 XP</span>
          </div>
          <div class="xp-bar-wrap"><div class="xp-bar" style="width:${xpPct}%"></div></div>
        </div>
      </div>

      <div class="two-col">
        <div>
          <div class="stats-grid" style="margin-bottom:16px;">
            <div class="stat-card"><div class="stat-glow stat-glow-green"></div><div class="stat-label">${t('earnings')}</div><div class="stat-value" style="font-size:22px;">${Number(appState.S.earnings||0).toLocaleString()} 🪙</div></div>
            <div class="stat-card"><div class="stat-glow stat-glow-blue"></div><div class="stat-label">${t('completed')}</div><div class="stat-value" style="font-size:22px;">${appState.S.completedTasks||0}</div></div>
          </div>
          ${pointsCard}
          <div class="card card-sm">
            <div class="section-title">⚙️ ${t('settings')}</div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;">${t('languageLabel')}</span><select id="profileLangBtn" class="btn btn-ghost btn-xs" style="padding:5px 8px;font-size:12px;border-radius:var(--r-sm);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);cursor:pointer;"><option value="UA" ${appState.S.lang==='UA'?'selected':''}>🇺🇦 UA</option><option value="EN" ${appState.S.lang==='EN'?'selected':''}>🇬🇧 EN</option><option value="DE" ${appState.S.lang==='DE'?'selected':''}>🇩🇪 DE</option><option value="FR" ${appState.S.lang==='FR'?'selected':''}>🇫🇷 FR</option><option value="ES" ${appState.S.lang==='ES'?'selected':''}>🇪🇸 ES</option><option value="PL" ${appState.S.lang==='PL'?'selected':''}>🇵🇱 PL</option></select></div>
              <div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;">${t('animationsLabel')}</span><button class="btn btn-${appState.S.animationsOn?'success':'ghost'} btn-xs" id="animToggleBtn">${appState.S.animationsOn?t('animOn'):t('animOff')}</button></div>
            </div>
          </div>
        </div>
        ${rightCol}
      </div>

      ${!appState.isGuest?`
      <div class="card" style="margin-top:20px;">
        <div class="section-title">📝 ${t('profilePosts')}</div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
          <div class="user-av" style="width:36px;height:36px;font-size:14px;flex-shrink:0;">${(appState.currentUser.name||'?').charAt(0).toUpperCase()}</div>
          <div style="flex:1;">
            <textarea id="profilePostText" class="form-textarea" rows="2" maxlength="500" placeholder="${t('profilePostPlaceholder')}" style="resize:vertical;"></textarea>
            <div style="text-align:right;margin-top:8px;">
              <button class="btn btn-primary btn-sm" id="profilePostBtn">${t('postOnProfile')}</button>
            </div>
          </div>
        </div>
        <div class="profile-posts" id="profilePostsList">
          ${profilePosts.length?profilePosts.map(p=>`
            <div class="profile-post-card">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <div class="user-av" style="width:28px;height:28px;font-size:11px;">${(appState.currentUser.name||'?').charAt(0).toUpperCase()}</div>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:600;">@${esc(appState.currentUser.username)}</div>
                  <div style="font-size:11px;color:var(--muted);">${fmtAgo(p.created_at)}</div>
                </div>
                <button class="action-btn" data-delete-profile-post="${p.id}" style="color:var(--danger);font-size:13px;">🗑</button>
              </div>
              <div style="font-size:14px;line-height:1.6;">${esc(p.text)}</div>
            </div>
          `).join(''):`<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">${t('writeOnProfile')}</div>`}
        </div>
      </div>
      `:''}

      ${calendarHtml}
      ${exchanger}
    </div>`;

  let _profileDirty = false;
  const _markDirty = () => { _profileDirty = true; };
  const _beforeUnload = (e) => { if (_profileDirty) { e.preventDefault(); e.returnValue = ''; } };

  document.getElementById('profileForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=document.getElementById('profileSaveBtn');
    const role=document.getElementById('pfRole').value.trim();
    const bio=document.getElementById('pfBio').value.trim();
    const skills=document.getElementById('pfSkills').value.trim();
    if(typeof setLoading==='function') setLoading(btn, true);
    const {ok,data}=await apiFetch(API.profile,{method:'POST',body:JSON.stringify({role,bio,skills})});
    if(typeof setLoading==='function') setLoading(btn, false);
    if(!ok){toast(data.message||'Profile save failed','error');return;}
    appState.S.role=role;
    appState.S.bio=bio;
    appState.S.skills=skills;
    if(data.user){appState.currentUser={...appState.currentUser,...data.user};}
    saveState();
    _profileDirty = false;
    toast(t('profileSaved'),'success');
  });

  // Character counters
  document.getElementById('pfRole')?.addEventListener('input', e => {
    _markDirty();
    const c = document.getElementById('pfRoleCounter');
    if(c) c.textContent = `${e.target.value.length}/60`;
  });
  document.getElementById('pfBio')?.addEventListener('input', e => {
    _markDirty();
    const c = document.getElementById('pfBioCounter');
    if(c) c.textContent = `${e.target.value.length}/500`;
  });
  document.getElementById('pfSkills')?.addEventListener('input', _markDirty);

  // Unsaved changes warning
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', _beforeUnload);

  // Copy profile link
  document.getElementById('copyProfileLinkBtn')?.addEventListener('click', () => {
    const link = `${location.origin}/#profile/${appState.currentUser?.username||''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => toast(t('copied') || 'Copied!', 'success')).catch(() => toast(link, 'info'));
    } else {
      toast(link, 'info');
    }
  });
  document.getElementById('guestCreateBtn')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('profileLangBtn')?.addEventListener('change',e=>{setLang(e.target.value);saveState();renderShell();navigate('profile');});
  document.getElementById('animToggleBtn')?.addEventListener('click',()=>{appState.S.animationsOn=!appState.S.animationsOn;document.body.classList.toggle('animations-off',!appState.S.animationsOn);saveState();navigate('profile');});
  document.getElementById('dailyCheckinBtn')?.addEventListener('click',dailyCheckin);
  document.getElementById('buyPointsBtn')?.addEventListener('click',buyPointsPack);

  document.getElementById('exchInitBtn')?.addEventListener('click',async()=>{
    const amount=parseFloat(document.getElementById('exchAmount')?.value)||0;
    const network=document.getElementById('exchNetwork')?.value||'TRC20';
    const alertEl=document.getElementById('exchangeAlert');
    if(amount<1||amount>10000){if(alertEl){alertEl.className='alert alert-error show';alertEl.textContent=t('exchangerRange');}return;}
    const {ok,data}=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'initiate',amount,network})});
    if(!ok){if(alertEl){alertEl.className='alert alert-error show';alertEl.textContent=data.message||t('exchangerError');}return;}
    const step2=document.getElementById('exchangeStep2');
    if(step2){
      const displayCurrency=data.currency||({TRC20:'USDT',BEP20:'USDT',ERC20:'ETH',BTC:'BTC',SOL:'SOL'}[network]||'USDT');
      const displayAmount=Number(data.amount_native||amount);
      step2.innerHTML=`<div class="card-flat" style="padding:10px;"><div style="font-size:12px;color:var(--muted);">${t('exchangerSendTo')} ${displayAmount.toLocaleString(undefined,{maximumFractionDigits:8})} ${esc(displayCurrency)} (${esc(data.network||network)}) ${t('exchangerToAddress')}</div><div style="font-size:13px;font-weight:700;color:var(--primary);word-break:break-all;margin:6px 0;">${esc(data.wallet_address||'')}</div><input id="exchTxHash" class="form-input" placeholder="tx hash" style="margin-top:8px;"><button id="exchConfirmBtn" class="btn btn-success btn-block" style="margin-top:8px;">${t('exchangerConfirm')}</button></div>`;
      document.getElementById('exchConfirmBtn')?.addEventListener('click',async()=>{
        const txHash=document.getElementById('exchTxHash')?.value?.trim();
        if(!txHash)return;
        const res=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'confirm',deposit_id:data.deposit_id,tx_hash:txHash})});
        if(!res.ok){toast(res.data.message||t('exchangerConfirmError'),'error');return;}
        await loadWallet();
        toast(res.data.message||t('depositDone'),'success');
        navigate('profile');
      });
    }
  });

  // Profile posts
  document.getElementById('profilePostBtn')?.addEventListener('click',()=>{
    const text=(document.getElementById('profilePostText')?.value||'').trim();
    if(!text){toast(t('required'),'error');return;}
    if(!appState.S.profilePosts) appState.S.profilePosts=[];
    const newPost={id:Date.now(),text,created_at:new Date().toISOString()};
    appState.S.profilePosts=[newPost,...appState.S.profilePosts];
    saveState();
    toast(t('postCreated'),'success');
    navigate('profile');
  });

  // Delete profile posts via delegate
  const postsList=document.getElementById('profilePostsList');
  if(postsList){
    delegate(postsList,'click','[data-delete-profile-post]',(e,b)=>{
      const postId=Number(b.dataset.deleteProfilePost);
      appState.S.profilePosts=(appState.S.profilePosts||[]).filter(p=>p.id!==postId);
      saveState();
      toast(t('postDeleted'),'success');
      navigate('profile');
    });
  }
}
