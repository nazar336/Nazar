'use strict';

import { appState, saveState, loadState } from '../state.js';
import { t, setLang } from '../i18n.js';
import { apiFetch } from '../api.js';
import { renderAnimatedBrandLayer, toast, showAlert, hideAlert, setLoading } from '../utils.js';
import { API } from '../constants.js';
import { renderShell } from '../shell.js';
import { renderVerification } from './verify.js';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: 'weak', color: 'var(--danger)' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 10) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (score <= 1) return { level: 20, label: 'weak', color: 'var(--danger)' };
  if (score <= 3) return { level: 60, label: 'medium', color: 'var(--warning)' };
  return { level: 100, label: 'strong', color: 'var(--success)' };
}

function setupRegisterValidation() {
  const name = document.getElementById('regName');
  const user = document.getElementById('regUser');
  const email = document.getElementById('regEmail');
  const pwd = document.getElementById('regPwd');
  const terms = document.getElementById('regAcceptTerms');
  const submit = document.querySelector('#registerForm button[type=submit]');
  const strengthBar = document.getElementById('pwdStrengthBar');
  const strengthLabel = document.getElementById('pwdStrengthLabel');

  function checkValid(el, valid) {
    const fb = document.getElementById(el.id + 'Fb');
    if (fb) {
      fb.textContent = el.value ? (valid ? '✓' : '✗') : '';
      fb.style.color = valid ? 'var(--success)' : 'var(--danger)';
    }
    const msg = document.getElementById(el.id + 'Msg');
    if (msg) {
      msg.textContent = el.value && !valid ? (el.dataset.errMsg || '') : '';
    }
  }

  function updateSubmitState() {
    if (!submit) return;
    const allFilled = name?.value.trim() && user?.value.trim() && email?.value.trim() && pwd?.value && terms?.checked;
    submit.disabled = !allFilled;
    submit.style.opacity = allFilled ? '1' : '.5';
  }

  name?.addEventListener('input', () => { checkValid(name, name.value.trim().length >= 1); updateSubmitState(); });
  user?.addEventListener('input', () => { checkValid(user, /^[a-zA-Z0-9_]{3,32}$/.test(user.value.trim())); updateSubmitState(); });
  email?.addEventListener('input', () => { checkValid(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())); updateSubmitState(); });
  pwd?.addEventListener('input', () => {
    const s = getPasswordStrength(pwd.value);
    if (strengthBar) { strengthBar.style.width = s.level + '%'; strengthBar.style.background = s.color; }
    if (strengthLabel) { strengthLabel.textContent = s.label; strengthLabel.style.color = s.color; }
    checkValid(pwd, pwd.value.length >= 8 && /[A-Za-z]/.test(pwd.value) && /\d/.test(pwd.value));
    updateSubmitState();
  });
  terms?.addEventListener('change', updateSubmitState);

  // Password toggle
  document.getElementById('pwdToggleBtn')?.addEventListener('click', () => {
    if (!pwd) return;
    const isHidden = pwd.type === 'password';
    pwd.type = isHidden ? 'text' : 'password';
    const btn = document.getElementById('pwdToggleBtn');
    if (btn) btn.textContent = isHidden ? '🙈' : '👁';
  });

  updateSubmitState();
}

function setupLoginValidation() {
  const email = document.getElementById('loginEmail');
  const pwd = document.getElementById('loginPwd');
  const submit = document.querySelector('#loginForm button[type=submit]');

  function updateSubmitState() {
    if (!submit) return;
    const allFilled = email?.value.trim() && pwd?.value;
    submit.disabled = !allFilled;
    submit.style.opacity = allFilled ? '1' : '.5';
  }

  email?.addEventListener('input', updateSubmitState);
  pwd?.addEventListener('input', updateSubmitState);

  // Password toggle
  document.getElementById('loginPwdToggleBtn')?.addEventListener('click', () => {
    if (!pwd) return;
    const isHidden = pwd.type === 'password';
    pwd.type = isHidden ? 'text' : 'password';
    const btn = document.getElementById('loginPwdToggleBtn');
    if (btn) btn.textContent = isHidden ? '🙈' : '👁';
  });

  updateSubmitState();
}

