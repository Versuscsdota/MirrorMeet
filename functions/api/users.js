import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, sha256, newId, incUserCount, auditLog } from '../_utils.js';

const ROLES = ['root','admin','interviewer','curator'];

export async function GET(env, request) {
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

export async function PUT(env, request) {
  // Any authenticated user can change their own login/password
  const { sess, error } = await requireRole(env, request, []);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const newLogin = (body.login || '').trim().toLowerCase();
  const newPassword = String(body.password || '');
  if (!newLogin || !newPassword) return badRequest('login/password required');
  if (newPassword.length < 6) return badRequest('password too short');

  const me = await env.CRM_KV.get(`user:${sess.user.id}`, { type: 'json' });
  if (!me) return notFound('user');
  // check login uniqueness if changed
  if (newLogin !== me.login) {
    const exists = await env.CRM_KV.get(`user_login:${newLogin}`);
    if (exists) return badRequest('login already exists');
    // remove previous index
    await env.CRM_KV.delete(`user_login:${me.login}`);
    await env.CRM_KV.put(`user_login:${newLogin}`, me.id);
  }
  const passHash = await sha256(newPassword);
  const updated = { ...me, login: newLogin, mustChange: false };
  await env.CRM_KV.put(`user:${me.id}`, JSON.stringify({ ...updated, passHash }));
  return json({ ok: true, user: { id: updated.id, login: updated.login, role: updated.role, fullName: updated.fullName, mustChange: false } });
}

export async function POST(env, request) {
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
  await auditLog(env, request, sess, 'user_create', { userId: id, login, role, fullName });
  return json({ ok: true, user });
}

export async function DELETE(env, request) {
  const { sess, error } = await requireRole(env, request, ['root']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return badRequest('id required');
  const u = await env.CRM_KV.get(`user:${id}`, { type: 'json' });
  if (!u) return notFound('user');
  await env.CRM_KV.delete(`user:${id}`);
  await env.CRM_KV.delete(`user_login:${u.login}`);
  await auditLog(env, request, sess, 'user_delete', { userId: id, login: u.login });
  return json({ ok: true });
}
