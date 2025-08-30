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
    return json(model);
  }
  const list = await env.CRM_KV.list({ prefix: 'model:' });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const items = fetched.filter(Boolean);
  items.sort((a,b) => b.createdAt - a.createdAt);
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;
  let body; try { body = await request.json(); } catch { return badRequest('Expect JSON'); }

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
  const model = { id, name, note, fullName, age, height, weight, measurements, contacts, tags, history: [], createdAt: Date.now(), createdBy: sess.user.id };
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
