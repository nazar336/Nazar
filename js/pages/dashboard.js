'use strict';

import { appState, calcScore, loadTasks, loadLeaderboard } from '../state.js';
import { t } from '../i18n.js';
import { esc, fmtDate } from '../utils.js';
import { navigate } from '../router.js';
import { getLvlPriv, feedMediaLabel, diffLabel } from '../constants.js';

function _formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  const num = Number(n), abs = Math.abs(num);
  if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

export function renderDashboard(el){
  const fmtNum = _formatNumber;
  const myScore=calcScore({earnings:appState.S.earnings,completedTasks:appState.S.completedTasks,streak:appState.S.streak,level:appState.S.level,xp:appState.S.xp});
  const xpPct=Math.min(100,Math.round(((appState.S.xp||0)%1000)/10));
  const tasksLoaded=appState.S.tasks!==undefined&&appState.S.tasks!==null;
  const lbLoaded=appState.S.leaderboard!==undefined&&appState.S.leaderboard!==null;
  const trending=(appState.S.tasks||[]).filter(task=>task.status==='open').slice(0,3);
  const mini=(appState.S.leaderboard||[]).slice(0,3).map(u=>({
    name:u.name||u.username||'User',
    av:(u.name||u.username||'?').charAt(0).toUpperCase(),
    score:Number(u.score||u.xp||0)
  }));
  const streakVal=appState.S.streak||0;
  el.innerHTML=`
    <div class="fade-up">
      <!-- Hero welcome -->
      <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">${t('welcomeBack')}, ${appState.isGuest?t('guest'):esc(appState.currentUser.name||appState.currentUser.username)}</div>
            <h1 style="font-size:clamp(18px,3vw,24px);font-weight:900;margin-bottom:4px;">${appState.isGuest?t('welcomeGuestTitle'):t('dashMotivation')}</h1>
            <p style="font-size:14px;color:var(--text-soft);">${appState.isGuest?t('welcomeGuestDesc'):t('dashMotivationDesc')}</p>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="streak-badge${streakVal>0?' streak-pulse':''}"${streakVal>0?' style="animation:streak-pulse 2s ease-in-out infinite;"':''}>${streakVal} ${t('dayStreak')}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">${t('level')} ${appState.S.level||1} · ${appState.S.xp||0} XP</div>
          </div>
        </div>
      </div>

      <!-- Refresh -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="btn btn-ghost btn-sm" id="dashRefreshBtn">${t('refresh')}</button>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card"><div class="stat-glow stat-glow-green"></div><div class="stat-label">${t('balance')}</div><div class="stat-value" style="color:var(--primary)">${Number(appState.S.balance||0).toLocaleString()} <span style="font-size:12px;">LOL</span></div><div class="stat-sub">${t('available')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-blue"></div><div class="stat-label">${t('earnings')}</div><div class="stat-value">${Number(appState.S.earnings||0).toLocaleString()} <span style="font-size:12px;">LOL</span></div><div class="stat-sub">${t('totalEarned')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-purple"></div><div class="stat-label">${t('completed')}</div><div class="stat-value">${appState.S.completedTasks||0}</div><div class="stat-sub">${t('tasksDone')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-orange"></div><div class="stat-label">${t('level')} / ${t('score')}</div><div class="stat-value">${appState.S.level||1}</div><div class="stat-sub">${fmtNum(myScore)} ${t('pts')}</div></div>
      </div>

      <!-- XP bar -->
      <div class="card card-sm" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:700;">${t('xpProgress')}</span>
          <span style="font-size:12px;color:var(--muted);">${(appState.S.xp||0)%1000}/1000 XP → Lvl ${(appState.S.level||1)+1}</span>
        </div>
        <div class="xp-bar-wrap"><div class="xp-bar" style="width:${xpPct}%"></div></div>
      </div>

      <!-- Level Privileges -->
      ${(appState.S.completedTasks||0)<5&&!appState.isGuest?`
      <!-- Getting Started -->
      <div class="card" style="margin-bottom:20px;border-color:rgba(125,215,255,.15);background:rgba(125,215,255,.03);">
        <div class="section-title">${t('getStarted')}</div>
        <p style="font-size:13px;color:var(--text-soft);margin-bottom:14px;">${t('getStartedDesc')}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="card-flat" style="padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;color:${appState.S.bio?'var(--success)':'var(--muted)'};">${appState.S.bio?'✓':'○'}</span>
            <span style="font-size:13px;${appState.S.bio?'text-decoration:line-through;color:var(--muted);':''}">${t('step1Complete')}</span>
          </div>
          <div class="card-flat" style="padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;color:${(appState.S.completedTasks||0)>0?'var(--success)':'var(--muted)'};">${(appState.S.completedTasks||0)>0?'✓':'○'}</span>
            <span style="font-size:13px;${(appState.S.completedTasks||0)>0?'text-decoration:line-through;color:var(--muted);':''}">${t('step2Browse')}</span>
          </div>
          <div class="card-flat" style="padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;color:${(appState.S.feedPosts||[]).length>0?'var(--success)':'var(--muted)'};">${(appState.S.feedPosts||[]).length>0?'✓':'○'}</span>
            <span style="font-size:13px;${(appState.S.feedPosts||[]).length>0?'text-decoration:line-through;color:var(--muted);':''}">${t('step3Post')}</span>
          </div>
          <div class="card-flat" style="padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;color:${appState.S.doneCheckinToday?'var(--success)':'var(--muted)'};">${appState.S.doneCheckinToday?'✓':'○'}</span>
            <span style="font-size:13px;${appState.S.doneCheckinToday?'text-decoration:line-through;color:var(--muted);':''}">${t('step4Checkin')}</span>
          </div>
        </div>
      </div>
      `:''}
      <!-- Level Privileges -->
      ${(()=>{
        const priv=getLvlPriv(appState.S.level);
        const next=appState.S.level<12?getLvlPriv(appState.S.level+1):null;
        return `
      <div class="card" style="margin-bottom:20px;border-color:rgba(184,255,92,.2);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:0;">${t('lvlPrivileges')}</div>
          <div style="font-size:14px;font-weight:800;">${priv.badge} ${t(priv.titleKey)} · Lv ${appState.S.level}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('lvlMaxTasks')}</div>
            <div style="font-size:18px;font-weight:800;color:var(--primary);">${priv.maxTasks>=999?'∞':priv.maxTasks}</div>
          </div>
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('lvlCreateTasks')}</div>
            <div style="font-size:14px;font-weight:700;color:${priv.canCreate?'var(--success)':'var(--danger)'};">${priv.canCreate?t('lvlUnlocked'):t('lvlLocked')}</div>
            ${!priv.canCreate?`<div style="font-size:11px;color:var(--muted);margin-top:2px;">${t('lvlUnlocksAt')} 3</div>`:''}
          </div>
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('lvlMaxReward')}</div>
            <div style="font-size:14px;font-weight:700;color:var(--info);">${priv.canCreate?priv.maxReward.toLocaleString()+' LOL':'—'}</div>
          </div>
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('lvlDifficulty')}</div>
            <div style="font-size:14px;font-weight:700;">${diffLabel(priv.takeDiff)}</div>
          </div>
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('lvlFeedMedia')}</div>
            <div style="font-size:14px;font-weight:700;">${feedMediaLabel(priv.feedMedia)}</div>
          </div>
          <div class="card-flat" style="padding:12px;">
            <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t('chatRooms')}</div>
            <div style="font-size:14px;font-weight:700;">${appState.S.level>=9?t('diamondRoom'):appState.S.level>=6?t('goldRoom'):appState.S.level>=3?t('silverRoom'):t('bronzeRoom')}</div>
          </div>
        </div>
        ${next?`
        <div style="margin-top:14px;padding:12px;background:rgba(184,255,92,.05);border-radius:12px;border:1px dashed rgba(184,255,92,.15);">
          <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:8px;">${t('lvlNextLevel')}: ${next.badge} ${t(next.titleKey)} · Lv ${appState.S.level+1}</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--text-soft);">
            ${next.maxTasks>priv.maxTasks?`<span>${t('lvlMaxTasks')}: ${next.maxTasks>=999?'∞':next.maxTasks}</span>`:''}
            ${next.canCreate&&!priv.canCreate?`<span>${t('lvlCreateTasks')}: ${t('lvlUnlocked')}</span>`:''}
            ${next.maxReward>priv.maxReward?`<span>${t('lvlMaxReward')}: ${next.maxReward.toLocaleString()}</span>`:''}
            ${next.takeDiff.length>priv.takeDiff.length?`<span>${diffLabel(next.takeDiff)}</span>`:''}
            ${next.feedMedia!==priv.feedMedia?`<span>${feedMediaLabel(next.feedMedia)}</span>`:''}
          </div>
        </div>
        `:''}
      </div>`;
      })()}

      <div class="two-col" style="margin-bottom:20px;">
        <!-- Quick actions -->
        <div class="card">
          <div class="section-title">${t('quickActions')}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn btn-primary w-full" data-nav="tasks">${t('browseOpenTasks')}</button>
            <button class="btn btn-ghost w-full" data-nav="createTask">${t('publishNewTask')}</button>
            <button class="btn btn-info w-full" data-nav="wallet">${t('walletOverview')}</button>
          </div>
        </div>

        <!-- Achievements -->
        <div class="card">
          <div class="section-title">${t('achievements')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px;">
            ${appState.S.achievements.map(a=>`<span class="achievement">${esc(a)}</span>`).join('')}
            ${appState.S.completedTasks>=5&&!appState.S.achievements.includes('Lvl Climb')?'<span class="achievement">Lvl Climb</span>':''}
          </div>
        </div>
      </div>

      <div class="two-col">
        <!-- Trending tasks -->
        <div>
          <div class="section-title">${t('trendingTasks')} <span class="count">${trending.length}</span></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${!tasksLoaded?`<div class="card card-sm" style="text-align:center;padding:20px;color:var(--muted);"><span class="btn-loading" style="display:inline-block;width:18px;height:18px;vertical-align:middle;margin-right:6px;"></span>${t('loading')}</div>`:trending.length===0?`<div class="card card-sm" style="text-align:center;padding:20px;"><div style="font-size:14px;color:var(--muted);">${t('noTrendingTasks')}</div></div>`:trending.map(task=>`
              <div class="card card-sm" style="cursor:pointer;" data-nav="tasks">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                  <div>
                    <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${esc(task.title)}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      <span class="badge badge-${task.difficulty}">${t(task.difficulty)}</span>
                      <span class="chip" style="cursor:default;font-size:11px;padding:2px 8px;">${esc(task.category)}</span>
                    </div>
                  </div>
                  <div style="font-size:17px;font-weight:900;color:var(--primary);white-space:nowrap;">${task.reward} LOL</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Mini leaderboard -->
        <div>
          <div class="section-title">${t('miniLeaderboard')}</div>
          ${!lbLoaded?`<div class="card" style="text-align:center;padding:20px;color:var(--muted);"><span class="btn-loading" style="display:inline-block;width:18px;height:18px;vertical-align:middle;margin-right:6px;"></span>${t('loading')}</div>`:mini.length===0?`<div class="card" style="text-align:center;padding:20px;"><div style="font-size:14px;color:var(--muted);">${t('noLeaderboard')}</div></div>`:`<div class="card" style="padding:0;">
            ${mini.map((u,i)=>`
              <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:${i<mini.length-1?'1px solid var(--line)':'none'};">
                <div style="font-size:13px;font-weight:800;color:${i===0?'var(--primary)':i===1?'var(--info)':'var(--muted)'};width:16px;">#${i+1}</div>
                <div class="user-av" style="width:32px;height:32px;font-size:12px;">${u.av}</div>
                <div style="flex:1"><div style="font-size:13px;font-weight:700;">${esc(u.name)}</div><div style="font-size:11px;color:var(--muted);">${u.score.toLocaleString()} pts</div></div>
              </div>`).join('')}
          </div>`}
        </div>
      </div>
    </div>`;
  
  // Event handlers for quick action buttons and task cards
  el.querySelectorAll('[data-nav]').forEach(elem => {
    const page = elem.dataset.nav;
    if(page) {
      elem.addEventListener('click', () => navigate(page));
    }
  });

  // Refresh button
  document.getElementById('dashRefreshBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('dashRefreshBtn');
    if(btn) { btn.disabled = true; btn.textContent = '⏳ …'; }
    try {
      if(typeof loadTasks === 'function') await loadTasks('open');
      if(typeof loadLeaderboard === 'function') await loadLeaderboard();
    } catch(_){}
    renderDashboard(el);
  });
}
