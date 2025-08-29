import { json, badRequest, notFound, forbidden } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// file meta in KV: file:<id>
// object in R2: files/<modelId>/<id>

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const modelId = url.searchParams.get('modelId');

  if (id) {
    const meta = await env.CRM_KV.get(`file:${id}`, { type: 'json' });
    if (!meta) return notFound('file');
    const obj = await env.CRM_FILES.get(meta.objectKey);
    if (!obj) return notFound('file-object');
    return new Response(obj.body, { headers: { 'content-type': meta.contentType || 'application/octet-stream', 'content-length': String(meta.size || 0) } });
  }

  if (!modelId) return badRequest('modelId required');
  const list = await env.CRM_KV.list({ prefix: 'file:' });
  const items = [];
  for (const k of list.keys) {
    const f = await env.CRM_KV.get(k.name, { type: 'json' });
    if (f && f.modelId === modelId) items.push({ ...f, url: `/api/files?id=${f.id}` });
  }
  items.sort((a,b)=> b.createdAt - a.createdAt);
  return json({ items });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { sess, error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;

  if (!request.headers.get('content-type')?.includes('multipart/form-data')) return badRequest('multipart/form-data required');
  const fd = await request.formData();
  const modelId = fd.get('modelId');
  const file = fd.get('file');
  const name = (fd.get('name') || '').toString();
  const description = (fd.get('description') || '').toString();
  if (!modelId || !file || !name) return badRequest('modelId, file, name required');

  const model = await env.CRM_KV.get(`model:${modelId}`);
  if (!model) return notFound('model');

  // enforce 50 MB limit
  const MAX = 50 * 1024 * 1024;
  const size = file.size ?? 0;
  if (size > MAX) return forbidden('Размер файла превышает 50 МБ');

  const id = newId('fil');
  const objectKey = `files/${modelId}/${id}`;
  const contentType = file.type || 'application/octet-stream';

  await env.CRM_FILES.put(objectKey, file.stream(), { httpMetadata: { contentType } });

  const meta = { id, modelId, name, description, objectKey, contentType, size, createdAt: Date.now(), createdBy: sess.user.id };
  await env.CRM_KV.put(`file:${id}`, JSON.stringify(meta));

  return json({ ok: true, file: { ...meta, url: `/api/files?id=${id}` } });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin','curator']);
  if (error) return error;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return badRequest('id required');
  const meta = await env.CRM_KV.get(`file:${id}`, { type: 'json' });
  if (!meta) return notFound('file');
  await env.CRM_FILES.delete(meta.objectKey);
  await env.CRM_KV.delete(`file:${id}`);
  return json({ ok: true });
}
