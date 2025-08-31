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
    // aggregate by date with small preview (first 2 slots by time)
    const days = {};
    for (const s of items) {
      if (!s || !s.date) continue;
      const d = (days[s.date] = days[s.date] || { date: s.date, count: 0, slots: [] });
      d.count += 1;
      d.slots.push({ start: s.start, title: s.title });
    }
    const out = Object.values(days)
      .map(d => ({ ...d, slots: (d.slots || []).sort((a,b)=> (a.start||'').localeCompare(b.start||'')).slice(0,2) }))
      .sort((a,b)=> a.date.localeCompare(b.date));
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

  // Validate date YYYY-MM-DD
  const reDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!reDate.test(date)) return badRequest('invalid date format, expected YYYY-MM-DD');
  // Validate time HH:MM 24h
  const reTime = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!reTime.test(start) || !reTime.test(end)) return badRequest('invalid time format, expected HH:MM');
  if (end <= start) return badRequest('end time must be greater than start time');
  if (title.length > 100) return badRequest('title too long (max 100)');
  const notesStr = (body.notes || '').trim();
  if (notesStr.length > 2000) return badRequest('notes too long (max 2000)');
  // Enforce max 2 slots per start time per date
  const prefix = `slot:${date}:`;
  const list = await env.CRM_KV.list({ prefix });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const existing = (fetched || []).filter(Boolean);
  const startHHMM = start.slice(0,5);
  const cntAtTime = existing.filter(s => (s.start || '').slice(0,5) === startHHMM).length;
  if (cntAtTime >= 2) return badRequest('time slot full: maximum 2 slots per time');

  const id = newId('slt');
  const slot = { 
    id, date, start, end, title,
    notes: notesStr || undefined,
    // optional assignment to employee
    employeeId: (body.employeeId || '').trim() || undefined,
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
  const reDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!reDate.test(String(date))) return badRequest('invalid date format, expected YYYY-MM-DD');
  const key = `slot:${date}:${id}`;
  const cur = await env.CRM_KV.get(key, { type: 'json' });
  if (!cur) return notFound('slot');

  const prevStart = cur.start;
  const prevEnd = cur.end;

  const reTime = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if ('start' in body) {
    const s = (body.start || '').trim();
    if (s && !reTime.test(s)) return badRequest('invalid time format for start, expected HH:MM');
    cur.start = s || cur.start;
  }
  if ('end' in body) {
    const e = (body.end || '').trim();
    if (e && !reTime.test(e)) return badRequest('invalid time format for end, expected HH:MM');
    cur.end = e || cur.end;
  }
  if (cur.end <= cur.start) return badRequest('end time must be greater than start time');

  // Enforce max 2 slots per start time per date on time change
  const prefix = `slot:${date}:`;
  const list = await env.CRM_KV.list({ prefix });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const existing = (fetched || []).filter(Boolean);
  const newStartHHMM = (cur.start || '').slice(0,5);
  const cntAtTime = existing.filter(s => s && s.id !== cur.id && (s.start || '').slice(0,5) === newStartHHMM).length;
  if (cntAtTime >= 2) return badRequest('time slot full: maximum 2 slots per time');
  if ('title' in body) {
    const t = (body.title || '').trim();
    if (t.length > 100) return badRequest('title too long (max 100)');
    cur.title = t;
  }
  if ('notes' in body) {
    const n = (body.notes || '').trim();
    if (n.length > 2000) return badRequest('notes too long (max 2000)');
    cur.notes = n || undefined;
  }
  if ('employeeId' in body) cur.employeeId = (body.employeeId || '').trim() || undefined;
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
