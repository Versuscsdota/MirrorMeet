import { json, badRequest, notFound } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// KV keys
// model:<id> -> { id, name, note, fullName, age, height, weight, measurements, contacts, tags, history: [], createdAt, createdBy }

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const model = await env.CRM_KV.get(`model:${id}`, { type: 'json' });
    if (!model) return notFound('model');
    // ensure statuses are present with defaults
    const out = { ...model };
    out.status1 = ['confirmed','not_confirmed','fail'].includes(out.status1 || '') ? out.status1 : 'not_confirmed';
    out.status2 = (out.status2 && ['arrived','no_show','other'].includes(out.status2)) ? out.status2 : undefined;
    out.status3 = (out.status3 && ['thinking','reject_us','reject_candidate','registration'].includes(out.status3)) ? out.status3 : undefined;
    return json(out);
  }
  const list = await env.CRM_KV.list({ prefix: 'model:' });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const itemsRaw = fetched.filter(Boolean);
  const items = itemsRaw.map(m => {
    const out = { ...m };
    out.status1 = ['confirmed','not_confirmed','fail'].includes(out.status1 || '') ? out.status1 : 'not_confirmed';
    out.status2 = (out.status2 && ['arrived','no_show','other'].includes(out.status2)) ? out.status2 : undefined;
    out.status3 = (out.status3 && ['thinking','reject_us','reject_candidate','registration'].includes(out.status3)) ? out.status3 : undefined;
    return out;
  });
  items.sort((a,b) => b.createdAt - a.createdAt);
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }

  // Action: register new model directly from a slot with full registration data
  if (body.action === 'registerFromSlot') {
    const date = (body.date || '').trim();
    const slotId = (body.slotId || '').trim();
    if (!date || !slotId) return badRequest('date and slotId required');
    const slot = await env.CRM_KV.get(`slot:${date}:${slotId}`, { type: 'json' });
    if (!slot) return notFound('slot');

    const name = (body.name || slot.title || '').trim();
    if (!name) return badRequest('name required');
    const fullName = (body.fullName || name).trim();
    const phone = (body.phone || '').trim();
    const birthDate = (body.birthDate || '').trim();
    const docType = (body.docType || '').trim(); // passport | driver | foreign
    const docNumber = (body.docNumber || '').trim();
    const internshipDate = (body.internshipDate || '').trim();
    const regComment = (body.comment || '').trim();
    const id = newId('mdl');

    // sanitize incoming statuses with fallback to slot
    const s1In = (body.status1 || slot.status1 || 'not_confirmed');
    const s2In = (body.status2 || slot.status2 || '');
    const s3In = (body.status3 || slot.status3 || '');
    const s1 = ['confirmed','not_confirmed','fail'].includes(s1In) ? s1In : 'not_confirmed';
    const s2 = ['arrived','no_show','other'].includes(s2In) ? s2In : '';
    const s3 = ['thinking','reject_us','reject_candidate','registration'].includes(s3In) ? s3In : '';

    const model = {
      id,
      name,
      note: regComment,
      fullName,
      age: null,
      height: null,
      weight: null,
      measurements: '',
      contacts: { phone, email: '', instagram: '', telegram: '' },
      tags: [],
      history: [],
      comments: [],
      mainPhotoId: null,
      createdAt: Date.now(),
      createdBy: sess.user.id,
      // Registration snapshot
      registration: {
        slotRef: { id: slot.id, date: slot.date, start: slot.start, end: slot.end },
        birthDate,
        docType: docType || null,
        docNumber: docNumber || null,
        internshipDate: internshipDate || null,
        comment: regComment || ''
      },
      // propagate statuses (request preferred, fallback slot)
      status1: s1,
      status2: s2,
      status3: s3
    };

    // initial history
    model.history.push({ ts: Date.now(), type: 'registration', slot: { id: slot.id, date: slot.date, start: slot.start, end: slot.end, title: slot.title }, text: (slot.interview && slot.interview.text) || '' });
    await env.CRM_KV.put(`model:${id}`, JSON.stringify(model));
    return json(model);
  }

  // Action: ingest slot into existing model (copy files and add interview history)
  if (body.action === 'ingestFromSlot') {
    const modelId = (body.modelId || '').trim();
    const date = (body.date || '').trim();
    const slotId = (body.slotId || '').trim();
    if (!modelId || !date || !slotId) return badRequest('modelId/date/slotId required');
    const model = await env.CRM_KV.get(`model:${modelId}`, { type: 'json' });
    if (!model) return notFound('model');
    const slot = await env.CRM_KV.get(`slot:${date}:${slotId}`, { type: 'json' });
    if (!slot) return notFound('slot');

    // Link files: scan all file metas for this slotId and create model-file metas pointing to same objectKey
    const filesList = await env.CRM_KV.list({ prefix: 'file:' });
    const metas = await Promise.all(filesList.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
    const slotFiles = metas.filter(f => f && f.entity === 'slot' && f.slotId === slotId);
    const linked = [];
    for (const f of slotFiles) {
      const id = newId('fil');
      const meta = { id, entity: 'model', modelId, name: f.name, description: f.description, objectKey: f.objectKey, contentType: f.contentType, size: f.size, createdAt: Date.now() };
      await env.CRM_KV.put(`file:${id}`, JSON.stringify(meta));
      // write index for faster listing
      await env.CRM_KV.put(`file_model:${modelId}:${id}`, '1');
      linked.push({ ...meta, url: `/api/files?id=${id}` });
    }

    // Write history entry into model
    model.history = model.history || [];
    model.history.push({ ts: Date.now(), type: 'interview', slot: { id: slot.id, date: slot.date, start: slot.start, end: slot.end, title: slot.title }, text: slot.interview?.text });
    await env.CRM_KV.put(`model:${modelId}`, JSON.stringify(model));

    return json({ ok: true, linkedCount: linked.length, files: linked, model });
  }
  const name = (body.name || '').trim();
  const note = (body.note || '').trim();
  const fullName = (body.fullName || '').trim();
  const age = body.age ? parseInt(body.age) : null;
  const height = body.height ? parseInt(body.height) : null;
  const weight = body.weight ? parseInt(body.weight) : null;
  const measurements = (body.measurements || '').trim();
  const contacts = {
    phone: (body.phone || '').trim(),
    email: (body.email || '').trim(),
    instagram: (body.instagram || '').trim(),
    telegram: (body.telegram || '').trim()
  };
  const tags = Array.isArray(body.tags) ? body.tags.filter(t => t.trim()).map(t => t.trim()) : [];
  if (!name) return badRequest('name required');
  const id = newId('mdl');
  const model = { id, name, note, fullName, age, height, weight, measurements, contacts, tags, history: [], comments: [], mainPhotoId: null, createdAt: Date.now(), createdBy: sess.user.id };
  await env.CRM_KV.put(`model:${id}`, JSON.stringify(model));
  return json(model);
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
  // Action: immutable comments append
  if (body.action === 'addComment') {
    const modelId = (body.modelId || '').trim();
    const text = (body.text || '').trim();
    if (!modelId || !text) return badRequest('modelId and text required');
    const cur = await env.CRM_KV.get(`model:${modelId}`, { type: 'json' });
    if (!cur) return notFound('model');
    cur.comments = Array.isArray(cur.comments) ? cur.comments : [];
    const entry = { ts: Date.now(), text, user: sess && sess.user ? { id: sess.user.id, login: sess.user.login, role: sess.user.role } : null };
    cur.comments.push(entry);
    await env.CRM_KV.put(`model:${modelId}`, JSON.stringify(cur));
    return json({ ok: true, comment: entry, model: cur });
  }
  const id = body.id; if (!id) return badRequest('id required');
  const cur = await env.CRM_KV.get(`model:${id}`, { type: 'json' });
  if (!cur) return notFound('model');
  cur.name = (body.name ?? cur.name).trim();
  cur.note = (body.note ?? cur.note).trim();
  if (body.fullName !== undefined) cur.fullName = body.fullName.trim();
  if (body.age !== undefined) cur.age = body.age ? parseInt(body.age) : null;
  if (body.height !== undefined) cur.height = body.height ? parseInt(body.height) : null;
  if (body.weight !== undefined) cur.weight = body.weight ? parseInt(body.weight) : null;
  if (body.measurements !== undefined) cur.measurements = body.measurements.trim();
  if (body.contacts !== undefined) {
    cur.contacts = cur.contacts || {};
    if (body.contacts.phone !== undefined) cur.contacts.phone = body.contacts.phone.trim();
    if (body.contacts.email !== undefined) cur.contacts.email = body.contacts.email.trim();
    if (body.contacts.instagram !== undefined) cur.contacts.instagram = body.contacts.instagram.trim();
    if (body.contacts.telegram !== undefined) cur.contacts.telegram = body.contacts.telegram.trim();
  }
  if (body.tags !== undefined) cur.tags = Array.isArray(body.tags) ? body.tags.filter(t => t.trim()).map(t => t.trim()) : [];
  if (body.mainPhotoId !== undefined) cur.mainPhotoId = body.mainPhotoId || null;
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
  // Also delete all files for this model
  const filesList = await env.CRM_KV.list({ prefix: `file:${id}:` });
  await Promise.all(filesList.keys.map(k => env.CRM_KV.delete(k.name)));
  await env.CRM_KV.delete(`model:${id}`);
  return json({ ok: true });
}
