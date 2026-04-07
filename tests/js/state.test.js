import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../js/api.js', () => ({
  apiFetch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));

vi.mock('../../js/i18n.js', () => ({
  t: (key) => key,
}));

vi.mock('../../js/utils.js', () => ({
  toast: vi.fn(),
  uid: () => 'test123',
  updateNotifBadge: vi.fn(),
}));

import { appState, defaultState, loadState, saveState, calcScore } from '../../js/state.js';

describe('defaultState()', () => {
  it('returns an object', () => {
    const state = defaultState();
    expect(typeof state).toBe('object');
    expect(state).not.toBeNull();
  });

  it('has default language EN', () => {
    expect(defaultState().lang).toBe('EN');
  });

  it('has zero balance by default', () => {
    const state = defaultState();
    expect(state.balance).toBe(0);
    expect(state.earnings).toBe(0);
    expect(state.spent).toBe(0);
  });

  it('has level 1 by default', () => {
    expect(defaultState().level).toBe(1);
  });

  it('has empty arrays for collections', () => {
    const state = defaultState();
    expect(Array.isArray(state.tasks)).toBe(true);
    expect(Array.isArray(state.feed)).toBe(true);
    expect(Array.isArray(state.notifications)).toBe(true);
    expect(Array.isArray(state.transactions)).toBe(true);
  });

  it('has feed limits', () => {
    const state = defaultState();
    expect(state.feedTodayPosts).toBe(0);
    expect(state.feedMaxPostsDay).toBe(3);
    expect(state.feedXpPerPost).toBe(5);
  });
});

describe('appState', () => {
  it('has S property', () => {
    expect(appState).toHaveProperty('S');
  });

  it('has currentUser as null', () => {
    expect(appState.currentUser).toBeNull();
  });

  it('has csrfToken as null', () => {
    expect(appState.csrfToken).toBeNull();
  });

  it('has isGuest as false', () => {
    expect(appState.isGuest).toBe(false);
  });
});

describe('loadState()', () => {
  beforeEach(() => {
    localStorage.clear();
    appState.S = {};
  });

  it('sets default state when localStorage is empty', () => {
    loadState();
    expect(appState.S.lang).toBe('EN');
    expect(appState.S.level).toBe(1);
  });

  it('loads saved state from localStorage', () => {
    localStorage.setItem('lolanceizi_state_v5', JSON.stringify({ lang: 'EN', level: 5 }));
    loadState();
    expect(appState.S.lang).toBe('EN');
    expect(appState.S.level).toBe(5);
  });

  it('merges saved state with defaults', () => {
    localStorage.setItem('lolanceizi_state_v5', JSON.stringify({ lang: 'DE' }));
    loadState();
    expect(appState.S.lang).toBe('DE');
    expect(appState.S.balance).toBe(0); // From defaults
  });
});

describe('saveState()', () => {
  it('saves state to localStorage', () => {
    appState.S = { lang: 'FR', balance: 100 };
    saveState();
    const saved = JSON.parse(localStorage.getItem('lolanceizi_state_v5'));
    expect(saved.lang).toBe('FR');
    expect(saved.balance).toBe(100);
  });
});

describe('calcScore()', () => {
  it('returns a number', () => {
    expect(typeof calcScore({})).toBe('number');
  });

  it('calculates score correctly', () => {
    const user = { earnings: 100, completedTasks: 10, streak: 5, level: 3, xp: 500 };
    const score = calcScore(user);
    // Expected: round(100 * 1.02 + 10 * 65 + 5 * 20 + 3 * 110 + 500) = round(102 + 650 + 100 + 330 + 500) = 1682
    expect(score).toBe(1682);
  });

  it('handles zero/missing values', () => {
    expect(calcScore({})).toBe(110); // Default level 1 * 110
  });
});
