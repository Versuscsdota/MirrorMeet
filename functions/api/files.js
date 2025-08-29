import { json, badRequest, notFound, forbidden } from '../_utils.js';
import { requireRole, newId } from '../_utils.js';

// file meta in KV: file:<id>
// object in R2: files/<modelId>/<id>

// Validation helpers
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // audio
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
  // video
  'video/mp4', 'video/webm', 'video/ogg'
]);
const BLOCKED_EXT = new Set(['.exe','.bat','.cmd','.sh','.js','.msi','.dll']);
function getExt(name){ const m = /\.([A-Za-z0-9]{1,8})$/.exec(name || ''); return m ? ('.' + m[1].toLowerCase()) : ''; }
function sanitizeName(name){
  let s = (name || '').toString();
  s = s.replace(/[\n\r\t\\/]+/g,' ').replace(/[\x00-\x1F\x7F]/g,'');
  s = s.trim().slice(0, 80);
  if (!s) s = 'file';
  return s;
}
function encodeRFC5987(str) {
  return encodeURIComponent(str).replace(/['()]/g, escape).replace(/\*/g, '%2A');
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const modelId = url.searchParams.get('modelId');

  if (id) {
    const meta = await env.CRM_KV.get(`file:${id}`, { type: 'json' });
    if (!meta) return notFound('file');
    const obj = await env.CRM_FILES.get(meta.objectKey);
    if (!obj) return notFound('file-object');
    // If download requested, require root
    const isDownload = url.searchParams.get('download') === '1';
    if (isDownload) {
      const { error } = await requireRole(env, request, ['root']);
      if (error) return error;
    }
    // Build safe filename with extension for better UX
    const ct = meta.contentType || 'application/octet-stream';
    const extMap = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
      'application/pdf': '.pdf', 'text/plain': '.txt', 'text/csv': '.csv', 'application/zip': '.zip',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };
    const wantedExt = extMap[ct] || '';
    let baseSafe = sanitizeName(meta.name || `file-${id}`);
    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(baseSafe);
    if (!hasExt && wantedExt) baseSafe += wantedExt;
    const safeName = baseSafe;
    const inline = !isDownload;
    const dispo = `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeRFC5987(safeName)}`;
    return new Response(obj.body, { headers: {
      'content-type': ct,
      'content-length': String(meta.size || 0),
      'content-disposition': dispo
    } });
  }

  // Listing requires authenticated roles
  const { error } = await requireRole(env, request, ['root','admin','interviewer','curator']);
  if (error) return error;
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
  let name = (fd.get('name') || '').toString();
  const description = (fd.get('description') || '').toString();
  if (!modelId || !file || !name) return badRequest('modelId, file, name required');

  const model = await env.CRM_KV.get(`model:${modelId}`);
  if (!model) return notFound('model');

  // enforce 50 MB limit
  const MAX = 50 * 1024 * 1024;
  const size = file.size ?? 0;
  if (size > MAX) return forbidden('Размер файла превышает 50 МБ');

  // Type and extension validation
  const contentType = file.type || 'application/octet-stream';
  if (contentType && !ALLOWED_MIME.has(contentType)) {
    return forbidden('Недопустимый тип файла');
  }
  name = sanitizeName(name);
  const ext = getExt(name);
  if (ext && BLOCKED_EXT.has(ext)) return forbidden('Запрещённое расширение файла');

  const id = newId('fil');
  const objectKey = `files/${modelId}/${id}`;

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
