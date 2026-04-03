import { describe, it, expect, vi } from 'vitest';

vi.mock('../../js/state.js', () => ({
  appState: { S: { lang: 'EN' } },
}));

vi.mock('../../js/i18n.js', () => ({
  t: (key) => key,
}));

import { STORAGE_KEY, API, CATEGORIES, LEVEL_PRIVILEGES, getLvlPriv } from '../../js/constants.js';

describe('STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof STORAGE_KEY).toBe('string');
    expect(STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it('includes version identifier', () => {
    expect(STORAGE_KEY).toMatch(/lolance_state_v\d+/);
  });
});

describe('API', () => {
  it('is an object with endpoint URLs', () => {
    expect(typeof API).toBe('object');
  });

  it('has session endpoint', () => {
    expect(API.session).toBe('api/session.php');
  });

  it('has login endpoint', () => {
    expect(API.login).toBe('api/login.php');
  });

  it('has all expected endpoints', () => {
    const expected = ['session', 'login', 'register', 'verify', 'logout', 'profile', 'tasks', 'wallet', 'messages', 'leaderboard', 'takeTask', 'completeTask', 'cryptoDeposit', 'cryptoWithdraw', 'coins', 'xp', 'chatRooms', 'support', 'feed'];
    expected.forEach(key => {
      expect(API).toHaveProperty(key);
      expect(API[key]).toMatch(/^api\/.+\.php$/);
    });
  });
});

describe('CATEGORIES', () => {
  it('is an array', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true);
  });

  it('has 10 categories', () => {
    expect(CATEGORIES.length).toBe(10);
  });

  it('includes Design', () => {
    expect(CATEGORIES).toContain('Design');
  });

  it('includes Development', () => {
    expect(CATEGORIES).toContain('Development');
  });
});

describe('LEVEL_PRIVILEGES', () => {
  it('is an object', () => {
    expect(typeof LEVEL_PRIVILEGES).toBe('object');
  });

  it('has 12 levels', () => {
    expect(Object.keys(LEVEL_PRIVILEGES).length).toBe(12);
  });

  it('level 1 cannot create tasks', () => {
    expect(LEVEL_PRIVILEGES[1].canCreate).toBe(false);
  });

  it('level 3+ can create tasks', () => {
    expect(LEVEL_PRIVILEGES[3].canCreate).toBe(true);
  });

  it('level 12 has highest privileges', () => {
    expect(LEVEL_PRIVILEGES[12].maxTasks).toBe(999);
    expect(LEVEL_PRIVILEGES[12].canCreate).toBe(true);
  });

  it('each level has required properties', () => {
    for (let i = 1; i <= 12; i++) {
      const level = LEVEL_PRIVILEGES[i];
      expect(level).toHaveProperty('maxTasks');
      expect(level).toHaveProperty('canCreate');
      expect(level).toHaveProperty('maxReward');
      expect(level).toHaveProperty('feedMedia');
      expect(level).toHaveProperty('takeDiff');
      expect(level).toHaveProperty('badge');
      expect(level).toHaveProperty('titleKey');
    }
  });
});

describe('getLvlPriv()', () => {
  it('returns level 1 for invalid input', () => {
    const result = getLvlPriv(0);
    expect(result).toBe(LEVEL_PRIVILEGES[1]);
  });

  it('returns correct level privileges', () => {
    expect(getLvlPriv(5)).toBe(LEVEL_PRIVILEGES[5]);
  });

  it('caps at level 12', () => {
    expect(getLvlPriv(99)).toBe(LEVEL_PRIVILEGES[12]);
  });

  it('handles null/undefined', () => {
    expect(getLvlPriv(null)).toBe(LEVEL_PRIVILEGES[1]);
    expect(getLvlPriv(undefined)).toBe(LEVEL_PRIVILEGES[1]);
  });
});
