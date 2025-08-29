// Shared utilities for Pages Functions
export const json = (data, init = {}) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', ...(init.headers || {}) }, ...init });
export const text = (msg, init = {}) => new Response(msg, { headers: { 'content-type': 'text/plain; charset=utf-8', ...(init.headers || {}) }, ...init });

export const badRequest = (msg) => text(msg || 'Bad Request', { status: 400 });
export const unauthorized = (msg) => text(msg || 'Unauthorized', { status: 401 });
export const forbidden = (msg) => text(msg || 'Forbidden', { status: 403 });
export const notFound = (msg) => text(msg || 'Not Found', { status: 404 });

export async function sha256(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

export function newId(prefix = '') {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const id = [...bytes].map(b => b.toString(16).padStart(2,'0')).join('');
  return prefix ? `${prefix}_${id}` : id;
}

export function cookieSerialize(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`); else parts.push('Path=/');
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  parts.push('Secure');
  return parts.join('; ');
}

export function parseCookies(req) {
  const hdr = req.headers.get('cookie') || '';
  const out = {};
  hdr.split(/;\s*/).forEach(p => { const [k, ...v] = p.split('='); if (k) out[k] = v.join('='); });
  return out;
}

export async function getSessionUser(env, req) {
  const cookies = parseCookies(req);
  const sidName = env.SESSION_COOKIE_NAME || 'sid';
  const sid = cookies[sidName];
  if (!sid) return null;
  const raw = await env.CRM_KV.get(`session:${sid}`, { type: 'json' });
  if (!raw) return null;
  if (raw.exp && Date.now() > raw.exp) {
    await env.CRM_KV.delete(`session:${sid}`);
    return null;
  }
  const user = await env.CRM_KV.get(`user:${raw.userId}`, { type: 'json' });
  if (!user) return null;
  return { user, sid };
}

export async function requireRole(env, req, roles = []) {
  const sess = await getSessionUser(env, req);
  if (!sess) return { error: unauthorized('Требуется вход') };
  if (roles.length && !roles.includes(sess.user.role)) return { error: forbidden('Недостаточно прав') };
  return { sess };
}

export async function ensureIndexes(env) {
  // simple counters for first-run checks
  const flag = await env.CRM_KV.get('init:done');
  if (!flag) {
    await env.CRM_KV.put('init:done', '1');
  }
}

export async function firstUserExists(env) {
  const count = Number(await env.CRM_KV.get('users:count') || '0');
  return count > 0;
}

export async function incUserCount(env) {
  const count = Number(await env.CRM_KV.get('users:count') || '0');
  await env.CRM_KV.put('users:count', String(count + 1));
}
