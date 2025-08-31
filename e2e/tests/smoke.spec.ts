import { test, expect } from '@playwright/test';

const base = process.env.E2E_BASE_URL || 'https://77-73-131-100.sslip.io/';

// Basic availability and UI smoke
test.describe('Smoke', () => {
  test('homepage renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e?.message || e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[console.${msg.type()}] ${msg.text()}`);
    });

    const res = await page.goto(base, { waitUntil: 'domcontentloaded' });
    expect(res?.ok(), 'GET / should be ok').toBeTruthy();

    await expect(page).toHaveTitle(/MirrorCRM/i);
    await expect(page.locator('#app')).toBeVisible();

    // give SPA time to render initial view
    await page.waitForTimeout(500);

    // Optional: some key widgets if present
    const possibleSelectors = ['#view', '#scheduleTable', 'header', 'nav'];
    const anyVisible = await Promise.any(
      possibleSelectors.map(async (sel) => {
        const loc = page.locator(sel);
        try { await loc.first().waitFor({ state: 'visible', timeout: 1000 }); return true; } catch { return false; }
      })
    ).catch(() => false);

    expect(errors.join('\n')).toEqual('');
    // not hard-failing if specific widgets are missing, but at least one should likely appear
    expect(anyVisible).toBeTruthy();
  });
});
