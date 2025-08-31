import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createKv } from '../adapters/kvSqlite.js';
import { createFiles } from '../adapters/filesLocal.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const baseDir = path.join(__dirname, '..');
  const KV_SQLITE_PATH = process.env.KV_SQLITE_PATH || path.join(baseDir, 'data.sqlite');
  const FILES_DIR = process.env.FILES_DIR || path.join(baseDir, 'files');
  const DAYS = Number(process.env.FILES_RETENTION_DAYS || 90);
  const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;

  const kv = await createKv(KV_SQLITE_PATH);
  const filesStore = createFiles(FILES_DIR);

  // List all file metas
  const list = await kv.list({ prefix: 'file:' });
  let deleted = 0;
  for (const k of list.keys || []) {
    const id = k.name.split(':').pop();
    const meta = await kv.get(`file:${id}`, { type: 'json' });
    if (!meta) continue;
    const createdAt = Number(meta.createdAt || 0);
    if (!createdAt || createdAt >= cutoff) continue;
    try {
      await filesStore.delete(meta.objectKey);
    } catch {}
    try {
      await kv.delete(`file:${id}`);
      if (meta.entity === 'model') await kv.delete(`file_model:${meta.modelId}:${id}`);
      if (meta.entity === 'slot') await kv.delete(`file_slot:${meta.slotId}:${id}`);
      deleted++;
    } catch {}
  }
  console.log(`cleanup_old_files: retention=${DAYS}d, deleted=${deleted}`);
}

main().catch(e => { console.error('cleanup_old_files error:', e); process.exit(1); });
