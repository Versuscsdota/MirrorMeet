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
import * as audit from './functions/api/audit.js';

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
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 50);
const MAX_UPLOAD_BYTES = Math.max(1, Math.min(MAX_UPLOAD_MB, 1024)) * 1024 * 1024; // cap at 1GB
const MAX_FILES_PER_UPLOAD = Number(process.env.MAX_FILES_PER_UPLOAD || 10);

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
  SESSION_HMAC_SECRET: process.env.SESSION_HMAC_SECRET || '',
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? 'true') !== 'false',
  MAX_UPLOAD_BYTES,
  MAX_FILES_PER_UPLOAD
};

// Support multipart for endpoints that need formData()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_FILES_PER_UPLOAD } });

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

// Helper to call API handlers with Node.js-style parameters
async function callHandler(handler, req, res, parsedForm = null) {
  try {
    const request = {
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: {
        get: (name) => req.get(name) || null,
        'content-type': req.get('content-type')
      },
      json: () => Promise.resolve(req.body),
      formData: () => {
        // When parsedForm is provided (via multer), convert to a real Web FormData with File objects
        if (parsedForm) {
          const fd = new FormData();
          // Append fields
          for (const [k, v] of Object.entries(parsedForm.fields || {})) {
            // Ensure all values are strings
            fd.append(k, typeof v === 'string' ? v : String(v));
          }
          // Append files under the field name 'file'
          for (const f of parsedForm.files || []) {
            const file = new File([f.buffer], f.originalname, { type: f.mimetype });
            fd.append('file', file);
          }
          return Promise.resolve(fd);
        }
        // Fallback for non-multipart
        const fd = new FormData();
        for (const [k, v] of Object.entries(req.body || {})) {
          fd.append(k, typeof v === 'string' ? v : String(v));
        }
        return Promise.resolve(fd);
      }
    };

    // Pass our constructed env (with CRM_KV, CRM_FILES, etc.) to the handler
    const response = await handler(env, request);

    // Copy headers from Web Response to Express
    if (response && response.headers && typeof response.headers.forEach === 'function') {
      response.headers.forEach((value, key) => {
        res.set(key, value);
      });
    }

    // Status
    res.status(response.status || 200);

    // Body: stream/send the Response body
    if (typeof response.text === 'function') {
      const bodyText = await response.text();
      // If content-type is JSON but bodyText is empty, send empty
      res.send(bodyText);
    } else if (response.body) {
      // Fallback: try to send as-is
      res.send(response.body);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// API routes
app.post('/api/login', (req, res) => callHandler(login.POST, req, res));
app.post('/api/logout', (req, res) => callHandler(logout.POST, req, res));

app.get('/api/users', (req, res) => callHandler(users.GET, req, res));
app.post('/api/users', (req, res) => callHandler(users.POST, req, res));
app.put('/api/users', (req, res) => callHandler(users.PUT, req, res));
app.delete('/api/users', (req, res) => callHandler(users.DELETE, req, res));

app.get('/api/employees', (req, res) => callHandler(employees.GET, req, res));
app.post('/api/employees', (req, res) => callHandler(employees.POST, req, res));
app.delete('/api/employees', (req, res) => callHandler(employees.DELETE, req, res));
app.put('/api/employees', (req, res) => callHandler(employees.PUT, req, res));

app.get('/api/models', (req, res) => callHandler(models.GET, req, res));
app.post('/api/models', (req, res) => callHandler(models.POST, req, res));
app.put('/api/models', (req, res) => callHandler(models.PUT, req, res));
app.delete('/api/models', (req, res) => callHandler(models.DELETE, req, res));

app.get('/api/schedule', (req, res) => callHandler(schedule.GET, req, res));
app.post('/api/schedule', (req, res) => callHandler(schedule.POST, req, res));
app.put('/api/schedule', (req, res) => callHandler(schedule.PUT, req, res));
app.delete('/api/schedule', (req, res) => callHandler(schedule.DELETE, req, res));

// Audit (read-only)
app.get('/api/audit', (req, res) => callHandler(audit.GET, req, res));

// Files API with multipart support
app.get('/api/files', (req, res) => callHandler(files.GET, req, res));
app.post('/api/files', upload.any(), async (req, res) => {
  const filesArr = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
  const parsedForm = { fields: req.body || {}, files: filesArr };
  await callHandler(files.POST, req, res, parsedForm);
});
app.delete('/api/files', (req, res) => callHandler(files.DELETE, req, res));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MirrorCRM server listening on 0.0.0.0:${PORT} (local: http://127.0.0.1:${PORT})`);
});
