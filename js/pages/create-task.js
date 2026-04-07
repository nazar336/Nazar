'use strict';

import { appState, saveState, loadTasks } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { fmtDate, toast, showAlert, hideAlert, addNotif, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { CATEGORIES, API, getLvlPriv } from '../constants.js';

const DRAFT_KEY = 'lolanceizi_task_draft';

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch(_) { return {}; }
}
function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch(_) {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch(_) {}
}

export function renderCreateTask(el){
  const priv=getLvlPriv(appState.S.level);
  const draft=loadDraft();

  el.innerHTML=`
    <div class="fade-up" style="max-width:900px;">
      <!-- Page header -->
      <div class="page-header card" style="margin-bottom:18px;">
        <div>
          <div class="page-header-label">✚ ${t('createTask')}</div>
          <h1 class="page-header-title">${t('createTask')}</h1>
          <p class="page-header-desc">${t('createTaskTip')}</p>
        </div>
      </div>
      ${(()=>{
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
            <span>${t('lvlMaxReward')}: <b style="color:var(--primary);">${priv.maxReward.toLocaleString()} LOL</b></span>
          </div>` : '';
      })()}
      <div class="two-col">
        <div class="card">
          <div id="ctAlert" class="alert" style="margin-bottom:14px;"></div>
          <form id="createTaskForm" style="display:flex;flex-direction:column;gap:16px;${(!appState.isGuest&&!priv.canCreate)?'opacity:.4;pointer-events:none;':''}">
            <div class="form-group"><label class="form-label">${t('titleLabel')} *</label><input type="text" id="ctTitle" class="form-input" placeholder="${t('titlePlaceholder')}" maxlength="120" value="${draft.title||''}" required><div id="ctTitleCounter" style="font-size:11px;color:var(--muted);text-align:right;margin-top:2px;">${(draft.title||'').length}/120</div></div>
            <div class="form-group"><label class="form-label">${t('description')} *</label><textarea id="ctDesc" class="form-textarea" rows="4" placeholder="${t('descPlaceholder')}" required>${draft.desc||''}</textarea><div id="ctDescCounter" style="font-size:11px;color:var(--muted);text-align:right;margin-top:2px;">${(draft.desc||'').length}</div></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('category')}</label>
                <select id="ctCat" class="form-select form-input"><option value="">${t('selectOption')}</option>${CATEGORIES.map(c=>`<option${draft.cat===c?' selected':''}>${c}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">${t('difficulty')}</label>
                <select id="ctDiff" class="form-select form-input"><option value="easy"${draft.diff==='easy'?' selected':''}>${t('easy')}</option><option value="medium"${(!draft.diff||draft.diff==='medium')?' selected':''}>${t('medium')}</option><option value="hard"${draft.diff==='hard'?' selected':''}>${t('hard')}</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('reward')} (LOL)</label><input type="number" id="ctReward" class="form-input" min="1" max="${priv.canCreate?priv.maxReward:99999}" placeholder="100" value="${draft.reward||''}"><div id="ctRewardWarning" style="font-size:11px;min-height:14px;margin-top:2px;"></div></div>
              <div class="form-group"><label class="form-label">${t('slots')}</label><input type="number" id="ctSlots" class="form-input" min="1" max="20" value="${draft.slots||'2'}"></div>
            </div>
            <div class="form-group"><label class="form-label">${t('deadline')}</label><input type="date" id="ctDeadline" class="form-input" value="${draft.deadline||''}"><div id="ctDeadlineWarning" style="font-size:11px;min-height:14px;margin-top:2px;"></div></div>
            <button type="submit" id="ctSubmitBtn" class="btn btn-primary btn-block"><span class="btn-txt">🚀 ${t('publish')}</span></button>
          </form>
        </div>
        <div>
          <div class="section-title">👁 ${t('preview')}</div>
          <div id="taskPreview" class="task-card" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;gap:8px;"><span class="badge badge-open">${t('open')}</span><span class="badge badge-medium">${t('medium')}</span></div>
            <div class="task-title" id="pvTitle" style="color:var(--muted);">${t('previewTitlePh')}</div>
            <div class="task-desc" id="pvDesc" style="color:var(--muted-2);">${t('previewDescPh')}</div>
            <div class="task-meta"><span class="chip" id="pvCat" style="cursor:default;font-size:11px;">${t('category')}</span><span class="text-xs text-muted" id="pvSlots">2 ${t('slots')}</span></div>
            <div class="task-footer"><span class="text-xs text-muted" id="pvDeadline">${t('noDeadline')}</span><div class="task-reward" id="pvReward">0<span>LOL</span></div></div>
            <div id="pvTotalCost" style="font-size:12px;color:var(--muted);margin-top:6px;text-align:right;"></div>
          </div>
        </div>
      </div>
    </div>`;

  // Live preview + auto-save + counters
  const update=()=>{
    const titleVal=document.getElementById('ctTitle').value;
    const descVal=document.getElementById('ctDesc').value;
    const catVal=document.getElementById('ctCat').value;
    const slotsVal=document.getElementById('ctSlots').value||'2';
    const rewardVal=document.getElementById('ctReward').value||'0';
    const dl=document.getElementById('ctDeadline').value;

    document.getElementById('pvTitle').textContent=titleVal||t('previewTitlePh');
    document.getElementById('pvDesc').textContent=descVal||t('previewDescPh');
    document.getElementById('pvCat').textContent=catVal||t('category');
    document.getElementById('pvSlots').textContent=slotsVal+' '+t('slots');
    document.getElementById('pvReward').innerHTML=`${rewardVal}<span>LOL</span>`;
    document.getElementById('pvDeadline').textContent=dl?'📅 '+fmtDate(dl):t('noDeadline');

    // Estimated total cost
    const total=Number(rewardVal||0)*Number(slotsVal||1);
    const pvCost=document.getElementById('pvTotalCost');
    if(pvCost) pvCost.textContent=total>0?`💰 ${t('total')||'Total'}: ${total.toLocaleString()} LOL`:'';

    // Title counter
    const titleCounter=document.getElementById('ctTitleCounter');
    if(titleCounter) titleCounter.textContent=`${titleVal.length}/120`;

    // Desc counter
    const descCounter=document.getElementById('ctDescCounter');
    if(descCounter) descCounter.textContent=`${descVal.length}`;

    // Reward cap warning
    const rw=document.getElementById('ctRewardWarning');
    if(rw && priv.canCreate){
      const rv=Number(rewardVal||0);
      if(rv>priv.maxReward) { rw.textContent=`⚠️ ${t('lvlMaxReward')||'Max reward'}: ${priv.maxReward.toLocaleString()} LOL (Lv ${appState.S.level})`; rw.style.color='var(--warning)'; }
      else { rw.textContent=''; }
    }

    // Deadline validation
    const dlWarn=document.getElementById('ctDeadlineWarning');
    if(dlWarn){
      if(dl && new Date(dl) <= new Date()) { dlWarn.textContent='⚠️ '+(t('deadlinePast')||'Deadline must be in the future'); dlWarn.style.color='var(--warning)'; }
      else { dlWarn.textContent=''; }
    }

    // Auto-save draft
    saveDraft({title:titleVal,desc:descVal,cat:catVal,diff:document.getElementById('ctDiff').value,reward:rewardVal,slots:slotsVal,deadline:dl});
  };
  document.querySelectorAll('#createTaskForm input,#createTaskForm textarea,#createTaskForm select').forEach(i=>i.addEventListener('input',update));

  // Trigger update to set initial counters from draft
  update();

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

    // Validate reward against level cap
    if(priv.canCreate && reward>priv.maxReward){showAlert('ctAlert',(t('lvlMaxReward')||'Max reward')+': '+priv.maxReward.toLocaleString()+' LOL');return;}

    // Validate deadline in the future
    if(deadline && new Date(deadline) <= new Date()){showAlert('ctAlert',t('deadlinePast')||'Deadline must be in the future');return;}

    const btn=document.getElementById('ctSubmitBtn');
    if(typeof setLoading==='function') setLoading(btn, true);
    const {ok,data}=await apiFetch(API.tasks,{method:'POST',body:JSON.stringify({title,description:desc,category:cat,difficulty:diff,reward,slots,deadline:deadline||null})});
    if(typeof setLoading==='function') setLoading(btn, false);
    if(!ok||!data.task_id){showAlert('ctAlert',data.message||'Task creation failed');return;}

    const newTask={
      id:String(data.task_id),title,description:desc,category:cat,reward,difficulty:diff,
      slots,slotsLeft:slots,status:'open',progress:0,deadline:deadline||null,
      owner:appState.currentUser.name||appState.currentUser.username,participants:[],createdAt:new Date().toISOString(),
      creator_id:Number(appState.currentUser.id||0),taken_slots:0,my_assignment_status:null,pending_submissions:0
    };

    appState.S.tasks.unshift(newTask);
    saveState();
    clearDraft();
    addNotif(`${t('taskCreated')} "${title}"!`,'success');
    toast(t('taskCreated'),'success');
    loadTasks('my');
    navigate('tasks');
  });
  document.getElementById('goToDashForLvl')?.addEventListener('click',()=>navigate('dashboard'));
}
