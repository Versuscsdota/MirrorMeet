import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// KV keys
// model:<id> -> { id, name, note, createdAt, createdBy }

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const model = await env.CRM_KV.get(`model:${id}`, { type: 'json' });
    if (!model) return notFound('model');
    return json(model);
  }
  const list = await env.CRM_KV.list({ prefix: 'model:' });
  const items = [];
  for (const k of list.keys) {
    const m = await env.CRM_KV.get(k.name, { type: 'json' });
    if (m) items.push(m);
  }
  items.sort((a,b) => b.createdAt - a.createdAt);
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const name = (body.name || '').trim();
  const note = (body.note || '').trim();
  if (!name) return badRequest('name required');
  const id = newId('mdl');
  const model = { id, name, note, createdAt: Date.now(), createdBy: sess.user.id };
  await env.CRM_KV.put(`model:${id}`, JSON.stringify(model));
  return json(model);
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const id = body.id; if (!id) return badRequest('id required');
  const cur = await env.CRM_KV.get(`model:${id}`, { type: 'json' });
  if (!cur) return notFound('model');
  cur.name = (body.name ?? cur.name).trim();
  cur.note = (body.note ?? cur.note).trim();
  await env.CRM_KV.put(`model:${id}`, JSON.stringify(cur));
  return json(cur);
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return badRequest('id required');
  const cur = await env.CRM_KV.get(`model:${id}`);
  if (!cur) return notFound('model');
  await env.CRM_KV.delete(`model:${id}`);
  return json({ ok: true });
}
