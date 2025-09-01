import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, newId, auditLog } from '../_utils.js';
import { normalizeStatuses, validateStatus, createStatusChangeEntry, syncSlotModelStatuses } from '../_status.js';
import { normalizeDataBlock, mergeDataBlocks, extractModelFieldsFromDataBlock } from '../_schema.js';

// slot key: slot:<date>:<id>  where date = YYYY-MM-DD
// slot: {
//   id, date, start, end, title?, notes?,
//   interview?: { text?: string },
//   history: [{ ts, userId, action: 'create'|'update'|'time_change', comment? }],
//   createdAt, createdBy
// }

export async function GET(env, request) {
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
  const raw = fetched.filter(Boolean);
  // normalize statuses to always be present in API response
  const items = raw.map(s => normalizeStatuses(s));
  items.sort((a,b)=> (a.start||'').localeCompare(b.start||''));
  return json({ items });
}

export async function POST(env, request) {
  const { sess, error } = await requireRole(env, request, ['root','admin']);
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
    // statuses (normalized)
    ...normalizeStatuses({
      status1: body.status1 || 'not_confirmed',
      status2: body.status2,
      status3: body.status3,
      status4: body.status4
    }),
    status2Comment: (body.status2Comment || undefined),
    // optional assignment to employee
    employeeId: (body.employeeId || '').trim() || undefined,
    interview: { text: (body.interviewText || '').trim() || undefined },
    // unified data block for model-related data captured at slot level
    data_block: {
      model_data: Array.isArray(body?.dataBlock?.model_data) ? body.dataBlock.model_data : [],
      forms: Array.isArray(body?.dataBlock?.forms) ? body.dataBlock.forms : [],
      user_id: (body?.dataBlock?.user_id || undefined),
      edit_history: Array.isArray(body?.dataBlock?.edit_history) ? body.dataBlock.edit_history : []
    },
    history: [{ ts: Date.now(), userId: sess.user.id, action: 'create' }],
    createdAt: Date.now(), createdBy: sess.user.id
  };
  await env.CRM_KV.put(`slot:${date}:${id}`, JSON.stringify(slot));
  try { await auditLog(env, request, sess, 'slot_create', { id, date, start, end, title}); } catch {}
  return json(slot);
}

