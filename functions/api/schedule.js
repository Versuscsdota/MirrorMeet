import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// slot key: slot:<date>:<id>  where date = YYYY-MM-DD
// slot: {
//   id, date, start, end, title?, notes?,
//   interview?: { text?: string },
//   history: [{ ts, userId, action: 'create'|'update'|'time_change', comment? }],
//   createdAt, createdBy
// }

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin','interviewer']);
  if (error) return error;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const month = url.searchParams.get('month'); // YYYY-MM

  if (month) {
    const prefix = `slot:${month}-`;
    const list = await env.CRM_KV.list({ prefix });
    const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
    const items = fetched.filter(Boolean);
    // aggregate by date
    const days = {};
    for (const s of items) {
      if (!s || !s.date) continue;
      days[s.date] = days[s.date] || { date: s.date, count: 0 };
      days[s.date].count += 1;
    }
    const out = Object.values(days).sort((a,b)=> a.date.localeCompare(b.date));
    return json({ days: out });
  }

  if (!date) return badRequest('date required');
  const prefix = `slot:${date}:`;
  const list = await env.CRM_KV.list({ prefix });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const items = fetched.filter(Boolean);
  items.sort((a,b)=> (a.start||'').localeCompare(b.start||''));
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin','interviewer']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const date = (body.date || '').trim();
  const start = (body.start || '').trim(); // HH:MM
  const end = (body.end || '').trim();     // HH:MM
  const title = (body.title || '').trim();
  if (!date || !start || !end) return badRequest('date/start/end required');
  const id = newId('slt');
  const slot = { 
    id, date, start, end, title,
    notes: (body.notes || '').trim() || undefined,
    interview: { text: (body.interviewText || '').trim() || undefined },
    history: [{ ts: Date.now(), userId: sess.user.id, action: 'create' }],
    createdAt: Date.now(), createdBy: sess.user.id
  };
  await env.CRM_KV.put(`slot:${date}:${id}`, JSON.stringify(slot));
  return json(slot);
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin','interviewer']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  const { id, date } = body;
  if (!id || !date) return badRequest('id/date required');
  const key = `slot:${date}:${id}`;
  const cur = await env.CRM_KV.get(key, { type: 'json' });
  if (!cur) return notFound('slot');

  const prevStart = cur.start;
  const prevEnd = cur.end;

  if ('start' in body) cur.start = (body.start || '').trim();
  if ('end' in body) cur.end = (body.end || '').trim();
  if ('title' in body) cur.title = (body.title || '').trim();
  if ('notes' in body) cur.notes = (body.notes || '').trim() || undefined;
  if ('interviewText' in body) {
    cur.interview = cur.interview || {};
    cur.interview.text = (body.interviewText || '').trim() || undefined;
  }

  // Require comment when time changed
  const timeChanged = (cur.start !== prevStart) || (cur.end !== prevEnd);
  if (timeChanged && !body.comment) return badRequest('comment required for time change');

  cur.history = cur.history || [];
  cur.history.push({ ts: Date.now(), userId: sess.user.id, action: timeChanged ? 'time_change' : 'update', comment: body.comment || undefined });

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
  const key = `slot:${date}:${id}`;
  const cur = await env.CRM_KV.get(key);
  if (!cur) return notFound('slot');
  await env.CRM_KV.delete(key);
  return json({ ok: true });
}
