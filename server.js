import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { webcrypto } from 'crypto';

import { createKv } from './adapters/kvSqlite.js';
import { createFiles } from './adapters/filesLocal.js';

// API handlers reused from Workers code
import * as login from './functions/api/login.js';
import * as logout from './functions/api/logout.js';
import * as users from './functions/api/users.js';
import * as models from './functions/api/models.js';
import * as files from './functions/api/files.js';
import * as schedule from './functions/api/schedule.js';
import * as employees from './functions/api/employees.js';

// Ensure Web Crypto APIs exist
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  globalThis.crypto = webcrypto;
}
// Ensure atob/btoa exist (Node.js doesn't have them by default)
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}
if (typeof globalThis.btoa !== 'function') {
  globalThis.btoa = (bin) => Buffer.from(bin, 'binary').toString('base64');
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// CORS (adjust for production)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// Build env for handlers
const env = {
  CRM_KV: await createKv(process.env.KV_SQLITE_PATH || path.join(__dirname, 'data.sqlite')),
  CRM_FILES: createFiles(process.env.FILES_DIR || path.join(__dirname, 'files')),
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'mirrorsid',
  SESSION_TTL_SECONDS: Number(process.env.SESSION_TTL_SECONDS || 604800),
  SESSION_HMAC_SECRET: process.env.SESSION_HMAC_SECRET || ''
};

// Support multipart for endpoints that need formData()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Minimal Request shim to satisfy handlers
class RequestShim {
  constructor(req, parsedForm) {
    this._req = req;
    this._form = parsedForm; // { fields, files }
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers.host;
    this.url = `${proto}://${host}${req.originalUrl}`;
    this.method = req.method;
    this.headers = new Headers(Object.entries(req.headers));
  }
  async json() { return this._req.body; }
  async formData() {
    if (!this._form) throw new Error('multipart/form-data not parsed');
    // Construct a Web FormData with File objects
    const fd = new FormData();
    // fields
    for (const [k, v] of Object.entries(this._form.fields || {})) {
      fd.append(k, v);
    }
    // files: assume single field name 'file'
    for (const f of this._form.files || []) {
      const file = new File([f.buffer], f.originalname, { type: f.mimetype });
      fd.append('file', file);
    }
    return fd;
  }
}

async function callHandler(handler, req, res, parsedForm) {
  try {
    const resp = await handler({ env, request: new RequestShim(req, parsedForm), context: {} });
    const status = resp.status || 200;
    const headers = {};
    resp.headers && resp.headers.forEach((v, k) => { headers[k] = v; });
    const bodyBuf = await (async () => {
      if (resp.body && typeof resp.body.getReader === 'function') {
        const reader = resp.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks);
      }
      if (typeof resp.text === 'function') return await resp.text();
      return '';
    })();
    res.set(headers);
    res.status(status).send(bodyBuf);
  } catch (e) {
    res.status(500).send(`Server error: ${e?.message || String(e)}`);
  }
}

// API routes
app.post('/api/login', (req, res) => callHandler(login.onRequestPost, req, res));
app.post('/api/logout', (req, res) => callHandler(logout.onRequestPost, req, res));

app.get('/api/users', (req, res) => callHandler(users.onRequestGet, req, res));
app.post('/api/users', (req, res) => callHandler(users.onRequestPost, req, res));
app.put('/api/users', (req, res) => callHandler(users.onRequestPut, req, res));
app.delete('/api/users', (req, res) => callHandler(users.onRequestDelete, req, res));

app.get('/api/employees', (req, res) => callHandler(employees.onRequestGet, req, res));
app.post('/api/employees', (req, res) => callHandler(employees.onRequestPost, req, res));
app.put('/api/employees', (req, res) => callHandler(employees.onRequestPut, req, res));
app.delete('/api/employees', (req, res) => callHandler(employees.onRequestDelete, req, res));

app.get('/api/models', (req, res) => callHandler(models.onRequestGet, req, res));
app.post('/api/models', (req, res) => callHandler(models.onRequestPost, req, res));
app.put('/api/models', (req, res) => callHandler(models.onRequestPut, req, res));
app.delete('/api/models', (req, res) => callHandler(models.onRequestDelete, req, res));

app.get('/api/schedule', (req, res) => callHandler(schedule.onRequestGet, req, res));
app.post('/api/schedule', (req, res) => callHandler(schedule.onRequestPost, req, res));
app.put('/api/schedule', (req, res) => callHandler(schedule.onRequestPut, req, res));
app.delete('/api/schedule', (req, res) => callHandler(schedule.onRequestDelete, req, res));

// Files API with multipart support
app.get('/api/files', (req, res) => callHandler(files.onRequestGet, req, res));
app.post('/api/files', upload.single('file'), async (req, res) => {
  const parsedForm = { fields: req.body || {}, files: req.file ? [req.file] : [] };
  await callHandler(files.onRequestPost, req, res, parsedForm);
});
app.delete('/api/files', (req, res) => callHandler(files.onRequestDelete, req, res));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`MirrorCRM server listening on http://127.0.0.1:${PORT}`);
});
