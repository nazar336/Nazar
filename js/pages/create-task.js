'use strict';

import { appState, saveState, loadTasks } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { fmtDate, toast, showAlert, hideAlert, addNotif } from '../utils.js';
import { navigate } from '../router.js';
import { CATEGORIES, API, getLvlPriv } from '../constants.js';

export function renderCreateTask(el){
  el.innerHTML=`
    <div class="fade-up" style="max-width:900px;">
      <h1 style="font-size:20px;font-weight:900;margin-bottom:20px;">${t('createTask')}</h1>
      ${(()=>{
        const priv=getLvlPriv(appState.S.level);
        if(!appState.isGuest && !priv.canCreate) return `
          <div class="card" style="margin-bottom:20px;background:rgba(255,100,100,.06);border-color:rgba(255,100,100,.2);">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="font-size:32px;">🔒</div>
              <div>
                <div style="font-size:15px;font-weight:800;margin-bottom:4px;">${t('lvlCreateLocked')}</div>
                <div style="font-size:13px;color:var(--muted);">${t('lvlYourLevel')}: ${priv.badge} Lv ${appState.S.level} · ${t('lvlUpgrade')}</div>
                <button class="btn btn-primary btn-sm" style="margin-top:8px;" id="goToDashForLvl">${t('earnPoints')} →</button>
              </div>
            </div>
          </div>`;
        return priv.canCreate ? `
          <div class="card-flat" style="padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted);">
            <span>${priv.badge} Lv ${appState.S.level}</span>
            <span>·</span>
            <span>${t('lvlMaxReward')}: <b style="color:var(--primary);">${priv.maxReward.toLocaleString()} coins</b></span>
          </div>` : '';
      })()}
      <div class="two-col">
        <div class="card">
          <div id="ctAlert" class="alert" style="margin-bottom:14px;"></div>
          <form id="createTaskForm" style="display:flex;flex-direction:column;gap:16px;${(!appState.isGuest&&!getLvlPriv(appState.S.level).canCreate)?'opacity:.4;pointer-events:none;':''}">
            <div class="form-group"><label class="form-label">${t('titleLabel')} *</label><input type="text" id="ctTitle" class="form-input" placeholder="${t('titlePlaceholder')}" maxlength="120" required></div>
            <div class="form-group"><label class="form-label">${t('description')} *</label><textarea id="ctDesc" class="form-textarea" rows="4" placeholder="${t('descPlaceholder')}" required></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('category')}</label>
                <select id="ctCat" class="form-select form-input"><option value="">${t('selectOption')}</option>${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">${t('difficulty')}</label>
                <select id="ctDiff" class="form-select form-input"><option value="easy">${t('easy')}</option><option value="medium" selected>${t('medium')}</option><option value="hard">${t('hard')}</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('reward')} (coins)</label><input type="number" id="ctReward" class="form-input" min="1" placeholder="100"></div>
              <div class="form-group"><label class="form-label">${t('slots')}</label><input type="number" id="ctSlots" class="form-input" min="1" max="20" value="2"></div>
            </div>
            <div class="form-group"><label class="form-label">${t('deadline')}</label><input type="date" id="ctDeadline" class="form-input"></div>
            <button type="submit" class="btn btn-primary btn-block"><span class="btn-txt">🚀 ${t('publish')}</span></button>
          </form>
        </div>
        <div>
          <div class="section-title">👁 ${t('preview')}</div>
          <div id="taskPreview" class="task-card" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;gap:8px;"><span class="badge badge-open">${t('open')}</span><span class="badge badge-medium">${t('medium')}</span></div>
            <div class="task-title" id="pvTitle" style="color:var(--muted);">${t('previewTitlePh')}</div>
            <div class="task-desc" id="pvDesc" style="color:var(--muted-2);">${t('previewDescPh')}</div>
            <div class="task-meta"><span class="chip" id="pvCat" style="cursor:default;font-size:11px;">${t('category')}</span><span class="text-xs text-muted" id="pvSlots">2 ${t('slots')}</span></div>
            <div class="task-footer"><span class="text-xs text-muted" id="pvDeadline">${t('noDeadline')}</span><div class="task-reward" id="pvReward">0<span>coins</span></div></div>
          </div>
        </div>
      </div>
    </div>`;

  // Live preview
  const update=()=>{
    document.getElementById('pvTitle').textContent=document.getElementById('ctTitle').value||t('previewTitlePh');
    document.getElementById('pvDesc').textContent=document.getElementById('ctDesc').value||t('previewDescPh');
    document.getElementById('pvCat').textContent=document.getElementById('ctCat').value||t('category');
    document.getElementById('pvSlots').textContent=(document.getElementById('ctSlots').value||'2')+' '+t('slots');
    document.getElementById('pvReward').innerHTML=`${document.getElementById('ctReward').value||0}<span>coins</span>`;
    const dl=document.getElementById('ctDeadline').value;
    document.getElementById('pvDeadline').textContent=dl?'📅 '+fmtDate(dl):t('noDeadline');
  };
  document.querySelectorAll('#createTaskForm input,#createTaskForm textarea,#createTaskForm select').forEach(i=>i.addEventListener('input',update));

  document.getElementById('createTaskForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(appState.isGuest){toast(t('guestRegCreate'),'warning');return;}
    const title=document.getElementById('ctTitle').value.trim();
    const desc=document.getElementById('ctDesc').value.trim();
    const cat=document.getElementById('ctCat').value;
    const diff=document.getElementById('ctDiff').value;
    const reward=parseFloat(document.getElementById('ctReward').value)||0;
    const slots=parseInt(document.getElementById('ctSlots').value)||2;
    const deadline=document.getElementById('ctDeadline').value;
    if(!title||!desc||!cat){showAlert('ctAlert',t('required'));return;}
    hideAlert('ctAlert');

    if(reward<=0||slots<=0){showAlert('ctAlert',t('invalidAmount'));return;}
    const {ok,data}=await apiFetch(API.tasks,{method:'POST',body:JSON.stringify({title,description:desc,category:cat,difficulty:diff,reward,slots,deadline:deadline||null})});
    if(!ok||!data.task_id){showAlert('ctAlert',data.message||'Task creation failed');return;}

    const newTask={
      id:String(data.task_id),title,description:desc,category:cat,reward,difficulty:diff,
      slots,slotsLeft:slots,status:'open',progress:0,deadline:deadline||null,
      owner:appState.currentUser.name||appState.currentUser.username,participants:[],createdAt:new Date().toISOString(),
      creator_id:Number(appState.currentUser.id||0),taken_slots:0,my_assignment_status:null,pending_submissions:0
    };

    appState.S.tasks.unshift(newTask);
    saveState();
    addNotif(`${t('taskCreated')} "${title}"!`,'success');
    toast(t('taskCreated'),'success');
    loadTasks('my');
    navigate('tasks');
  });
  document.getElementById('goToDashForLvl')?.addEventListener('click',()=>navigate('dashboard'));
}
