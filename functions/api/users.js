import { json, badRequest, notFound } from '../../_utils.js';
import { requireRole, sha256, newId, incUserCount } from '../../_utils.js';

const ROLES = ['root','admin','interviewer','curator'];

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  if (url.searchParams.get('me')) {
    const { sess, error } = await requireRole(env, request, []);
    if (error) return error;
    const { id, login, role, fullName } = sess.user;
    return json({ id, login, role, fullName });
  }
  const { error } = await requireRole(env, request, ['root']);
  if (error) return error;
  const list = await env.CRM_KV.list({ prefix: 'user:' });
  const items = [];
  for (const k of list.keys) {
    const u = await env.CRM_KV.get(k.name, { type: 'json' });
    if (!u) continue;
    delete u.passHash;
    items.push(u);
  }
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root']);
  if (error) return error;
  let body;
  try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const login = (body.login || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = (body.role || '').trim();
  const fullName = body.fullName || '';
  if (!login || !password || !ROLES.includes(role)) return badRequest('login/password/role required');
  const existing = await env.CRM_KV.get(`user_login:${login}`);
  if (existing) return badRequest('login already exists');
  const id = newId('usr');
  const passHash = await sha256(password);
  const user = { id, login, role, fullName, createdAt: Date.now(), createdBy: sess.user.id };
  await env.CRM_KV.put(`user:${id}`, JSON.stringify({ ...user, passHash }));
  await env.CRM_KV.put(`user_login:${login}`, id);
  await incUserCount(env);
  return json({ ok: true, user });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return badRequest('id required');
  const u = await env.CRM_KV.get(`user:${id}`, { type: 'json' });
  if (!u) return notFound('user');
  await env.CRM_KV.delete(`user:${id}`);
  await env.CRM_KV.delete(`user_login:${u.login}`);
  return json({ ok: true });
}
