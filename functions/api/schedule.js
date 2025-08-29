import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// event key: event:<date>:<id>  where date = YYYY-MM-DD in UTC
// event: { id, date, startISO, endISO, title, modelId?, employeeId?, createdAt, createdBy }

function toISO(dateStr, hm) {
  // dateStr: YYYY-MM-DD, hm: HH:MM
  return `${dateStr}T${hm}:00.000Z`;
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date) return badRequest('date required');
  const prefix = `event:${date}:`;
  const list = await env.CRM_KV.list({ prefix });
  const items = [];
  for (const k of list.keys) {
    const ev = await env.CRM_KV.get(k.name, { type: 'json' });
    if (ev) items.push(ev);
  }
  items.sort((a,b)=> (a.startISO < b.startISO ? -1 : 1));
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const date = (body.date || '').trim();
  const start = (body.start || '').trim();
  const end = (body.end || '').trim();
  const title = (body.title || '').trim();
  const modelId = body.modelId || null;
  const employeeId = body.employeeId || null;
  if (!date || !start || !end) return badRequest('date/start/end required');
  if (employeeId) {
    const emp = await env.CRM_KV.get(`employee:${employeeId}`);
    if (!emp) return badRequest('invalid employeeId');
  }

  const id = newId('evt');
  const ev = { id, date, startISO: toISO(date, start), endISO: toISO(date, end), title, modelId, employeeId, createdAt: Date.now(), createdBy: sess.user.id };
  await env.CRM_KV.put(`event:${date}:${id}`, JSON.stringify(ev));
  return json(ev);
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const { id, date } = body;
  if (!id || !date) return badRequest('id/date required');
  const key = `event:${date}:${id}`;
  const cur = await env.CRM_KV.get(key, { type: 'json' });
  if (!cur) return notFound('event');
  if (body.start) cur.startISO = toISO(date, body.start);
  if (body.end) cur.endISO = toISO(date, body.end);
  if ('title' in body) cur.title = (body.title || '').trim();
  if ('modelId' in body) cur.modelId = body.modelId || null;
  if ('employeeId' in body) {
    const eid = body.employeeId || null;
    if (eid) {
      const emp = await env.CRM_KV.get(`employee:${eid}`);
      if (!emp) return badRequest('invalid employeeId');
      cur.employeeId = eid;
    } else {
      cur.employeeId = null;
    }
  }
  await env.CRM_KV.put(key, JSON.stringify(cur));
  return json(cur);
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const date = url.searchParams.get('date');
  if (!id || !date) return badRequest('id/date required');
  const key = `event:${date}:${id}`;
  const cur = await env.CRM_KV.get(key);
  if (!cur) return notFound('event');
  await env.CRM_KV.delete(key);
  return json({ ok: true });
}
