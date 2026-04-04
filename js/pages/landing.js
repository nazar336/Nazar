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
        <div class="landing-orb landing-orb-4"></div>
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
          <div class="landing-header-right">
            <select id="landingLangSelector" class="landing-lang-select" aria-label="Language">
              <option value="UA" ${appState.S.lang==='UA'?'selected':''}>🇺🇦 UA</option>
              <option value="EN" ${appState.S.lang==='EN'?'selected':''}>🇬🇧 EN</option>
              <option value="DE" ${appState.S.lang==='DE'?'selected':''}>🇩🇪 DE</option>
              <option value="FR" ${appState.S.lang==='FR'?'selected':''}>🇫🇷 FR</option>
              <option value="ES" ${appState.S.lang==='ES'?'selected':''}>🇪🇸 ES</option>
              <option value="PL" ${appState.S.lang==='PL'?'selected':''}>🇵🇱 PL</option>
            </select>
            <button id="headerLogin" class="btn btn-outline btn-sm">${t('login')}</button>
          </div>
        </div>

        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-badge">${t('heroBadge')}</div>
            <h1 class="hero-title">
              <span class="title-line">${t('heroLine1')}</span>
              <span class="title-line title-accent">${t('heroLine2')}</span>
            </h1>
            <p class="hero-subtitle">${t('heroSubtitle')}</p>

            <div class="hero-ctas">
              <button id="goRegister" class="btn btn-primary btn-lg" style="gap:8px;">
                <span>🚀</span>
                <span>${t('heroCtaPrimary')}</span>
              </button>
              <button id="goLogin" class="btn btn-outline btn-lg" style="gap:8px;">
                <span>✨</span>
                <span>${t('heroCtaSecondary')}</span>
              </button>
            </div>

            <div class="hero-stats">
              <div class="hero-stat"><span class="hero-stat-num">🎬 12K+</span><span class="hero-stat-lbl">${t('statVideos')}</span></div>
              <div class="hero-stat"><span class="hero-stat-num">😂 50K+</span><span class="hero-stat-lbl">${t('statMemes')}</span></div>
              <div class="hero-stat"><span class="hero-stat-num">💻 8K+</span><span class="hero-stat-lbl">${t('statProjects')}</span></div>
            </div>
          </div>

          <!-- Hero Visual — emoji mosaic gallery -->
          <div class="hero-visual">
            <div class="hero-gallery">
              <div class="gallery-card gallery-meme">
                <div class="gallery-card-icon">😂</div>
                <div class="gallery-card-label">${t('galleryMeme')}</div>
              </div>
              <div class="gallery-card gallery-video">
                <div class="gallery-card-icon">🎬</div>
                <div class="gallery-card-label">${t('galleryVideo')}</div>
              </div>
              <div class="gallery-card gallery-code">
                <div class="gallery-card-icon">💻</div>
                <div class="gallery-card-label">${t('galleryCode')}</div>
              </div>
              <div class="gallery-card gallery-cringe">
                <div class="gallery-card-icon">🤡</div>
                <div class="gallery-card-label">${t('galleryCringe')}</div>
              </div>
              <div class="gallery-card gallery-task">
                <div class="gallery-card-icon">📋</div>
                <div class="gallery-card-label">${t('galleryTask')}</div>
              </div>
              <div class="gallery-card gallery-photo">
                <div class="gallery-card-icon">📸</div>
                <div class="gallery-card-label">${t('galleryPhoto')}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Manifesto — We Are Not Like Others -->
        <div class="manifesto-section">
          <div class="manifesto-card">
            <div class="manifesto-emoji">⚡</div>
            <h2 class="manifesto-title">${t('manifestoTitle')}</h2>
            <p class="manifesto-text">${t('manifestoText')}</p>
            <div class="manifesto-pills">
              <span class="manifesto-pill">🎬 ${t('pillVideos')}</span>
              <span class="manifesto-pill">😂 ${t('pillMemes')}</span>
              <span class="manifesto-pill">🤡 ${t('pillCringe')}</span>
              <span class="manifesto-pill">💻 ${t('pillCoding')}</span>
              <span class="manifesto-pill">📋 ${t('pillTasks')}</span>
              <span class="manifesto-pill">📸 ${t('pillPhotos')}</span>
              <span class="manifesto-pill">🏆 ${t('pillRanking')}</span>
              <span class="manifesto-pill">💎 ${t('pillCrypto')}</span>
            </div>
          </div>
        </div>

        <!-- Content Feed Preview -->
        <div class="feed-preview-section">
          <h2 class="section-title">${t('feedPreviewTitle')}</h2>
          <div class="feed-preview-grid">
            <div class="feed-card feed-card-meme">
              <div class="feed-card-header">
                <span class="feed-card-avatar">😎</span>
                <div>
                  <div class="feed-card-user">meme_lord_42</div>
                  <div class="feed-card-time">2${t('minsAgo')}</div>
                </div>
                <span class="feed-card-type-badge badge-meme">MEME</span>
              </div>
              <div class="feed-card-body feed-card-img">
                <div class="feed-img-placeholder">
                  <span>😂</span>
                  <span class="feed-img-text">${t('feedMemeCaption')}</span>
                </div>
              </div>
              <div class="feed-card-footer">
                <span>❤️ 847</span><span>💬 123</span><span>🔄 56</span>
              </div>
            </div>

            <div class="feed-card feed-card-video">
              <div class="feed-card-header">
                <span class="feed-card-avatar">🧑‍💻</span>
                <div>
                  <div class="feed-card-user">code_vibes</div>
                  <div class="feed-card-time">15${t('minsAgo')}</div>
                </div>
                <span class="feed-card-type-badge badge-video">VIDEO</span>
              </div>
              <div class="feed-card-body feed-card-vid">
                <div class="feed-vid-placeholder">
                  <div class="play-btn">▶</div>
                  <span class="feed-vid-title">${t('feedVideoCaption')}</span>
                  <span class="feed-vid-duration">0:42</span>
                </div>
              </div>
              <div class="feed-card-footer">
                <span>❤️ 2.1K</span><span>💬 312</span><span>🔄 189</span>
              </div>
            </div>

            <div class="feed-card feed-card-cringe">
              <div class="feed-card-header">
                <span class="feed-card-avatar">🤪</span>
                <div>
                  <div class="feed-card-user">cringe_archive</div>
                  <div class="feed-card-time">1${t('hoursAgo')}</div>
                </div>
                <span class="feed-card-type-badge badge-cringe">CRINGE</span>
              </div>
              <div class="feed-card-body feed-card-img">
                <div class="feed-img-placeholder cringe-bg">
                  <span>🤡</span>
                  <span class="feed-img-text">${t('feedCringeCaption')}</span>
                </div>
              </div>
              <div class="feed-card-footer">
                <span>❤️ 1.4K</span><span>💬 567</span><span>🔄 234</span>
              </div>
            </div>

            <div class="feed-card feed-card-code">
              <div class="feed-card-header">
                <span class="feed-card-avatar">👨‍💻</span>
                <div>
                  <div class="feed-card-user">web_wizard</div>
                  <div class="feed-card-time">3${t('hoursAgo')}</div>
                </div>
                <span class="feed-card-type-badge badge-code">CODE</span>
              </div>
              <div class="feed-card-body feed-card-code-preview">
                <div class="code-preview-block">
                  <div class="code-line"><span class="code-kw">const</span> app = <span class="code-fn">createApp</span>();</div>
                  <div class="code-line"><span class="code-kw">await</span> app.<span class="code-fn">deploy</span>(<span class="code-str">'production'</span>);</div>
                  <div class="code-line code-comment">// ${t('feedCodeComment')}</div>
                </div>
              </div>
              <div class="feed-card-footer">
                <span>⭐ 342</span><span>🔀 89</span><span>💬 45</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
          <h2 class="section-title">${t('featuresTitle')}</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎬</div>
              <h3>${t('feat1Title')}</h3>
              <p>${t('feat1Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">😂</div>
              <h3>${t('feat2Title')}</h3>
              <p>${t('feat2Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💻</div>
              <h3>${t('feat3Title')}</h3>
              <p>${t('feat3Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📋</div>
              <h3>${t('feat4Title')}</h3>
              <p>${t('feat4Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏆</div>
              <h3>${t('feat5Title')}</h3>
              <p>${t('feat5Desc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3>${t('feat6Title')}</h3>
              <p>${t('feat6Desc')}</p>
            </div>
          </div>
        </div>

        <!-- How It Works Steps -->
        <div class="how-section">
          <h2 class="section-title">${t('howItWorks')}</h2>
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
              <div class="step-icon">🎭</div>
              <h3>${t('createStep')}</h3>
              <p>${t('createStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon">⚡</div>
              <h3>${t('vibeStep')}</h3>
              <p>${t('vibeStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">4</div>
              <div class="step-icon">💎</div>
              <h3>${t('earnStep')}</h3>
              <p>${t('earnStepDesc')}</p>
            </div>
          </div>
        </div>

        <!-- Welcome Bonus -->
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

        <!-- Trust Badges -->
        <div class="trust-section">
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
          <h2>${t('readyToJoin')}</h2>
          <p>${t('joinCommunity')}</p>
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
  document.getElementById('headerLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('goRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('bonusRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('ctaRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('landingLangSelector')?.addEventListener('change',e=>{appState.S.lang=e.target.value;saveState();renderLanding();});
}
