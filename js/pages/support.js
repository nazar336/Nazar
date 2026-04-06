'use strict';

import { appState, loadSupport } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtAgo, toast, showAlert, hideAlert, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { API } from '../constants.js';
import { renderAuth } from './auth.js';

export function renderSupport(el){
  const faqs = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    { q: t('faqQ4'), a: t('faqA4') },
    { q: t('faqQ5'), a: t('faqA5') },
  ];

  el.innerHTML=`
    <div class="fade-up" style="max-width:740px;">
      <!-- Page header -->
      <div class="page-header card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div class="page-header-label">🛟 ${t('support')}</div>
            <h1 class="page-header-title">${t('support')}</h1>
            <p class="page-header-desc">${t('supportDesc')}</p>
          </div>
          <div class="badge badge-success" style="font-size:12px;padding:6px 12px;">${t('responseTime')}</div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">❓ ${t('faq')}</div>
        <div id="faqList">
          ${faqs.map((f,i)=>`
            <div class="faq-item" data-fi="${i}">
              <button class="faq-q">${esc(f.q)}<span class="arrow">▾</span></button>
              <div class="faq-a">${esc(f.a)}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Knowledge Base -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">📚 ${t('knowledgeBase')}</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="card-flat" style="padding:12px;display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:20px;flex-shrink:0;">💡</span>
            <div style="font-size:13px;color:var(--text-soft);line-height:1.6;">${t('kbTip1')}</div>
          </div>
          <div class="card-flat" style="padding:12px;display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:20px;flex-shrink:0;">🔥</span>
            <div style="font-size:13px;color:var(--text-soft);line-height:1.6;">${t('kbTip2')}</div>
          </div>
          <div class="card-flat" style="padding:12px;display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:20px;flex-shrink:0;">🚀</span>
            <div style="font-size:13px;color:var(--text-soft);line-height:1.6;">${t('kbTip3')}</div>
          </div>
        </div>
      </div>

      <!-- Create ticket -->
      ${appState.isGuest?`
      <div class="card" style="margin-bottom:20px;">
        <div style="padding:16px;background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border:1px solid rgba(184,255,92,.15);border-radius:var(--r-lg);text-align:center;">
          <div style="font-size:32px;margin-bottom:12px;">🎭</div>
          <h3 style="margin-bottom:8px;">${t('guestMode')}</h3>
          <p style="font-size:14px;color:var(--text-soft);margin-bottom:14px;">${t('guestSupport')}</p>
          <button class="btn btn-primary btn-sm" id="guestRegisterSupport">${t('register')}</button>
        </div>
      </div>
      `:`
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">🎫 ${t('createTicket')}</div>
        <div id="tkAlert" class="alert" style="margin-bottom:12px;"></div>
        <form id="ticketForm" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">${t('subject')} *</label><input type="text" id="tkSubject" class="form-input" placeholder="${t('subjectPlaceholder')}" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">${t('issueType')}</label>
              <select id="tkType" class="form-select form-input"><option>${t('billing')}</option><option>${t('technical')}</option><option>${t('accountType')}</option><option>${t('generalType')}</option></select></div>
            <div class="form-group"><label class="form-label">${t('priorityLabel')}</label>
              <select id="tkPriority" class="form-select form-input"><option>${t('normalPriority')}</option><option>${t('highPriority')}</option><option>${t('criticalPriority')}</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">${t('detailsLabel')}</label><textarea id="tkDetails" class="form-textarea" rows="3" placeholder="${t('detailsPlaceholder')}"></textarea></div>
          <button type="submit" class="btn btn-primary" style="align-self:flex-start;"><span class="btn-txt">${t('submitTicket')}</span></button>
        </form>
      </div>
      `}

      <!-- Ticket history -->
      <div class="card" style="padding:0;">
        <div style="padding:14px 18px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">${t('tickets')} <span class="count" style="background:rgba(255,255,255,.07);padding:2px 7px;border-radius:99px;font-size:12px;font-weight:600;color:var(--muted);">${appState.S.tickets.length}</span></div>
        ${appState.S.tickets.length?`<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--line);">${t('subject')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('type')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('statusCol')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('createdCol')}</th>
          </tr></thead>
          <tbody>${appState.S.tickets.map(tk=>`<tr>
            <td style="padding:12px 16px;">${esc(tk.subject)}</td>
            <td style="padding:12px 16px;"><span class="badge badge-info">${esc(tk.type)}</span></td>
            <td style="padding:12px 16px;"><span class="badge badge-${tk.status==='open'?'open':'completed'}">${tk.status}</span></td>
            <td style="padding:12px 16px;color:var(--muted);">${fmtAgo(tk.ts)}</td>
          </tr>`).join('')}</tbody>
        </table>`:`<div class="empty"><h3>${t('noTicketsYet')}</h3><p>${t('createTicketHelp')}</p></div>`}
      </div>

      <!-- Contact info -->
      ${!appState.isGuest?`
      <div class="card" style="margin-top:20px;background:rgba(125,215,255,.04);border-color:rgba(125,215,255,.12);">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:28px;">📧</span>
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:2px;">${t('contactInfo')}</div>
            <div style="font-size:12px;color:var(--muted);">${t('responseTime')}</div>
          </div>
        </div>
      </div>
      `:''}
    </div>`;

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q')?.addEventListener('click',()=>{
      const wasOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));
      if(!wasOpen)item.classList.add('open');
    });
  });

  document.getElementById('guestRegisterSupport')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('ticketForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=e.target.querySelector('[type=submit]');
    const subj=document.getElementById('tkSubject').value.trim();
    const type=document.getElementById('tkType').value;
    const priority=document.getElementById('tkPriority').value;
    const details=document.getElementById('tkDetails').value.trim();
    if(!subj){showAlert('tkAlert',t('required'));return;}
    hideAlert('tkAlert');
    const categoryMap={
      [t('billing')]:'billing',
      [t('technical')]:'technical',
      [t('accountType')]:'account',
      [t('generalType')]:'general'
    };
    const priorityMap={
      [t('normalPriority')]:'normal',
      [t('highPriority')]:'high',
      [t('criticalPriority')]:'critical'
    };
    setLoading(btn,true);
    const {ok,data}=await apiFetch(API.support,{method:'POST',body:JSON.stringify({
      subject:subj,
      category:categoryMap[type]||'general',
      priority:priorityMap[priority]||'normal',
      description:details||subj
    })});
    setLoading(btn,false);
    if(!ok){showAlert('tkAlert',data.message||'Ticket creation failed.');return;}
    await loadSupport();
    e.target.reset();
    toast(t('ticketDone'),'success');
    navigate('support');
  });
}
