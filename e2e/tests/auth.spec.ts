import { test, expect, request } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://77-73-131-100.sslip.io/';
const login = process.env.E2E_LOGIN || '';
const password = process.env.E2E_PASSWORD || '';
const sessionCookieName = process.env.E2E_SESSION_COOKIE_NAME || 'mirrorsid';

// Helper: do API login and return cookie string
async function apiLogin(): Promise<string | null> {
  if (!login || !password) return null;
  const ctx = await request.newContext({ baseURL });
  const resp = await ctx.post('/api/login', {
    data: { login, password },
    headers: { 'content-type': 'application/json' },
  });
  if (!resp.ok()) return null;
  const cookies = resp.headers()['set-cookie'] || resp.headers()['Set-Cookie'];
  return cookies || null;
}

test.describe('Auth and protected API', () => {
  test.skip(!login || !password, 'E2E_LOGIN/E2E_PASSWORD not provided');

  test('can login via API and access protected endpoint', async ({ browser }) => {
    const setCookie = await apiLogin();
    expect(setCookie, 'login should set cookie').toBeTruthy();

    // Extract cookie value for mirrorsid
    const m = new RegExp(`${sessionCookieName}=([^;]+)`).exec(String(setCookie));
    expect(m).toBeTruthy();
    const cookieValue = m![1];

    const context = await browser.newContext({
      baseURL,
    });

    await context.addCookies([
      {
        name: sessionCookieName,
        value: cookieValue,
        domain: new URL(baseURL).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();
    await page.goto('/');

    // Call a protected API and expect 200
    const res = await page.request.get('/api/employees');
    expect(res.ok(), 'GET /api/employees should be ok with session cookie').toBeTruthy();

    // Basic schema check
    const json = await res.json();
    expect(json && (Array.isArray(json.items) || Array.isArray(json))).toBeTruthy();
  });
});
