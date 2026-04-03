// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('LOLance');
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Check description
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();

    // Check theme color for PWA
    const theme = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(theme).toBe('#b8ff43');
  });

  test('should have PWA manifest linked', async ({ page }) => {
    await page.goto('/');
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('manifest.json');
  });

  test('should have accessibility skip link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    // Allow some network errors (API not available in test), but no JS syntax errors
    const jsErrors = errors.filter(
      (e) => !e.includes('net::') && !e.includes('Failed to fetch') && !e.includes('NetworkError')
    );
    expect(jsErrors).toHaveLength(0);
  });

  test('should have app root element', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('#app');
    await expect(app).toBeAttached();
  });

  test('should have modal, toast and notification containers', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#modalRoot')).toBeAttached();
    await expect(page.locator('#toastRoot')).toBeAttached();
    await expect(page.locator('#notifPanel')).toBeAttached();
  });
});

test.describe('Static Pages', () => {
  test('terms page loads', async ({ page }) => {
    await page.goto('/terms.html');
    await expect(page.locator('body')).toContainText('Terms of Service');
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.locator('body')).toContainText('LOLance');
  });
});

test.describe('PWA Assets', () => {
  test('manifest.json is accessible', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.name).toContain('LOLance');
    expect(json.display).toBe('standalone');
    expect(json.theme_color).toBe('#b8ff43');
  });

  test('service worker file is accessible', async ({ request }) => {
    const resp = await request.get('/sw.js');
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text).toContain('cache');
  });
});

test.describe('Security Headers', () => {
  test('index.html has proper content type', async ({ request }) => {
    const resp = await request.get('/');
    const ct = resp.headers()['content-type'];
    expect(ct).toContain('text/html');
  });
});

test.describe('Responsive Design', () => {
  test('renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('#app')).toBeAttached();
  });

  test('renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('#app')).toBeAttached();
  });

  test('renders on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('#app')).toBeAttached();
  });
});
