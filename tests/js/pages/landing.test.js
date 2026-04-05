// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ── mocks (hoisted) ──────────────────────────────────────────── */

vi.mock('../../../js/state.js', () => ({
  appState: {
    S: { lang: 'EN', balance: 0, notifications: [] },
    currentUser: null,
    isGuest: false,
    currentPage: 'landing',
    csrfToken: 'tok',
    notifOpen: false,
  },
  saveState: vi.fn(),
  loadState: vi.fn(),
}));

vi.mock('../../../js/i18n.js', () => ({
  t: vi.fn((k) => k),
  i18n: { EN: {}, UA: {} },
}));

vi.mock('../../../js/utils.js', () => ({
  renderAnimatedBrandLayer: vi.fn(() => '<div class="brand-layer"></div>'),
  toast: vi.fn(),
  showAlert: vi.fn(),
  hideAlert: vi.fn(),
  setLoading: vi.fn(),
  esc: vi.fn((s) => s || ''),
}));

vi.mock('../../../js/pages/auth.js', () => ({
  renderAuth: vi.fn(),
}));

/* ── imports (after mocks) ────────────────────────────────────── */

import { renderLanding } from '../../../js/pages/landing.js';
import { appState, saveState } from '../../../js/state.js';
import { renderAuth } from '../../../js/pages/auth.js';

/* ── helpers ──────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"></div><div id="toastRoot"></div>';
  appState.currentUser = null;
  appState.isGuest = false;
  appState.S = { lang: 'EN', balance: 0, notifications: [] };
});

afterEach(() => {
  document.body.innerHTML = '';
});

/* ── renderLanding ─────────────────────────────────────────────── */

describe('renderLanding', () => {
  it('renders landing page HTML in #app', () => {
    renderLanding();
    const app = document.querySelector('#app');
    expect(app.innerHTML.length).toBeGreaterThan(0);
    expect(app.querySelector('.landing-page')).not.toBeNull();
  });

  it('has hero section with CTA buttons', () => {
    renderLanding();
    const hero = document.querySelector('.hero-section');
    expect(hero).not.toBeNull();
    const buttons = hero.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('has login button in header', () => {
    renderLanding();
    const headerLogin = document.querySelector('#headerLogin') || document.querySelector('#goLogin');
    expect(headerLogin).not.toBeNull();
  });

  it('has register buttons', () => {
    renderLanding();
    const goReg = document.querySelector('#goRegister');
    const bonusReg = document.querySelector('#bonusRegister');
    const ctaReg = document.querySelector('#ctaRegister');
    // at least one register CTA exists
    expect(goReg || bonusReg || ctaReg).not.toBeNull();
  });

  it('language selector changes lang and re-renders', () => {
    renderLanding();
    const selector = document.querySelector('#landingLangSelector');
    expect(selector).not.toBeNull();
    selector.value = 'UA';
    selector.dispatchEvent(new Event('change'));
    expect(saveState).toHaveBeenCalled();
  });

  it('has manifesto section', () => {
    renderLanding();
    expect(document.querySelector('.manifesto-section')).not.toBeNull();
  });

  it('has features section', () => {
    renderLanding();
    expect(document.querySelector('.features-section')).not.toBeNull();
  });

  it('has how-it-works steps', () => {
    renderLanding();
    expect(document.querySelector('.how-section')).not.toBeNull();
  });

  it('has welcome bonus section', () => {
    renderLanding();
    expect(document.querySelector('.welcome-bonus-section')).not.toBeNull();
  });

  it('has trust badges section', () => {
    renderLanding();
    expect(document.querySelector('.trust-section')).not.toBeNull();
  });

  it('has footer with links', () => {
    renderLanding();
    expect(document.querySelector('.landing-footer')).not.toBeNull();
  });
});
