import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export async function createKv(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at INTEGER
  );`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv(expires_at);`);

  const stmtGet = db.prepare('SELECT value, expires_at FROM kv WHERE key = ?');
  const stmtPut = db.prepare(`INSERT INTO kv(key, value, expires_at) VALUES(?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at`);
  const stmtDel = db.prepare('DELETE FROM kv WHERE key = ?');
  const stmtListPrefix = db.prepare("SELECT key FROM kv WHERE key LIKE ? ESCAPE '\\' ");
  const stmtCleanup = db.prepare('DELETE FROM kv WHERE expires_at IS NOT NULL AND expires_at < ?');

  function likeEscape(s){
    // Escape backslash, percent and underscore for SQL LIKE
    return s.replace(/[\\%_]/g, (m) => '\\' + m);
  }

  async function get(key, opts = {}) {
    // purge expired lazily
    try { stmtCleanup.run(Date.now()); } catch {}
    const row = stmtGet.get(key);
    if (!row) return null;
    if (row.expires_at && row.expires_at < Date.now()) {
      try { stmtDel.run(key); } catch {}
      return null;
    }
    const val = row.value;
    if (opts.type === 'json') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  }

  async function put(key, value, options = {}) {
    let toStore = value;
    if (typeof value !== 'string') toStore = String(value);
    let expires_at = null;
    if (options.expirationTtl) {
      expires_at = Date.now() + Number(options.expirationTtl) * 1000;
    }
    stmtPut.run(key, toStore, expires_at);
  }

  async function del(key) {
    stmtDel.run(key);
  }

  async function list({ prefix = '' } = {}) {
    const esc = likeEscape(prefix);
    const rows = stmtListPrefix.all(esc + '%');
    return { keys: rows.map(r => ({ name: r.key })) };
  }

  return { get, put, delete: del, list };
}
