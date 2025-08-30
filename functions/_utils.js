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

// --- Stateless session (HMAC signed) helpers ---
function b64urlEncode(buf) {
  const bin = (typeof buf === 'string') ? new TextEncoder().encode(buf) : buf;
  let str = btoa(String.fromCharCode(...new Uint8Array(bin)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}
function b64urlDecode(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const s = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s);
  const arr = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
  return arr;
}
async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}
export async function makeJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const p = { ...payload };
  const h64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const p64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(p)));
  const toSign = `${h64}.${p64}`;
  const sig = await hmacSign(secret, toSign);
  const s64 = b64urlEncode(sig);
  return `${h64}.${p64}.${s64}`;
}
async function verifyJwt(token, secret) {
  try {
    const [h64, p64, s64] = String(token || '').split('.');
    if (!h64 || !p64 || !s64) return null;
    const toSign = `${h64}.${p64}`;
    const sigCalc = await hmacSign(secret, toSign);
    const sigCalc64 = b64urlEncode(sigCalc);
    if (sigCalc64 !== s64) return null;
    const payloadJson = new TextDecoder().decode(b64urlDecode(p64));
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch { return null; }
}

export async function getSessionUser(env, req) {
  const cookies = parseCookies(req);
  const sidName = env.SESSION_COOKIE_NAME || 'mirrorsid';
  const cookieVal = cookies[sidName];
  if (!cookieVal) return null;
  // Try stateless JWT cookie first (prefixed 'jwt.')
  if (cookieVal.startsWith('jwt.')) {
    const secret = env.SESSION_HMAC_SECRET;
    if (secret) {
      const token = cookieVal.slice(4);
      const payload = await verifyJwt(token, secret);
      if (payload && payload.exp && Date.now() < payload.exp) {
        // Option A: trust payload and not hit KV; Option B (safer): read user to ensure still exists
        const user = await env.CRM_KV.get(`user:${payload.userId}`, { type: 'json' });
        if (!user) return null;
        return { user, sid: null };
      }
    }
    // fallthrough to KV session if verification failed
  }
  const sid = cookieVal;
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