export function renderAuth(mode='login'){
  document.getElementById('app').innerHTML=`
    <div class="auth-landing">
      <!-- Background layers -->
      <div class="bg-orbs" aria-hidden="true"></div>
      <div class="bg-grid" aria-hidden="true"></div>
      ${renderAnimatedBrandLayer('auth')}
      
      <div class="auth-container">
        <!-- Left: Hero + Benefits -->
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-logo-large">lolance<em>izi</em></div>
            <h1 class="auth-title">${t('earnOnTasks')}</h1>
            <p class="auth-subtitle">${t('authSubtitle')}</p>
            
            <div class="auth-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">⚡</span>
                <div>
                  <div class="benefit-title">${t('quickEarnings')}</div>
                  <div class="benefit-text">${t('quickEarningsDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🎖️</span>
                <div>
                  <div class="benefit-title">${t('levelsAchievements')}</div>
                  <div class="benefit-text">${t('levelsAchievementsDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">💎</span>
                <div>
                  <div class="benefit-title">${t('premiumFeatures')}</div>
                  <div class="benefit-text">${t('premiumFeaturesDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🌍</span>
                <div>
                  <div class="benefit-title">${t('globalCommunity')}</div>
                  <div class="benefit-text">${t('globalCommunityDesc')}</div></div>
                </div>
              </div>
            </div>

            <div class="auth-stats">
              <div class="stat"><strong>12.5K+</strong><span>${t('activeStat')}</span></div>
              <div class="stat"><strong>2.3M USDT</strong><span>${t('paidOut')}</span></div>
              <div class="stat"><strong>4.9★</strong><span>${t('leaderboard')}</span></div>
            </div>
          </div>

          <!-- Illustration -->
          <div class="auth-illustration">
            <div class="illu-circle"></div>
            <div class="illu-element illu-1">🚀</div>
            <div class="illu-element illu-2">💰</div>
            <div class="illu-element illu-3">📈</div>
            <div class="illu-element illu-4">🎯</div>
            <div class="illu-element illu-5">⭐</div>
          </div>
        </div>

        <!-- Right: Auth Forms -->
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-tabs" role="tablist">
              <button class="auth-tab${mode==='login'?' active':''}" id="tabLogin" role="tab" aria-selected="${mode==='login'}">${t('login')}</button>
              <button class="auth-tab${mode==='register'?' active':''}" id="tabRegister" role="tab" aria-selected="${mode==='register'}">${t('register')}</button>
            </div>
            <select id="authLangSelector" class="form-input" style="width:100px;font-size:13px;height:36px;padding:6px 8px;margin-top:0;" aria-label="Language selector">
              <option value="UA" ${appState.S.lang==='UA'?'selected':''}>🇺🇦 Українська</option>
              <option value="EN" ${appState.S.lang==='EN'?'selected':''}>🇬🇧 English</option>
              <option value="DE" ${appState.S.lang==='DE'?'selected':''}>🇩🇪 Deutsch</option>
              <option value="FR" ${appState.S.lang==='FR'?'selected':''}>🇫🇷 Français</option>
              <option value="ES" ${appState.S.lang==='ES'?'selected':''}>🇪🇸 Español</option>
              <option value="PL" ${appState.S.lang==='PL'?'selected':''}>🇵🇱 Polski</option>
            </select>
          </div>

          <div id="authAlert" class="alert" style="margin-bottom:16px;"></div>

          ${mode==='login'?`
            <form id="loginForm" class="auth-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="loginEmail">Email</label>
                <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" autocomplete="email" aria-label="Email" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="loginPwd">${t('password')}</label>
                <div style="position:relative;">
                  <input type="password" id="loginPwd" class="form-input" style="padding-right:40px;" placeholder="••••••••" autocomplete="current-password" aria-label="${t('password')}" required>
                  <button type="button" id="loginPwdToggleBtn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:2px;" aria-label="Toggle password visibility">👁</button>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:8px;opacity:.5;" disabled>
                <span class="btn-txt">${t('login')}</span>
              </button>
            </form>

            <div class="auth-footer">
              <span>${t('noAccount')}</span>
              <button type="button" id="switchRegister" class="link-btn">${t('register')}</button>
            </div>
          `:`
            <form id="registerForm" class="auth-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="regName">${t('fullName')} *</label>
                <div style="display:flex;align-items:center;gap:6px;">
                  <input type="text" id="regName" class="form-input" style="flex:1;" placeholder="${t('fullName')}" aria-label="${t('fullName')}" aria-describedby="regNameMsg" data-err-msg="${t('required') || 'Required'}" required>
                  <span id="regNameFb" style="font-size:14px;width:18px;text-align:center;" aria-hidden="true"></span>
                </div>
                <div id="regNameMsg" style="font-size:11px;color:var(--danger);min-height:14px;" role="alert"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="regUser">Username *</label>
                <div style="display:flex;align-items:center;gap:6px;">
                  <input type="text" id="regUser" class="form-input" style="flex:1;" placeholder="ivan_dev" pattern="[a-zA-Z0-9_]{3,32}" aria-label="Username" aria-describedby="regUserMsg" data-err-msg="3-32 chars: a-z, 0-9, _" required>
                  <span id="regUserFb" style="font-size:14px;width:18px;text-align:center;" aria-hidden="true"></span>
                </div>
                <div id="regUserMsg" style="font-size:11px;color:var(--danger);min-height:14px;" role="alert"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="regEmail">Email *</label>
                <div style="display:flex;align-items:center;gap:6px;">
                  <input type="email" id="regEmail" class="form-input" style="flex:1;" placeholder="you@example.com" aria-label="Email" aria-describedby="regEmailMsg" data-err-msg="${t('invalidEmail') || 'Invalid email'}" required>
                  <span id="regEmailFb" style="font-size:14px;width:18px;text-align:center;" aria-hidden="true"></span>
                </div>
                <div id="regEmailMsg" style="font-size:11px;color:var(--danger);min-height:14px;" role="alert"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="regPwd">${t('password')} *</label>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div style="position:relative;flex:1;">
                    <input type="password" id="regPwd" class="form-input" style="padding-right:40px;" placeholder="${t('minChars')}" aria-label="${t('password')}" aria-describedby="regPwdMsg pwdStrengthLabel" data-err-msg="${t('minChars') || 'Min 8 characters (letters + digits)'}" required>
                    <button type="button" id="pwdToggleBtn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:2px;" aria-label="Toggle password visibility">👁</button>
                  </div>
                  <span id="regPwdFb" style="font-size:14px;width:18px;text-align:center;" aria-hidden="true"></span>
                </div>
                <div style="margin-top:6px;">
                  <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;">
                    <div id="pwdStrengthBar" style="height:100%;width:0%;transition:width .3s,background .3s;border-radius:2px;"></div>
                  </div>
                  <div id="pwdStrengthLabel" style="font-size:11px;margin-top:2px;min-height:14px;"></div>
                </div>
                <div id="regPwdMsg" style="font-size:11px;color:var(--danger);min-height:14px;" role="alert"></div>
              </div>
              <div class="form-group" style="margin-top:-2px;">
                <label style="display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.45;color:var(--text-soft);">
                  <input type="checkbox" id="regAcceptTerms" style="margin-top:2px;" aria-label="Accept terms and privacy policy" required>
                  <span>${t('acceptTermsText')} <a href="terms.html" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">${t('platformRules')}</a> ${t('andText')} <a href="privacy.html" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">${t('privacyPolicy')}</a>.</span>
                </label>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:8px;opacity:.5;" disabled>
                <span class="btn-txt">${t('register')}</span>
              </button>
            </form>

            <div class="auth-footer">
              <span>${t('haveAccount')}</span>
              <button type="button" id="switchLogin" class="link-btn">${t('login')}</button>
            </div>
          `}
        </div>
      </div>
    </div>`;

  document.getElementById('tabLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('tabRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('switchLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('switchRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('loginForm')?.addEventListener('submit',handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit',handleRegister);
  document.getElementById('authLangSelector')?.addEventListener('change',e=>{setLang(e.target.value);saveState();renderAuth(mode);});

  if (mode === 'register') setupRegisterValidation();
  else setupLoginValidation();
}

export async function handleLogin(e){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPwd').value;
  if(!email||!password){showAlert('authAlert',t('required'));return;}
  hideAlert('authAlert');setLoading(btn,true);
  const {ok,data}=await apiFetch(API.login,{method:'POST',body:JSON.stringify({email,password})});
  setLoading(btn,false);
  if(ok){appState.currentUser=data.user;appState.isGuest=false;loadState();toast(t('loginSuccess'),'success');renderShell();}
  else showAlert('authAlert',data.message||'Login failed.');
}

export async function handleRegister(e){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const name=document.getElementById('regName').value.trim();
  const username=document.getElementById('regUser').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const password=document.getElementById('regPwd').value;
  const acceptTerms=!!document.getElementById('regAcceptTerms')?.checked;
  const acceptPrivacy=acceptTerms;
  if(!name||!username||!email||!password){showAlert('authAlert',t('required'));return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showAlert('authAlert',t('invalidEmail')||'Email некоректний.');return;}
  if(password.length<8||!/[A-Za-z]/.test(password)||!/\d/.test(password)){showAlert('authAlert',t('minChars')||'Min 8 characters (letters + digits)');return;}
  if(!acceptTerms){showAlert('authAlert',t('acceptTermsRequired'));return;}
  hideAlert('authAlert');setLoading(btn,true);
  const {ok,data}=await apiFetch(API.register,{method:'POST',body:JSON.stringify({name,username,email,password,accept_terms:acceptTerms,accept_privacy:acceptPrivacy})});
  setLoading(btn,false);
  if(ok){appState.isGuest=false;toast(t('registerSuccess'),'success');renderVerification(data.user_id,email);}
  else showAlert('authAlert',data.message||'Register failed.');
}

export async function doLogout(){
  await apiFetch(API.logout,{method:'POST'});
  appState.currentUser=null;toast(t('logoutSuccess'),'info');renderAuth();
}

