import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Model, Slot, User, AuditLog, ModelStatus } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(__dirname, '../../data/mirrorcrm.db');
// Ensure parent directory exists (e.g., server/data)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with tables
export function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create analytics settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_settings (
      id INTEGER PRIMARY KEY,
      total_leads INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Models table
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fullName TEXT,
      phone TEXT,
      email TEXT,
      telegram TEXT,
      instagram TEXT,
      birthDate TEXT,
      documentType TEXT,
      documentNumber TEXT,
      firstTrialDate TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      tags TEXT,
      slotId TEXT,
      files TEXT,
      comments TEXT,
      accounts TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (slotId) REFERENCES slots(id) ON DELETE SET NULL
    )
  `);

  // Slots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS slots (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      modelId TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      files TEXT,
      clientName TEXT,
      clientPhone TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE SET NULL
    )
  `);

  // Add clientName and clientPhone columns if they don't exist
  try {
    db.prepare('ALTER TABLE slots ADD COLUMN clientName TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.prepare('ALTER TABLE slots ADD COLUMN clientPhone TEXT').run();
  } catch (e) {
    // Column already exists
  }

  // Add status1, status2, visitStatus columns if they don't exist
  try {
    db.prepare('ALTER TABLE slots ADD COLUMN status1 TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.prepare('ALTER TABLE slots ADD COLUMN status2 TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.prepare('ALTER TABLE slots ADD COLUMN visitStatus TEXT').run();
  } catch (e) {
    // Column already exists
  }

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      userId TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      userAgent TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Add missing columns to existing models table
  try {
    db.exec(`ALTER TABLE models ADD COLUMN birthDate TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    db.exec(`ALTER TABLE models ADD COLUMN documentType TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    db.exec(`ALTER TABLE models ADD COLUMN documentNumber TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    db.exec(`ALTER TABLE models ADD COLUMN firstTrialDate TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    db.exec(`ALTER TABLE models ADD COLUMN comments TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    db.exec(`ALTER TABLE models ADD COLUMN accounts TEXT`);
  } catch (e) { /* Column already exists */ }

  // Initialize default admin user
  const existingUser = userDb.getByUsername('root');
  if (!existingUser) {
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, role) 
      VALUES (?, ?, ?, ?)
    `).run(adminId, 'root', hashedPassword, 'admin');
  }

  // Initialize analytics settings
  const existingSettings = db.prepare('SELECT * FROM analytics_settings WHERE id = 1').get();
  if (!existingSettings) {
    db.prepare('INSERT INTO analytics_settings (id, total_leads) VALUES (1, 0)').run();
  }
}

// Model operations
export const modelDb = {
  create(model: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>): Model {
    const id = uuidv4();
    const now = new Date().toISOString();
    const tags = model.tags ? JSON.stringify(model.tags) : null;
    const files = model.files ? JSON.stringify(model.files) : null;
    const comments = model.comments ? JSON.stringify(model.comments) : null;
    const accounts = model.accounts ? JSON.stringify(model.accounts) : null;
    
    db.prepare(`
      INSERT INTO models (id, name, fullName, phone, email, telegram, instagram, birthDate, documentType, documentNumber, firstTrialDate, status, notes, tags, slotId, files, comments, accounts, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, model.name, model.fullName, model.phone, model.email, model.telegram, model.instagram, model.birthDate, model.documentType, model.documentNumber, model.firstTrialDate, model.status, model.notes, tags, model.slotId, files, comments, accounts, now, now);
    
    return this.getById(id)!;
  },

  getAll(): Model[] {
    const rows = db.prepare('SELECT * FROM models ORDER BY createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : [],
      accounts: row.accounts ? JSON.parse(row.accounts) : []
    }));
  },

  getById(id: string): Model | null {
    const row = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : [],
      accounts: row.accounts ? JSON.parse(row.accounts) : []
    };
  },

  update(id: string, updates: Partial<Model>): Model | null {
    const model = this.getById(id);
    if (!model) return null;
    
    const updatedModel = { ...model, ...updates, updatedAt: new Date().toISOString() };
    const tags = updatedModel.tags ? JSON.stringify(updatedModel.tags) : null;
    const files = updatedModel.files ? JSON.stringify(updatedModel.files) : null;
    const comments = updatedModel.comments ? JSON.stringify(updatedModel.comments) : null;
    const accounts = updatedModel.accounts ? JSON.stringify(updatedModel.accounts) : null;
    
    db.prepare(`
      UPDATE models SET name = ?, fullName = ?, phone = ?, email = ?, telegram = ?, instagram = ?, 
      birthDate = ?, documentType = ?, documentNumber = ?, firstTrialDate = ?,
      status = ?, notes = ?, tags = ?, slotId = ?, files = ?, comments = ?, accounts = ?, updatedAt = ?
      WHERE id = ?
    `).run(updatedModel.name, updatedModel.fullName, updatedModel.phone, updatedModel.email, 
           updatedModel.telegram, updatedModel.instagram, updatedModel.birthDate, updatedModel.documentType,
           updatedModel.documentNumber, updatedModel.firstTrialDate, updatedModel.status, updatedModel.notes, 
           tags, updatedModel.slotId, files, comments, accounts, updatedModel.updatedAt, id);
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM models WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Slot operations
export const slotDb = {
  create(slot: Omit<Slot, 'id' | 'createdAt' | 'updatedAt'>): Slot {
    const id = uuidv4();
    const now = new Date().toISOString();
    const files = slot.files ? JSON.stringify(slot.files) : null;
    
    db.prepare(`
      INSERT INTO slots (id, date, time, modelId, status, notes, files, clientName, clientPhone, status1, status2, visitStatus, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, slot.date, slot.time, slot.modelId, slot.status, slot.notes, files, slot.clientName, slot.clientPhone, slot.status1, slot.status2, slot.visitStatus, now, now);
    
    return this.getById(id)!;
  },

  getAll(): Slot[] {
    const rows = db.prepare('SELECT * FROM slots ORDER BY date DESC, time DESC').all();
    return rows.map((row: any) => ({
      ...row,
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : []
    }));
  },

  getById(id: string): Slot | null {
    const row = db.prepare('SELECT * FROM slots WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : []
    };
  },

  update(id: string, updates: Partial<Slot>): Slot | null {
    const slot = this.getById(id);
    if (!slot) return null;
    
    const updatedSlot = { ...slot, ...updates, updatedAt: new Date().toISOString() };
    const files = updatedSlot.files ? JSON.stringify(updatedSlot.files) : null;
    const comments = updatedSlot.comments ? JSON.stringify(updatedSlot.comments) : null;
    
    db.prepare(`
      UPDATE slots SET date = ?, time = ?, modelId = ?, status = ?, notes = ?, files = ?, clientName = ?, clientPhone = ?, status1 = ?, status2 = ?, visitStatus = ?, updatedAt = ?
      WHERE id = ?
    `).run(updatedSlot.date, updatedSlot.time, updatedSlot.modelId, updatedSlot.status, updatedSlot.notes, files, updatedSlot.clientName, updatedSlot.clientPhone, updatedSlot.status1, updatedSlot.status2, updatedSlot.visitStatus, updatedSlot.updatedAt, id);
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM slots WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Analytics settings operations
export const analyticsDb = {
  getLeadsCount(): number {
    const row = db.prepare('SELECT total_leads FROM analytics_settings WHERE id = 1').get() as any;
    return row ? row.total_leads : 0;
  },

  updateLeadsCount(count: number, updatedBy: string): void {
    db.prepare(`
      UPDATE analytics_settings 
      SET total_leads = ?, updated_at = ?, updated_by = ?
      WHERE id = 1
    `).run(count, new Date().toISOString(), updatedBy);
  }
};

// User operations
export const userDb = {
  getByUsername(username: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;
    return row;
  },

  verifyPassword(username: string, password: string): boolean {
    const user = this.getByUsername(username);
    if (!user || !user.password) return false;
    return bcrypt.compareSync(password, user.password);
  }
};

// Audit log operations
export const auditDb = {
  create(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const details = log.details ? JSON.stringify(log.details) : null;
    
    db.prepare(`
      INSERT INTO audit_logs (id, action, entityType, entityId, userId, details, ip, userAgent, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.action, log.entityType, log.entityId, log.userId, details, log.ip, log.userAgent, timestamp);
  },

  getAll(filters?: { from?: string; to?: string; action?: string; userId?: string }): AuditLog[] {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.from) {
      query += ' AND timestamp >= ?';
      params.push(filters.from);
    }
    if (filters?.to) {
      query += ' AND timestamp <= ?';
      params.push(filters.to);
    }
    if (filters?.action) {
      query += ' AND action LIKE ?';
      params.push(`%${filters.action}%`);
    }
    if (filters?.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT 100';
    
    const rows = db.prepare(query).all(...params);
    return rows.map((row: any) => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }
};

// Sync operations
export function syncModelAndSlot(modelId: string, slotId: string): void {
  const model = modelDb.getById(modelId);
  const slot = slotDb.getById(slotId);
  
  if (!model || !slot) return;
  
  // Update model with slot reference
  modelDb.update(modelId, {
    slotId: slotId,
    status: slot.status,
    files: [...(model.files || []), ...(slot.files || [])]
  });
  
  // Update slot with model reference
  slotDb.update(slotId, {
    modelId: modelId,
    status: model.status
  });
}

export default db;
