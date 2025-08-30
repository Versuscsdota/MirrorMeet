import * as login from '../functions/api/login.js';
import * as logout from '../functions/api/logout.js';
import * as users from '../functions/api/users.js';
import * as models from '../functions/api/models.js';
import * as files from '../functions/api/files.js';
import * as schedule from '../functions/api/schedule.js';
import { parseCookies, cookieSerialize } from '../functions/_utils.js';
import * as employees from '../functions/api/employees.js';

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  // Login / Logout
  if (pathname === '/api/login' && method === 'POST') return login.onRequestPost({ env, request, context: ctx });
  if (pathname === '/api/logout' && method === 'POST') return logout.onRequestPost({ env, request, context: ctx });

  // Users
  if (pathname === '/api/users') {
    if (method === 'GET') return users.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return users.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return users.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return users.onRequestDelete({ env, request, context: ctx });
  }

  // Employees
  if (pathname === '/api/employees') {
    if (method === 'GET') return employees.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return employees.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return employees.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return employees.onRequestDelete({ env, request, context: ctx });
  }

  // Models
  if (pathname === '/api/models') {
    if (method === 'GET') return models.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return models.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return models.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return models.onRequestDelete({ env, request, context: ctx });
  }

  // Files
  if (pathname === '/api/files') {
    if (method === 'GET') return files.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return files.onRequestPost({ env, request, context: ctx });
    if (method === 'DELETE') return files.onRequestDelete({ env, request, context: ctx });
  }

  // Schedule
  if (pathname === '/api/schedule') {
    if (method === 'GET') return schedule.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return schedule.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return schedule.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return schedule.onRequestDelete({ env, request, context: ctx });
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    // CORS + request-id + simple rate limiting
    const reqId = (crypto?.randomUUID && crypto.randomUUID()) || Math.random().toString(16).slice(2);
    const origin = request.headers.get('origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Vary': 'Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'X-Request-Id': reqId,
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting per IP per minute (soft, best-effort)
    try {
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
      const now = new Date();
      const bucket = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}`;
      const key = `rl:${ip}:${bucket}`;
      const cur = parseInt((await env.CRM_KV.get(key)) || '0', 10) || 0;
      const limit = 300; // 300 req/min per IP
      if (cur >= limit) {
        return new Response('Too Many Requests', { status: 429, headers: corsHeaders });
      }
      // expire after ~70s
      await env.CRM_KV.put(key, String(cur + 1), { expirationTtl: 70 });
    } catch (_) { /* ignore RL errors */ }

    const url = new URL(request.url);
    // Rolling session refresh (best-effort)
    let refreshCookie = null;
    try {
      const cookies = parseCookies(request);
      const sidName = env.SESSION_COOKIE_NAME || 'mirrorsid';
      const sid = cookies[sidName];
      const ttl = Number(env.SESSION_TTL_SECONDS || 604800);
      if (sid) {
        const key = `session:${sid}`;
        const raw = await env.CRM_KV.get(key, { type: 'json' });
        if (raw && raw.exp) {
          const nowMs = Date.now();
          const remaining = raw.exp - nowMs;
          // refresh if осталось < 20% TTL
          if (remaining < ttl * 1000 * 0.2) {
            const newExp = nowMs + ttl * 1000;
            await env.CRM_KV.put(key, JSON.stringify({ ...raw, exp: newExp }), { expirationTtl: ttl });
            refreshCookie = cookieSerialize(sidName, sid, { maxAge: ttl, path: '/' });
          }
        }
      }
    } catch (_) { /* ignore refresh errors */ }
    if (url.pathname.startsWith('/api/')) {
      const resp = await handleApi(request, env, ctx);
      // append headers
      const newHeaders = new Headers(resp.headers);
      for (const [k,v] of Object.entries(corsHeaders)) newHeaders.set(k,v);
      if (refreshCookie) newHeaders.append('set-cookie', refreshCookie);
      return new Response(resp.body, { status: resp.status, headers: newHeaders });
    }
    // serve static assets from /public via [assets] binding
    if (env.ASSETS) {
      const resp = await env.ASSETS.fetch(request);
      const newHeaders = new Headers(resp.headers);
      newHeaders.set('X-Request-Id', reqId);
      if (refreshCookie) newHeaders.append('set-cookie', refreshCookie);
      return new Response(resp.body, { status: resp.status, headers: newHeaders });
    }
    return new Response('Static assets not configured', { status: 500 });
  }
};
