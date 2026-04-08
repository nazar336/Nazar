import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock factories are hoisted — no external references allowed
vi.mock('../../js/state.js', () => ({
  appState: { S: { lang: 'EN' } },
  saveState: vi.fn(),
}));

vi.mock('../../js/i18n.js', () => ({
  t: (key) => {
    const map = {
      justNow: 'just now',
      minsAgo: 'm ago',
      hoursAgo: 'h ago',
      daysAgo: 'd ago',
    };
    return map[key] || key;
  },
}));

import { esc, uid, fmtDate, fmtAgo } from '../../js/utils.js';

describe('esc()', () => {
  it('escapes HTML characters', () => {
    expect(esc('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(esc('foo & bar')).toBe('foo &amp; bar');
  });

  it('handles null/undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('returns empty for empty string', () => {
    expect(esc('')).toBe('');
  });

  it('passes through safe text', () => {
    expect(esc('Hello World')).toBe('Hello World');
  });
});

describe('uid()', () => {
  it('returns a string', () => {
    expect(typeof uid()).toBe('string');
  });

  it('returns strings of reasonable length', () => {
    const len = uid().length;
    expect(len).toBeGreaterThanOrEqual(7);
    expect(len).toBeLessThanOrEqual(14);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe('fmtDate()', () => {
  it('returns — for empty input', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
    expect(fmtDate('')).toBe('—');
  });

  it('returns a formatted date string', () => {
    const result = fmtDate('2026-01-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });
});

describe('fmtAgo()', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(fmtAgo(now)).toBe('just now');
  });

  it('returns minutes ago for timestamps within an hour', () => {
    const date = new Date(Date.now() - 5 * 60000).toISOString();
    expect(fmtAgo(date)).toMatch(/5m ago/);
  });

  it('returns hours ago for timestamps within a day', () => {
    const date = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(fmtAgo(date)).toMatch(/3h ago/);
  });

  it('returns days ago for older timestamps', () => {
    const date = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(fmtAgo(date)).toMatch(/2d ago/);
  });
});
