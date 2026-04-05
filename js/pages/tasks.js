'use strict';

import { appState, saveState, loadTasks, syncProfile, loadWallet } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtDate, toast, addNotif, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { CATEGORIES, API, getLvlPriv } from '../constants.js';
import { delegate } from '../event-delegation.js';

function _debounce(fn, delay) {
  let timer;
  return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

export function renderTasks(el){
  let filterStatus='all', filterCat='all', searchQ='';
  function filtered(){
    const all=appState.S.tasks||[];
    return all.filter(task=>{
      if(filterStatus!=='all'&&task.status!==filterStatus)return false;
      if(filterCat!=='all'&&task.category!==filterCat)return false;
      if(searchQ&&!task.title.toLowerCase().includes(searchQ.toLowerCase()))return false;
      return true;
    });
  }
  function renderGrid(){
    const list=filtered();
    const total=(appState.S.tasks||[]).length;
    const grid=document.getElementById('tasksGrid');
    if(!grid)return;
    const countEl=document.getElementById('tasksCount');
    if(countEl) countEl.textContent=`${list.length}/${total}`;
    if(!list.length){grid.innerHTML=`<div class="empty" style="grid-column:1/-1;"><div class="empty-icon">📭</div><h3>${t('noTasksFound')}</h3><p>${t('adjustFilters')}</p></div>`;return;}
    grid.innerHTML=list.map(task=>{
      const participantsList=task.participants||[];
      const isOwner=!appState.isGuest&&appState.currentUser&&(
        task.owner===appState.currentUser.name||
        task.owner===appState.currentUser.username||
        Number(task.creator_id||0)===Number(appState.currentUser.id||0)
      );
      const slotsTotal=Number(task.slots||1);
      const takenSlots=(task.taken_slots!==undefined&&task.taken_slots!==null)
        ?Number(task.taken_slots)
        :Math.max(0,slotsTotal-Number(task.slotsLeft??slotsTotal));
      const slotsLeft=(task.slotsLeft!==undefined&&task.slotsLeft!==null)
        ?Number(task.slotsLeft)
        :Math.max(0,slotsTotal-takenSlots);
      const myAssignmentStatus=task.my_assignment_status||null;
      const lvlPriv=getLvlPriv(appState.S.level);
      const diffAllowed=appState.isGuest||lvlPriv.takeDiff.includes(task.difficulty||'easy');
      const canTake=!appState.isGuest&&task.status!=='completed'&&task.status!=='cancelled'&&slotsLeft>0&&appState.currentUser&&!isOwner&&!myAssignmentStatus&&!participantsList.includes(appState.currentUser.username)&&diffAllowed;
      const canSubmit=!appState.isGuest&&appState.currentUser&&(myAssignmentStatus==='taken'||participantsList.includes(appState.currentUser.username)&&task.status==='in_progress');
      const canApprove=!appState.isGuest&&isOwner&&Number(task.pending_submissions||0)>0;
      const ownerInitial=(task.owner||'?').charAt(0).toUpperCase();
      return `<div class="task-card" data-tid="${task.id}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge badge-${task.status}">${task.status==='open'?t('open'):task.status==='in_progress'?t('inProgress'):task.status==='completed'?t('completed'):t('cancelled')}</span>
            <span class="badge badge-${task.difficulty}">${t(task.difficulty)}${!diffAllowed?' 🔒':''}</span>
          </div>
          <div class="task-reward">${task.reward}<span>coins</span></div>
        </div>
        <div class="task-title">${esc(task.title)}</div>
        <div class="task-desc">${esc(task.description)}</div>
        <div class="task-meta">
          <span class="chip" style="cursor:default;font-size:11px;">${esc(task.category)}</span>
          <span class="text-xs text-muted">👤 ${slotsLeft}/${slotsTotal} slots</span>
          <span class="text-xs text-muted">📅 ${fmtDate(task.deadline)}</span>
        </div>
        ${task.status==='in_progress'?`<div class="progress-wrap"><div class="progress-bar" style="width:${task.progress}%"></div></div>`:``}
        <div class="task-footer">
          <span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:4px;"><span class="user-av" style="width:20px;height:20px;font-size:9px;flex-shrink:0;">${ownerInitial}</span> ${esc(task.owner)}</span>
          <div style="display:flex;gap:7px;">
            ${canTake?`<button class="btn btn-primary btn-xs take-btn" data-tid="${task.id}" aria-label="${t('takeTask')} – ${esc(task.title)}">${t('takeTask')}</button>`:''}${!appState.isGuest&&!diffAllowed&&task.status==='open'?`<span style="font-size:11px;color:var(--warning);">🔒 ${t('lvlDiffLocked')}</span>`:''}
            ${canSubmit?`<button class="btn btn-success btn-xs complete-btn" data-tid="${task.id}" aria-label="${t('completeTask')} – ${esc(task.title)}">${t('completeTask')}</button>`:''}
            ${canApprove?`<button class="btn btn-info btn-xs approve-btn" data-tid="${task.id}" aria-label="${t('confirm')} – ${esc(task.title)}">${t('confirm')}</button>`:''}
          </div>
        </div>
      </div>`;
    }).join('');
    // Events via delegate
    delegate(grid, 'click', '.take-btn', async (e, btn) => {
      e.stopPropagation();
      if(typeof setLoading==='function') setLoading(btn, true);
      await takeTask(btn.dataset.tid);
      if(typeof setLoading==='function') setLoading(btn, false);
    });
    delegate(grid, 'click', '.complete-btn', async (e, btn) => {
      e.stopPropagation();
      if(typeof setLoading==='function') setLoading(btn, true);
      await completeTask(btn.dataset.tid, 'submit');
      if(typeof setLoading==='function') setLoading(btn, false);
      renderGrid();
    });
    delegate(grid, 'click', '.approve-btn', async (e, btn) => {
      e.stopPropagation();
      if(typeof setLoading==='function') setLoading(btn, true);
      await completeTask(btn.dataset.tid, 'approve');
      if(typeof setLoading==='function') setLoading(btn, false);
      renderGrid();
    });
  }

  const debouncedSearch = _debounce((val) => { searchQ = val; renderGrid(); }, 300);

  el.innerHTML=`
    <div class="fade-up">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="font-size:20px;font-weight:900;">${t('tasks')}</h1>
          <span id="tasksCount" style="font-size:12px;color:var(--muted);font-weight:600;">${(appState.S.tasks||[]).length}/${(appState.S.tasks||[]).length}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn btn-ghost btn-sm" id="refreshTasksBtn" aria-label="${t('refresh') || 'Refresh'}">🔄 ${t('refresh') || 'Refresh'}</button>
          <span style="font-size:12px;color:var(--muted);">${getLvlPriv(appState.S.level).badge} Lv ${appState.S.level} · ${t('lvlMaxTasks')}: ${getLvlPriv(appState.S.level).maxTasks>=999?'∞':getLvlPriv(appState.S.level).maxTasks}</span>
          <button class="btn btn-primary btn-sm" id="openCreateTaskBtn" ${!appState.isGuest&&!getLvlPriv(appState.S.level).canCreate?'style="opacity:.5;"':''}>${getLvlPriv(appState.S.level).canCreate?'+ '+t('createTask'):'🔒 Lv 3'}</button>
        </div>
      </div>
      <!-- Search + filters -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="position:relative;flex:1;min-width:200px;">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;">🔍</span>
          <input type="text" id="taskSearch" class="form-input" style="padding-left:36px;" placeholder="${t('searchTasks')}">
        </div>
        <select id="taskStatusFilter" class="form-select form-input" style="width:auto;min-width:130px;">
          <option value="all">${t('all')}</option>
          <option value="open">${t('open')}</option>
          <option value="in_progress">${t('inProgress')}</option>
          <option value="completed">${t('completed')}</option>
        </select>
      </div>
      <div class="chips-row" id="catChips" style="margin-bottom:18px;">
        <button class="chip active" data-cat="all">${t('all')}</button>
        ${CATEGORIES.map(c=>`<button class="chip" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="tasks-grid" id="tasksGrid"></div>
    </div>`;

  renderGrid();
  document.getElementById('openCreateTaskBtn')?.addEventListener('click',()=>navigate('createTask'));
  document.getElementById('taskSearch')?.addEventListener('input',e=>{
    searchQ=e.target.value;renderGrid();
    debouncedSearch(e.target.value);
  });
  document.getElementById('taskStatusFilter')?.addEventListener('change',e=>{filterStatus=e.target.value;renderGrid();});
  document.getElementById('catChips')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-cat]');if(!btn)return;
    document.querySelectorAll('#catChips .chip').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');filterCat=btn.dataset.cat;renderGrid();
  });
  document.getElementById('refreshTasksBtn')?.addEventListener('click', async () => {
    const btn=document.getElementById('refreshTasksBtn');
    if(btn){ btn.disabled=true; btn.textContent='⏳ …'; }
    try { await loadTasks('open'); } catch(_){}
    if(btn){ btn.disabled=false; btn.textContent='🔄 '+(t('refresh')||'Refresh'); }
    renderGrid();
  });
}

export async function takeTask(tid){
  if(appState.isGuest){toast(t('guestRegTask'),'warning');return;}
  const task=(appState.S.tasks||[]).find(task=>String(task.id)===String(tid));
  const serverTaskId=Number(tid);

  if(!Number.isInteger(serverTaskId) || serverTaskId<=0){
    toast('Invalid task ID','error');
    return;
  }

  const {ok,data}=await apiFetch(API.takeTask,{method:'POST',body:JSON.stringify({task_id:serverTaskId})});
  if(!ok){toast(data.message||'Error taking task','error');return;}
  addNotif(`${t('notifTaskTaken')} "${task?.title||'#'+tid}"!`,'success');
  toast(t('taskTaken'),'success');
  await loadTasks('open');
  await loadTasks('my');
  await loadTasks('taken');
  navigate('tasks');
}

export async function completeTask(tid,action='submit'){
  const task=(appState.S.tasks||[]).find(task=>String(task.id)===String(tid));
  const serverTaskId=Number(tid);

  if(!Number.isInteger(serverTaskId) || serverTaskId<=0){
    toast('Invalid task ID','error');
    return;
  }

  const {ok,data}=await apiFetch(API.completeTask,{method:'POST',body:JSON.stringify({task_id:serverTaskId,action})});
  if(!ok){toast(data.message||'Error','error');return;}
  if(action==='submit'){
    toast(t('taskCompleted'),'success');
  }else{
    addNotif(`Completed "${task?.title||('#'+tid)}" · +${Number(data.reward||0)} coins!`,'success');
    toast(data.message||t('confirm'),'success');
    await syncProfile();
    await loadWallet();
  }
  await loadTasks('open');
  await loadTasks('my');
  await loadTasks('taken');
  navigate('tasks');
}
