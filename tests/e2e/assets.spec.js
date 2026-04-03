// @ts-check
import { test, expect } from '@playwright/test';

test.describe('JavaScript Modules', () => {
  test('main.js module loads without errors', async ({ request }) => {
    const resp = await request.get('/js/main.js');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text.length).toBeGreaterThan(100);
  });

  test('all core JS modules are accessible', async ({ request }) => {
    const modules = [
      'main.js', 'api.js', 'constants.js', 'state.js',
      'router.js', 'shell.js', 'utils.js', 'i18n.js',
      'event-delegation.js', 'focus-trap.js', 'lazy-images.js',
      'virtual-scroll.js',
    ];

    for (const mod of modules) {
      const resp = await request.get(`/js/${mod}`);
      expect(resp.ok(), `Module /js/${mod} should be accessible`).toBeTruthy();
    }
  });

  test('all page modules are accessible', async ({ request }) => {
    const pages = [
      'auth.js', 'verify.js', 'dashboard.js', 'tasks.js',
      'create-task.js', 'feed.js', 'wallet.js', 'chat.js',
      'support.js', 'profile.js', 'leaderboard.js', 'landing.js',
    ];

    for (const page of pages) {
      const resp = await request.get(`/js/pages/${page}`);
      expect(resp.ok(), `Page /js/pages/${page} should be accessible`).toBeTruthy();
    }
  });
});

test.describe('Static Assets', () => {
  test('CSS file loads', async ({ request }) => {
    const resp = await request.get('/styles.css');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text).toContain(':root');
  });

  test('favicon loads', async ({ request }) => {
    const resp = await request.get('/assets/favicon.svg');
    expect(resp.ok()).toBeTruthy();
  });

  test('logo loads', async ({ request }) => {
    const resp = await request.get('/assets/lolance-logo.svg');
    expect(resp.ok()).toBeTruthy();
  });

  test('PWA icons load', async ({ request }) => {
    const resp192 = await request.get('/assets/icon-192.svg');
    expect(resp192.ok()).toBeTruthy();
    const resp512 = await request.get('/assets/icon-512.svg');
    expect(resp512.ok()).toBeTruthy();
  });
});
