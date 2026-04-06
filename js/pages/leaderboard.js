'use strict';

import { appState, calcScore } from '../state.js';
import { t } from '../i18n.js';
import { esc } from '../utils.js';

export function renderLeaderboard(el){
  const board=(appState.S.leaderboard||[]).map((u,idx)=>({
    id:Number(u.id||0),
    name:u.name||u.username||'User',
    username:u.username||'user',
    av:(u.name||u.username||'?').charAt(0).toUpperCase(),
    earnings:Number(u.earnings||0),
    completed:Number(u.completed_tasks||0),
    level:Number(u.level||1),
    xp:Number(u.xp||0),
    streak:Number(u.streak||0),
    score:Number(u.score||0),
    rank:Number(u.position||idx+1),
    achievements:[]
  }));
  const myScore=calcScore({earnings:appState.S.earnings,completedTasks:appState.S.completedTasks,streak:appState.S.streak,level:appState.S.level,xp:appState.S.xp});
  const meId=Number(appState.currentUser?.id||0);
  const top3=board.slice(0,3);
  const medalOrder=[1,0,2]; // 2nd, 1st, 3rd
  const medals=['🥈','👑','🥉'];

  el.innerHTML=`
    <div class="fade-up">
      <!-- Page header -->
      <div class="page-header card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div class="page-header-label">🏆 ${t('leaderboard')}</div>
            <h1 class="page-header-title">${t('leaderboard')}</h1>
            <p class="page-header-desc">${t('leaderboardDesc')}</p>
          </div>
          <div class="badge badge-info" style="font-size:12px;padding:6px 12px;">${t('seasonInfo')}</div>
        </div>
      </div>

      <!-- Podium -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title" style="margin-bottom:14px;">🏆 ${t('leaderboard')}</div>
        <div class="podium">
          ${medalOrder.map((idx,pos)=>{
            const u=top3[idx];if(!u)return '';
            const rank=idx+1;
            return `<div class="podium-item">
              <div class="podium-av rank-${rank}" style="position:relative;">
                ${rank===1?`<span class="podium-crown">👑</span>`:''}
                ${u.av}
              </div>
              <div class="podium-bar rank-${rank}" style="display:flex;align-items:center;justify-content:center;">
                <span style="font-size:18px;">${medals[pos]}</span>
              </div>
              <div class="podium-name">${esc(u.name)}</div>
              <div class="podium-score">${u.score.toLocaleString()} pts</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Full table -->
      <div class="card" style="padding:0;">
        <div style="overflow-x:auto;">
          <table class="rank-table">
            <thead><tr>
              <th>#</th><th>User</th><th>${t('score')}</th>
              <th>${t('earnings')}</th><th>${t('completed')}</th>
              <th>${t('streak')}</th><th>${t('badges')}</th>
            </tr></thead>
            <tbody>
              ${board.map((u,i)=>`
                <tr class="${Number(u.id)===meId?'me':''}">
                  <td style="font-weight:800;${i<3?'color:var(--warning);':''}">${u.rank||i+1}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-av" style="width:30px;height:30px;font-size:11px;">${u.av}</div>
                      <div>
                        <div style="font-size:13px;font-weight:700;">${esc(u.name)}${Number(u.id)===meId?' <span style="font-size:11px;color:var(--primary);">('+t('you')+')</span>':''}</div>
                        <div style="font-size:11px;color:var(--muted);">@${esc(u.username)}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:800;">${u.score.toLocaleString()}</td>
                  <td style="color:var(--success);">${(u.earnings||0).toLocaleString()} 🪙</td>
                  <td>${u.completed||0}</td>
                  <td><span class="streak-badge" style="font-size:12px;"><span style="font-size:14px;">🔥</span>${u.streak||0}</span></td>
                  <td><div style="display:flex;gap:4px;flex-wrap:wrap;">${(u.achievements||[]).slice(0,2).map(a=>`<span style="font-size:10px;background:rgba(255,200,108,.1);border:1px solid rgba(255,200,108,.2);padding:2px 6px;border-radius:99px;color:var(--warning);">${esc(a)}</span>`).join('')}</div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Your position -->
      <div class="card" style="margin-top:16px;background:var(--primary-dim);border-color:rgba(184,255,92,.2);">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div><div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.06em;">${t('yourPosition')}</div>
            <div style="font-size:26px;font-weight:900;">#${Number(appState.S.userPosition||0)||'—'}</div></div>
          <div class="divider" style="width:1px;height:40px;margin:0;"></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('score')}</div><div style="font-size:18px;font-weight:800;">${myScore.toLocaleString()}</div></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('level')}</div><div style="font-size:18px;font-weight:800;">${appState.S.level}</div></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('streak')}</div><div style="font-size:18px;font-weight:800;">🔥 ${appState.S.streak}</div></div>
        </div>
      </div>

      <!-- Tip -->
      <div class="card-flat" style="margin-top:16px;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">💡</span>
        <span style="font-size:13px;color:var(--text-soft);">${t('leaderboardTip')}</span>
      </div>
    </div>`;
}
