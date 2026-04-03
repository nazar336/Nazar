'use strict';

import { appState, saveState } from '../state.js';
import { t } from '../i18n.js';
import { renderAnimatedBrandLayer } from '../utils.js';
import { renderAuth } from './auth.js';

export function renderLanding(){
  document.getElementById('app').innerHTML=`
    <div class="landing-page">
      <!-- Animated background -->
      <div class="landing-bg" aria-hidden="true">
        <div class="landing-orb landing-orb-1"></div>
        <div class="landing-orb landing-orb-2"></div>
        <div class="landing-orb landing-orb-3"></div>
        <div class="landing-grid"></div>
      </div>
      ${renderAnimatedBrandLayer('landing')}

      <!-- Content -->
      <div class="landing-container">
        <!-- Header -->
        <div class="landing-header">
          <div class="landing-logo">
            <img src="assets/lolance-logo.svg" alt="LOLance logo" class="landing-logo-image">
            <div>LOL<em>ance</em></div>
          </div>
          <select id="landingLangSelector" class="landing-lang-select" aria-label="Language">
            <option value="UA" ${appState.S.lang==='UA'?'selected':''}>🇺🇦 UA</option>
            <option value="EN" ${appState.S.lang==='EN'?'selected':''}>🇬🇧 EN</option>
            <option value="DE" ${appState.S.lang==='DE'?'selected':''}>🇩🇪 DE</option>
            <option value="FR" ${appState.S.lang==='FR'?'selected':''}>🇫🇷 FR</option>
            <option value="ES" ${appState.S.lang==='ES'?'selected':''}>🇪🇸 ES</option>
            <option value="PL" ${appState.S.lang==='PL'?'selected':''}>🇵🇱 PL</option>
          </select>
        </div>

        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="title-word">${t('earnTitle')}</span>
              <span class="title-word">${t('landingMicroTasks')}</span>
            </h1>
            <p class="hero-subtitle">${t('landingHeroDesc')}</p>
            
            <!-- CTAs -->
            <div class="hero-ctas">
              <button id="goLogin" class="btn btn-primary btn-lg" style="gap:8px;">
                <span>🚀</span>
                <span>${t('getStarted')}</span>
              </button>
              <button id="goRegister" class="btn btn-outline btn-lg" style="gap:8px;">
                <span>✨</span>
                <span>${t('signUpBtn')}</span>
              </button>
            </div>
          </div>

          <!-- Hero Visual — platform preview mockup -->
          <div class="hero-visual">
            <div class="landing-mockup">
              <div class="mockup-bar">
                <span class="mockup-dot" style="background:#ff5f57"></span>
                <span class="mockup-dot" style="background:#ffbd2e"></span>
                <span class="mockup-dot" style="background:#28c840"></span>
                <span class="mockup-tab">LOLance — Dashboard</span>
              </div>
              <div class="mockup-body">
                <div class="mockup-sidebar">
                  <div class="mockup-nav-item active">⚡ Dashboard</div>
                  <div class="mockup-nav-item">📋 Tasks</div>
                  <div class="mockup-nav-item">💎 Wallet</div>
                  <div class="mockup-nav-item">💬 Chat</div>
                  <div class="mockup-nav-item">🏆 Rating</div>
                </div>
                <div class="mockup-content">
                  <div class="mockup-stat-row">
                    <div class="mockup-stat"><span class="mockup-stat-val">💰 1,250</span><span class="mockup-stat-lbl">coins</span></div>
                    <div class="mockup-stat"><span class="mockup-stat-val">⭐ Lv.5</span><span class="mockup-stat-lbl">level</span></div>
                    <div class="mockup-stat"><span class="mockup-stat-val">🔥 7</span><span class="mockup-stat-lbl">streak</span></div>
                  </div>
                  <div class="mockup-task-list">
                    <div class="mockup-task"><span class="mockup-badge easy">Easy</span> Logo design <span class="mockup-reward">+200 💎</span></div>
                    <div class="mockup-task"><span class="mockup-badge medium">Medium</span> Landing page <span class="mockup-reward">+500 💎</span></div>
                    <div class="mockup-task"><span class="mockup-badge hard">Hard</span> API integration <span class="mockup-reward">+1000 💎</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Welcome Bonus Section -->
        <div class="welcome-bonus-section">
          <div class="welcome-bonus-card">
            <h2>${t('welcomeBonusTitle')}</h2>
            <p class="welcome-bonus-desc">${t('welcomeBonusDesc')}</p>
            <div class="welcome-bonus-items">
              <div class="welcome-bonus-item">
                <span class="bonus-icon">🚀</span>
                <span>${t('welcomeBonus1')}</span>
              </div>
              <div class="welcome-bonus-item">
                <span class="bonus-icon">📅</span>
                <span>${t('welcomeBonus2')}</span>
              </div>
              <div class="welcome-bonus-item">
                <span class="bonus-icon">💬</span>
                <span>${t('welcomeBonus3')}</span>
              </div>
            </div>
            <button id="bonusRegister" class="btn btn-primary btn-lg" style="margin-top:20px;">
              ${t('welcomeBonusCta')}
            </button>
          </div>
        </div>

        <!-- Showcase: What You Get Inside -->
        <div class="showcase-section">
          <h2 class="section-title">${t('showcaseTitle')}</h2>
          <div class="showcase-grid">
            <div class="showcase-card">
              <div class="showcase-preview">
                <div class="showcase-mini-tasks">
                  <div class="mini-task"><span class="mockup-badge easy">Easy</span> UI review <span class="mini-coins">+150 💎</span></div>
                  <div class="mini-task"><span class="mockup-badge medium">Med</span> Write blog post <span class="mini-coins">+350 💎</span></div>
                  <div class="mini-task"><span class="mockup-badge hard">Hard</span> Build API <span class="mini-coins">+800 💎</span></div>
                </div>
              </div>
              <h3>📋 ${t('showcaseTasksTitle')}</h3>
              <p>${t('showcaseTasksDesc')}</p>
            </div>
            <div class="showcase-card">
              <div class="showcase-preview">
                <div class="showcase-wallet-mock">
                  <div class="wallet-mock-balance">💎 12,500 <span>coins</span></div>
                  <div class="wallet-mock-row"><span>USDT → Coins</span><span style="color:var(--success)">+5,000</span></div>
                  <div class="wallet-mock-row"><span>Task reward</span><span style="color:var(--success)">+500</span></div>
                  <div class="wallet-mock-row"><span>Withdrawal</span><span style="color:var(--danger)">-2,000</span></div>
                </div>
              </div>
              <h3>💎 ${t('showcaseWalletTitle')}</h3>
              <p>${t('showcaseWalletDesc')}</p>
            </div>
            <div class="showcase-card">
              <div class="showcase-preview">
                <div class="showcase-chat-mock">
                  <div class="chat-mock-msg left"><span class="chat-mock-name">Anna</span> Hey! Need help with the task?</div>
                  <div class="chat-mock-msg right"><span class="chat-mock-name">You</span> Yes, sending details now 👍</div>
                  <div class="chat-mock-msg left"><span class="chat-mock-name">Max</span> Great community here!</div>
                </div>
              </div>
              <h3>💬 ${t('showcaseChatTitle')}</h3>
              <p>${t('showcaseChatDesc')}</p>
            </div>
            <div class="showcase-card">
              <div class="showcase-preview">
                <div class="showcase-profile-mock">
                  <div class="profile-mock-avatar">🧑‍💻</div>
                  <div class="profile-mock-info">
                    <div class="profile-mock-name">Alex Freelancer</div>
                    <div class="profile-mock-stats">⭐ Lv.8 &nbsp; 🔥 15-day streak &nbsp; 🏆 Top 5%</div>
                    <div class="profile-mock-xp"><div class="profile-mock-xp-fill" style="width:72%"></div></div>
                  </div>
                </div>
              </div>
              <h3>👤 ${t('showcaseProfileTitle')}</h3>
              <p>${t('showcaseProfileDesc')}</p>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
          <h2 class="section-title">${t('howItWorks')}</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📋</div>
              <h3>${t('landingFeature1Title')}</h3>
              <p>${t('landingFeature1Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💰</div>
              <h3>${t('landingFeature2Title')}</h3>
              <p>${t('landingFeature2Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔗</div>
              <h3>${t('landingFeature3Title')}</h3>
              <p>${t('landingFeature3Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💬</div>
              <h3>${t('landingFeature4Title')}</h3>
              <p>${t('landingFeature4Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏆</div>
              <h3>${t('landingFeature5Title')}</h3>
              <p>${t('landingFeature5Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>${t('landingFeature6Title')}</h3>
              <p>${t('landingFeature6Desc')}</p>
            </div>
          </div>
        </div>

        <!-- How It Works Steps -->
        <div class="how-section">
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-icon">📝</div>
              <h3>${t('signUpStep')}</h3>
              <p>${t('signUpStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-icon">🔍</div>
              <h3>${t('browseStep')}</h3>
              <p>${t('browseStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon">⚙️</div>
              <h3>${t('executeStep')}</h3>
              <p>${t('executeStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">4</div>
              <div class="step-icon">💎</div>
              <h3>${t('getPaidStep')}</h3>
              <p>${t('getPaidStepDesc')}</p>
            </div>
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="trust-section">
          <h2 class="section-title">${t('trustTitle')}</h2>
          <div class="trust-badges">
            <div class="trust-badge">
              <div class="trust-icon">🔒</div>
              <span>${t('trustSSL')}</span>
            </div>
            <div class="trust-badge">
              <div class="trust-icon">🛡️</div>
              <span>${t('trustGDPR')}</span>
            </div>
            <div class="trust-badge">
              <div class="trust-icon">✅</div>
              <span>${t('trustKYC')}</span>
            </div>
            <div class="trust-badge">
              <div class="trust-icon">🎧</div>
              <span>${t('trustSupport')}</span>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="landing-cta-section">
          <h2>${t('readyToEarn')}</h2>
          <p>${t('joinFreelancers')}</p>
          <div class="landing-cta-buttons">
            <button id="ctaRegister" class="btn btn-primary btn-lg">
              ${t('signUpNow')} →
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="landing-footer">
          <div class="footer-links">
            <a href="terms.html" class="footer-link" target="_blank">${t('termsLink')}</a>
            <a href="privacy.html" class="footer-link" target="_blank">${t('privacyLink')}</a>
            <a href="#" class="footer-link">${t('contactLink')}</a>
          </div>
          <div class="footer-text">© 2026 LOLance. ${t('allRights')}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('goLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('goRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('bonusRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('ctaRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('landingLangSelector')?.addEventListener('change',e=>{appState.S.lang=e.target.value;saveState();renderLanding();});
}
