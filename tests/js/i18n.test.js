import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock factories are hoisted — no external references allowed
vi.mock('../../js/state.js', () => ({
  appState: { S: { lang: 'EN' } },
}));

import { i18n, t } from '../../js/i18n.js';
import { appState } from '../../js/state.js';

const SUPPORTED_LANGS = ['EN', 'UA', 'DE', 'FR', 'ES', 'PL'];
const CORE_KEYS = [
  'login', 'register', 'dashboard', 'tasks', 'feed',
  'wallet', 'chat', 'support', 'profile', 'logout',
  'leaderboard', 'settings',
];

describe('i18n', () => {
  beforeEach(() => {
    appState.S.lang = 'EN';
  });

  it('t() returns English text when lang is EN', () => {
    appState.S.lang = 'EN';
    const result = t('dashboard');
    expect(result).toBe(i18n.EN.dashboard);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('t() returns Ukrainian text when lang is UA', () => {
    appState.S.lang = 'UA';
    const result = t('dashboard');
    expect(result).toBe(i18n.UA.dashboard);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('t() returns the key itself for unknown keys', () => {
    const unknownKey = 'thisKeyDoesNotExist_xyz_999';
    expect(t(unknownKey)).toBe(unknownKey);
  });

  it('all 6 languages have the same keys (consistency check)', () => {
    const enKeys = Object.keys(i18n.EN).sort();
    for (const lang of SUPPORTED_LANGS) {
      const langKeys = Object.keys(i18n[lang]).sort();
      expect(langKeys).toEqual(enKeys);
    }
  });

  it('core keys exist in all languages', () => {
    for (const lang of SUPPORTED_LANGS) {
      for (const key of CORE_KEYS) {
        expect(i18n[lang]).toHaveProperty(key);
        expect(typeof i18n[lang][key]).toBe('string');
      }
    }
  });

  it('t() works for each supported language', () => {
    for (const lang of SUPPORTED_LANGS) {
      appState.S.lang = lang;
      const result = t('login');
      expect(result).toBe(i18n[lang].login);
      expect(typeof result).toBe('string');
    }
  });

  it('no empty string values in any language', () => {
    for (const lang of SUPPORTED_LANGS) {
      const entries = Object.entries(i18n[lang]);
      for (const [key, value] of entries) {
        expect(value, `${lang}.${key} should not be empty`).not.toBe('');
      }
    }
  });
});