export async function PUT(env, request) {
  const { sess, error } = await requireRole(env, request, ['root','admin']);
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
  const prevTitle = typeof cur.title === 'string' ? cur.title : '';
  const prevNotes = typeof cur.notes === 'string' ? cur.notes : '';
  const prevInterviewText = (cur.interview && typeof cur.interview.text === 'string') ? cur.interview.text : '';
  const prevEmployeeId = typeof cur.employeeId === 'string' ? cur.employeeId : undefined;

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
  let titleChanged = false;
  if ('title' in body) {
    const t = (body.title || '').trim();
    if (t.length > 100) return badRequest('title too long (max 100)');
    titleChanged = (t !== prevTitle);
    cur.title = t;
  }
  let notesChanged = false;
  if ('notes' in body) {
    const n = (body.notes || '').trim();
    if (n.length > 2000) return badRequest('notes too long (max 2000)');
    notesChanged = (n !== prevNotes);
    cur.notes = n || undefined;
  }
  // Status updates with validation
  const oldStatuses = { status1: cur.status1, status2: cur.status2, status3: cur.status3, status4: cur.status4 };
  let statusChanged = false;
  
  if ('status1' in body) {
    if (!validateStatus('status1', body.status1)) return badRequest('invalid status1');
    cur.status1 = body.status1;
    statusChanged = true;
  }
  if ('status2' in body) {
    if (!validateStatus('status2', body.status2)) return badRequest('invalid status2');
    cur.status2 = body.status2 || undefined;
    statusChanged = true;
    if ('status2Comment' in body) {
      cur.status2Comment = body.status2Comment ? String(body.status2Comment) : undefined;
    }
  }
  if ('status3' in body) {
    if (!validateStatus('status3', body.status3)) return badRequest('invalid status3');
    cur.status3 = body.status3 || undefined;
    statusChanged = true;
  }
  if ('status4' in body) {
    if (!validateStatus('status4', body.status4)) return badRequest('invalid status4');
    cur.status4 = body.status4 || undefined;
    statusChanged = true;
  }
  
  let employeeChanged = false;
  if ('employeeId' in body) {
    const emp = (body.employeeId || '').trim() || undefined;
    employeeChanged = (emp !== prevEmployeeId);
    cur.employeeId = emp;
  }
  let interviewChanged = false;
  if ('interviewText' in body) {
    cur.interview = cur.interview || {};
    const it = (body.interviewText || '').trim() || undefined;
    interviewChanged = (it !== prevInterviewText);
    cur.interview.text = it;
  }

  // Update model link if provided
  if ('modelId' in body) {
    const mid = (body.modelId || '').trim();
    cur.modelId = mid || undefined;
  }

  // Unified data block updates
  let dataChanged = false;
  if ('dataBlock' in body && body.dataBlock && typeof body.dataBlock === 'object') {
    const existing = normalizeDataBlock(cur.data_block);
    const merged = mergeDataBlocks(existing, body.dataBlock, { recordEdit: true, editedBy: sess.user.id });
    // detect change by simple JSON diff
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      dataChanged = true;
    }
    cur.data_block = merged;
  }

  // Require comment when time changed
  const timeChanged = (cur.start !== prevStart) || (cur.end !== prevEnd);
  if (timeChanged && !body.comment) return badRequest('comment required for time change');

  // Normalize statuses
  const normalized = normalizeStatuses(cur);
  cur.status1 = normalized.status1;
  cur.status2 = normalized.status2;
  cur.status3 = normalized.status3;
  cur.status4 = normalized.status4;

  // Save
  const toSave = { ...cur, history: [
    ...(Array.isArray(cur.history) ? cur.history : []),
    ...(timeChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'time_change', comment: String(body.comment||'') }] : []),
    ...(statusChanged ? [createStatusChangeEntry(sess.user.id, oldStatuses, { status1: cur.status1, status2: cur.status2, status3: cur.status3, status4: cur.status4 })] : []),
    ...(titleChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'title_change', from: prevTitle, to: cur.title }] : []),
    ...(notesChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'notes_change' }] : []),
    ...(interviewChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'interview_update' }] : []),
    ...(employeeChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'employee_assign', from: prevEmployeeId, to: cur.employeeId }] : []),
    ...(dataChanged ? [{ ts: Date.now(), userId: sess.user.id, action: 'data_block_update' }] : []),
  ] };
  await env.CRM_KV.put(key, JSON.stringify(toSave));
  try {
    const changed = {
      ...(timeChanged ? { time: { from: { start: cur.start, end: cur.end }, to: { start: toSave.start, end: toSave.end } } } : {}),
      ...(statusChanged ? { statuses: { from: oldStatuses, to: { status1: toSave.status1, status2: toSave.status2, status3: toSave.status3, status4: toSave.status4 } } } : {}),
      ...(dataChanged ? { data_block: true } : {})
    };
    if (timeChanged || statusChanged) await auditLog(env, request, sess, 'slot_update', { id, date, ...changed });
  } catch {}
  
  // Sync statuses with linked model if status changed
  if (statusChanged && cur.modelId) {
    await syncSlotModelStatuses(env, cur.id, cur.date, cur.modelId, { status1: cur.status1, status2: cur.status2, status3: cur.status3, status4: cur.status4 });
  }
  // Sync data_block with linked model when changed
  if (dataChanged && cur.modelId) {
    try {
      const modelKey = `model:${cur.modelId}`;
      const model = await env.CRM_KV.get(modelKey, { type: 'json' });
      if (model) {
        const merged = mergeDataBlocks(model.data_block, cur.data_block, { recordEdit: true, editedBy: sess.user.id });
        model.data_block = merged;
        // Optionally map known fields onto model entity
        const fields = extractModelFieldsFromDataBlock(merged);
        if (fields.fullName !== undefined) model.fullName = fields.fullName;
        if (fields.phone !== undefined) {
          model.contacts = model.contacts || {};
          model.contacts.phone = fields.phone;
        }
        await env.CRM_KV.put(modelKey, JSON.stringify(model));
      }
    } catch (e) {
      console.warn('Failed to sync slot data_block -> model:', e);
    }
  }
  
  const responseObj = normalizeStatuses(toSave);
  return json(responseObj);
}

export async function DELETE(env, request) {
  const { sess, error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const date = url.searchParams.get('date');
  if (!id || !date) return badRequest('id/date required');
  const key = `slot:${date}:${id}`;
  const cur = await env.CRM_KV.get(key);
  if (!cur) return notFound('slot');
  await env.CRM_KV.delete(key);
  await auditLog(env, request, sess, 'slot_delete', { id, date });
  return json({ ok: true });
}
