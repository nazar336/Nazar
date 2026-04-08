'use strict';

import { appState, loadState } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { renderAnimatedBrandLayer, toast, showAlert, setLoading } from '../utils.js';
import { API } from '../constants.js';
import { renderShell } from '../shell.js';
import { renderAuth } from './auth.js';

export function renderVerification(userId, email){
  // Persist verification state in localStorage so it survives page refresh
  if (userId && email) {
    try { localStorage.setItem('lolanceizi_verify', JSON.stringify({ userId, email })); } catch(e) {}
  }

  // Generate random math puzzle
  const num1 = Math.floor(Math.random() * 50) + 1;
  const num2 = Math.floor(Math.random() * 50) + 1;
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let correctAnswer;
  
  if(op === '+') correctAnswer = num1 + num2;
  else if(op === '-') correctAnswer = num1 - num2;
  else correctAnswer = num1 * num2;
  
  document.getElementById('app').innerHTML=`
    <div class="auth-landing">
      <div class="bg-orbs" aria-hidden="true"></div>
      <div class="bg-grid" aria-hidden="true"></div>
      ${renderAnimatedBrandLayer('auth')}
      
      <div class="auth-container">
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-logo-large">lolance<em>izi</em></div>
            <h1 class="auth-title">${t('verifyEmail')}</h1>
            <p class="auth-subtitle">${t('codeSentTo')} ${email}</p>
            
            <div style="margin-top:20px;padding:20px;background:rgba(184,255,92,.08);border:2px solid rgba(184,255,92,.4);border-radius:12px;text-align:center;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${t('solveCaptcha')}</div>
              <div id="codeTimer" style="font-size:12px;color:var(--warning);margin-bottom:8px;display:none;"></div>
              
              <div style="font-size:32px;font-weight:900;margin:15px 0;font-family:monospace;color:#b8ff5c;">
                ${num1} <span style="color:rgba(184,255,92,.6);">${op}</span> ${num2} = <span style="color:rgba(184,255,92,.5);">?</span>
              </div>
              
              <div style="display:flex;gap:8px;margin:12px 0;">
                <input type="number" id="captchaAnswer" class="form-input" placeholder="${t('enterAnswer')}" style="flex:1;text-align:center;font-size:18px;font-weight:900;">
                <button type="button" id="solveCaptchaBtn" class="btn btn-primary btn-sm" style="min-width:100px;">
                  ${t('verifyCaptcha')}
                </button>
              </div>
              <div id="captchaError" class="alert alert-error" style="margin-top:8px;display:none;"></div>
            </div>

            <div id="codeSection" style="margin-top:20px;padding:15px;background:rgba(184,255,92,.1);border:1px solid rgba(184,255,92,.3);border-radius:8px;text-align:center;display:none;">
              <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">📧 ${t('verificationCode')}</div>
              <div style="font-size:13px;color:var(--text-soft);">${t('codeSentDesc')}</div>
            </div>
          </div>
        </div>

        <div class="auth-card" id="verifyCard" style="display:none;">
          <div id="verifyAlert" class="alert" style="margin-bottom:16px;"></div>
          
          <form id="verifyForm" class="auth-form" novalidate>
            <div class="form-group">
              <label class="form-label">${t('enterCodeScreen')}</label>
              <input type="text" id="verifyCode" class="form-input" placeholder="000000" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="off" required>
              <small style="color:#888;margin-top:8px;display:block;">${t('sixDigits')}</small>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:16px;">
              <span class="btn-txt">${t('confirmBtn')}</span>
            </button>
          </form>

          <div class="auth-footer" style="margin-top:24px;text-align:center;">
            <button type="button" id="resendCodeBtn" class="link-btn" style="margin-bottom:8px;">${t('resendCode')}</button>
            <div id="resendStatus" style="font-size:12px;min-height:18px;color:var(--text-soft);"></div>
            <button type="button" id="backToAuth" class="link-btn">${t('backToLogin')}</button>
          </div>
        </div>
      </div>
    </div>`;

  // Store data (keep answer in closure, not on window)
  window.__verifyUserId = userId;
  window.__verifyEmail = email;
  let _captchaAnswer = correctAnswer;

  // Captcha solver
  const solveCaptchaBtn = document.getElementById('solveCaptchaBtn');
  const captchaInput = document.getElementById('captchaAnswer');
  const captchaError = document.getElementById('captchaError');
  
  solveCaptchaBtn?.addEventListener('click', () => {
    const userAnswer = parseInt(captchaInput.value);
    if(userAnswer === _captchaAnswer){
      captchaError.style.display = 'none';
      document.querySelector('.auth-hero').style.display = 'none';
      document.getElementById('verifyCard').style.display = 'block';
      document.getElementById('codeSection').style.display = 'block';
      document.getElementById('verifyCode').focus();
      // Start 15-minute countdown timer
      const timerEl = document.getElementById('codeTimer');
      if (timerEl) {
        timerEl.style.display = 'block';
        let remaining = 15 * 60; // 15 minutes in seconds
        const updateTimer = () => {
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          timerEl.textContent = `⏱️ ${t('codeExpiresIn') || 'Code expires in'}: ${mins}:${String(secs).padStart(2, '0')}`;
          if (remaining <= 0) {
            timerEl.textContent = `⚠️ ${t('codeExpired') || 'Code expired — request a new one'}`;
            timerEl.style.color = 'var(--danger)';
            clearInterval(timerInterval);
          }
          remaining--;
        };
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
      }
    } else {
      captchaError.textContent = '❌ ' + t('wrongAnswer');
      captchaError.style.display = 'block';
      captchaInput.value = '';
      captchaInput.focus();
    }
  });

  captchaInput?.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') solveCaptchaBtn.click();
  });
  document.getElementById('verifyForm')?.addEventListener('submit', (e) => handleVerify(e, userId));
  document.getElementById('backToAuth')?.addEventListener('click', () => {
    try { localStorage.removeItem('lolanceizi_verify'); } catch(e) {}
    renderAuth('login');
  });
  
  // Resend code handler
  document.getElementById('resendCodeBtn')?.addEventListener('click', async () => {
    const resendBtn = document.getElementById('resendCodeBtn');
    const resendStatus = document.getElementById('resendStatus');
    if (resendBtn) { resendBtn.disabled = true; resendBtn.style.opacity = '.5'; }
    if (resendStatus) resendStatus.textContent = t('sendingCode');
    
    const {ok, data} = await apiFetch(API.verify, {
      method: 'POST',
      body: JSON.stringify({ action: 'resend', user_id: userId, email })
    });
    
    if (resendStatus) {
      resendStatus.textContent = data.message || (ok ? t('codeSentSuccess') : t('errorOccurred'));
      resendStatus.style.color = ok ? 'var(--success)' : 'var(--danger)';
    }
    
    // Re-enable after 60 seconds (cooldown)
    setTimeout(() => {
      if (resendBtn) { resendBtn.disabled = false; resendBtn.style.opacity = '1'; }
      if (resendStatus) resendStatus.textContent = '';
    }, 60000);
  });
  
  // Auto-focus
  captchaInput?.focus();
  
  // Format code input
  const codeInput = document.getElementById('verifyCode');
  codeInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

export async function handleVerify(e, userId){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const code=document.getElementById('verifyCode').value.trim();
  
  if(!code || code.length !== 6 || !/^\d{6}$/.test(code)){
    showAlert('verifyAlert', t('invalidCode'));
    return;
  }
  
  setLoading(btn, true);
  const {ok, data} = await apiFetch(API.verify, {
    method:'POST', 
    body:JSON.stringify({user_id: userId, code: code})
  });
  setLoading(btn, false);
  
  if(ok){
    try { localStorage.removeItem('lolanceizi_verify'); } catch(e) {}
    appState.currentUser = data.user;
    appState.isGuest = false;
    loadState();
    toast(t('verifySuccess'), 'success');
    renderShell();
  } else {
    showAlert('verifyAlert', data.message || t('wrongCode'));
  }
}
