import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Model, Slot, User, Role, AuditLog, Shift } from '../types';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/mirrorcrm.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const database: Database.Database = new Database(dbPath);
database.pragma('journal_mode = WAL');
export { database };

// Enable foreign keys
database.pragma('foreign_keys = ON');

// Initialize database with tables
export function initDatabase() {
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'inactive',
      fullName TEXT,
      phone TEXT,
      email TEXT,
      firstInternshipDate TEXT,
      avatar TEXT,
      permissions TEXT,
      status TEXT DEFAULT 'inactive',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create roles table
  database.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      permissions TEXT NOT NULL,
      modules TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add modules column to existing roles table if it doesn't exist
  try {
    database.prepare('ALTER TABLE roles ADD COLUMN modules TEXT DEFAULT "{}"').run();
  } catch (e) {
    // Column already exists
  }

  // Create analytics settings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS analytics_settings (
      id INTEGER PRIMARY KEY,
      total_leads INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Models table
  database.exec(`
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
      shifts TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (slotId) REFERENCES slots(id) ON DELETE SET NULL
    )
  `);

  // Slots table
  database.exec(`
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
      registeredBy TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE SET NULL,
      FOREIGN KEY (registeredBy) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Add clientName and clientPhone columns if they don't exist
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN clientName TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN clientPhone TEXT').run();
  } catch (e) {
    // Column already exists
  }

  // Add registeredBy column if it doesn't exist
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN registeredBy TEXT REFERENCES users(id)').run();
  } catch (e) {
    // Column already exists
  }

  // Add status1, status2, visitStatus columns if they don't exist
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN status1 TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN status2 TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.prepare('ALTER TABLE slots ADD COLUMN visitStatus TEXT').run();
  } catch (e) {
    // Column already exists
  }

  // Add new columns to shifts table if they don't exist
  try {
    database.prepare('ALTER TABLE shifts ADD COLUMN actualStartTime TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.prepare('ALTER TABLE shifts ADD COLUMN actualEndTime TEXT').run();
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.prepare('ALTER TABLE shifts ADD COLUMN actualDuration INTEGER').run();
  } catch (e) {
    // Column already exists
  }

  // Shifts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      modelId TEXT,
      responsible TEXT NOT NULL,
      executor TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('inactive', 'pending', 'active', 'completed')),
      totalEarnings REAL DEFAULT 0,
      address TEXT NOT NULL,
      room TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('regular', 'training')),
      accounts TEXT,
      sites TEXT,
      screenshots TEXT,
      comment TEXT,
      actualStartTime TEXT,
      actualEndTime TEXT,
      actualDuration INTEGER,
      birthDate TEXT,
      documentType TEXT,
      documentData TEXT,
      internshipDate TEXT,
      photo TEXT,
      audio TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Audit logs table
  database.exec(`
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
    database.exec(`ALTER TABLE models ADD COLUMN birthDate TEXT`);
  } catch (e) { /* Column already exists */ }

  // Add missing updatedAt column to users table if it doesn't exist
  try {
    database.prepare('ALTER TABLE users ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP').run();
  } catch (e) {
    // Column already exists
  }

  // Create addresses table
  database.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      room TEXT NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(address, room)
    )
  `);
  
  // Add comment column to existing addresses table if it doesn't exist
  try {
    database.exec(`ALTER TABLE addresses ADD COLUMN comment TEXT`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    database.exec(`ALTER TABLE models ADD COLUMN documentType TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE models ADD COLUMN documentNumber TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE models ADD COLUMN firstTrialDate TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE models ADD COLUMN comments TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE models ADD COLUMN accounts TEXT`);
  } catch (e) { /* Column already exists */ }

  // Add new columns to existing users table
  try {
    database.exec(`ALTER TABLE users ADD COLUMN fullName TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN phone TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN firstInternshipDate TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN permissions TEXT`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'inactive'`);
  } catch (e) { /* Column already exists */ }
  
  try {
    database.exec(`ALTER TABLE users ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) { /* Column already exists */ }

  // Clear existing roles and reinitialize with correct ones
  database.prepare('DELETE FROM roles').run();
  
  // Initialize default roles
  const roles = [
      {
        id: uuidv4(),
        name: 'admin',
        displayName: 'Администратор',
        permissions: JSON.stringify([
          'users.create', 'users.read', 'users.update', 'users.delete',
          'models.create', 'models.read', 'models.update', 'models.delete',
          'slots.create', 'slots.read', 'slots.update', 'slots.delete',
          'roles.create', 'roles.read', 'roles.update', 'roles.delete',
          'analytics.read', 'analytics.update', 'audit.read'
        ]),
        modules: JSON.stringify({
          models: { view: true, create: true, edit: true, delete: true, export: true },
          slots: { view: true, create: true, edit: true, delete: true, manage: true },
          shifts: { view: true, create: true, edit: true, delete: true, manage: true },
          analytics: { view: true, edit: true, export: true },
          users: { view: true, create: true, edit: true, delete: true, manage_roles: true },
          audit: { view: true, export: true },
          settings: { view: true, edit: true }
        })
      },
      {
        id: uuidv4(),
        name: 'producer',
        displayName: 'Продьюсер',
        permissions: JSON.stringify([
          'models.create', 'models.read', 'models.update',
          'slots.create', 'slots.read', 'slots.update',
          'analytics.read'
        ]),
        modules: JSON.stringify({
          models: { view: true, create: true, edit: true, delete: false, export: true },
          slots: { view: true, create: true, edit: true, delete: false, manage: true },
          shifts: { view: true, create: true, edit: true, delete: false, manage: true },
          analytics: { view: true, edit: false, export: true },
          users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
          audit: { view: false, export: false },
          settings: { view: false, edit: false }
        })
      },
      {
        id: uuidv4(),
        name: 'curator',
        displayName: 'Куратор',
        permissions: JSON.stringify([
          'models.read', 'models.update',
          'slots.read', 'slots.update',
          'analytics.read'
        ]),
        modules: JSON.stringify({
          models: { view: true, create: false, edit: true, delete: false, export: false },
          slots: { view: true, create: false, edit: true, delete: false, manage: false },
          shifts: { view: true, create: false, edit: true, delete: false, manage: false },
          analytics: { view: true, edit: false, export: false },
          users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
          audit: { view: false, export: false },
          settings: { view: false, edit: false }
        })
      },
      {
        id: uuidv4(),
        name: 'interviewer',
        displayName: 'Интервьюер',
        permissions: JSON.stringify([
          'models.read', 'models.update',
          'slots.read'
        ]),
        modules: JSON.stringify({
          models: { view: true, create: false, edit: true, delete: false, export: false },
          slots: { view: true, create: false, edit: false, delete: false, manage: false },
          shifts: { view: true, create: false, edit: false, delete: false, manage: false },
          analytics: { view: false, edit: false, export: false },
          users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
          audit: { view: false, export: false },
          settings: { view: false, edit: false }
        })
      },
      {
        id: uuidv4(),
        name: 'operator',
        displayName: 'Оператор',
        permissions: JSON.stringify([
          'models.read',
          'slots.read'
        ]),
        modules: JSON.stringify({
          models: { view: true, create: false, edit: false, delete: false, export: false },
          slots: { view: true, create: false, edit: false, delete: false, manage: false },
          shifts: { view: true, create: false, edit: false, delete: false, manage: false },
          analytics: { view: false, edit: false, export: false },
          users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
          audit: { view: false, export: false },
          settings: { view: false, edit: false }
        })
      },
      {
        id: uuidv4(),
        name: 'inactive',
        displayName: 'Неактивный',
        permissions: JSON.stringify([]),
        modules: JSON.stringify({
          models: { view: false, create: false, edit: false, delete: false, export: false },
          slots: { view: false, create: false, edit: false, delete: false, manage: false },
          shifts: { view: false, create: false, edit: false, delete: false, manage: false },
          analytics: { view: false, edit: false, export: false },
          users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
          audit: { view: false, export: false },
          settings: { view: false, edit: false }
        })
      }
    ];

    const insertRole = database.prepare(`
      INSERT INTO roles (id, name, displayName, permissions, modules)
      VALUES (?, ?, ?, ?, ?)
    `);

  roles.forEach(role => {
    insertRole.run(role.id, role.name, role.displayName, role.permissions, role.modules || '{}');
  });

  // Initialize default admin user
  const existingUser = userDb.getByUsername('root');
  if (!existingUser) {
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    database.prepare(`
      INSERT INTO users (id, username, password, role, fullName, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'root', hashedPassword, 'admin', 'Root Administrator', 'active');
  } else if (existingUser.status === 'inactive') {
    // Ensure root user is always active
    database.prepare('UPDATE users SET status = ? WHERE username = ?').run('active', 'root');
  }

  // Initialize analytics settings
  const existingSettings = database.prepare('SELECT * FROM analytics_settings WHERE id = 1').get();
  if (!existingSettings) {
    database.prepare('INSERT INTO analytics_settings (id, total_leads) VALUES (1, 0)').run();
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
    
    database.prepare(`
      INSERT INTO models (id, name, fullName, phone, email, telegram, instagram, birthDate, documentType, documentNumber, firstTrialDate, status, notes, tags, slotId, files, comments, accounts, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, model.name, model.fullName, model.phone, model.email, model.telegram, model.instagram, model.birthDate, model.documentType, model.documentNumber, model.firstTrialDate, model.status, model.notes, tags, model.slotId, files, comments, accounts, now, now);
    
    return this.getById(id)!;
  },

  getAll(): Model[] {
    const rows = database.prepare('SELECT * FROM models ORDER BY createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : [],
      accounts: row.accounts ? JSON.parse(row.accounts) : []
    }));
  },

  getById(id: string): Model | null {
    const row = database.prepare('SELECT * FROM models WHERE id = ?').get(id) as any;
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
    
    database.prepare(`
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
    const result = database.prepare('DELETE FROM models WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Slot operations
export const slotDb = {
  create(slot: Omit<Slot, 'id' | 'createdAt' | 'updatedAt'>): Slot {
    const id = uuidv4();
    const now = new Date().toISOString();
    const files = slot.files ? JSON.stringify(slot.files) : null;
    
    database.prepare(`
      INSERT INTO slots (id, date, time, modelId, status, notes, files, clientName, clientPhone, status1, status2, visitStatus, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, slot.date, slot.time, slot.modelId, slot.status, slot.notes, files, slot.clientName, slot.clientPhone, slot.status1, slot.status2, slot.visitStatus, now, now);
    
    return this.getById(id)!;
  },

  getAll(): Slot[] {
    const rows = database.prepare('SELECT * FROM slots ORDER BY date DESC, time DESC').all();
    return rows.map((row: any) => ({
      ...row,
      files: row.files ? JSON.parse(row.files) : [],
      comments: row.comments ? JSON.parse(row.comments) : []
    }));
  },

  getById(id: string): Slot | null {
    const row = database.prepare('SELECT * FROM slots WHERE id = ?').get(id) as any;
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
    
    database.prepare(`
      UPDATE slots SET date = ?, time = ?, modelId = ?, status = ?, notes = ?, files = ?, clientName = ?, clientPhone = ?, status1 = ?, status2 = ?, visitStatus = ?, updatedAt = ?
      WHERE id = ?
    `).run(updatedSlot.date, updatedSlot.time, updatedSlot.modelId, updatedSlot.status, updatedSlot.notes, files, updatedSlot.clientName, updatedSlot.clientPhone, updatedSlot.status1, updatedSlot.status2, updatedSlot.visitStatus, updatedSlot.updatedAt, id);
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM slots WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Analytics settings operations
export const analyticsDb = {
  getLeadsCount(): number {
    const row = database.prepare('SELECT total_leads FROM analytics_settings WHERE id = 1').get() as any;
    return row ? row.total_leads : 0;
  },

  updateLeadsCount(count: number, updatedBy: string): void {
    database.prepare(`
      UPDATE analytics_settings 
      SET total_leads = ?, updated_at = ?, updated_by = ?
      WHERE id = 1
    `).run(count, new Date().toISOString(), updatedBy);
  }
};

// User operations
export const userDb = {
  create(userData: {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    email?: string;
    firstInternshipDate?: string;
    avatar?: string;
    role?: string;
    status?: string;
  }): User {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const now = new Date().toISOString();
    
    database.prepare(`
      INSERT INTO users (id, username, password, fullName, phone, email, firstInternshipDate, avatar, role, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      userData.username, 
      hashedPassword, 
      userData.fullName, 
      userData.phone, 
      userData.email || null,
      userData.firstInternshipDate || null,
      userData.avatar || null,
      userData.role || 'inactive',
      userData.status || 'inactive',
      now
    );
    
    return this.getById(id)!;
  },

  getAll(): User[] {
    const rows = database.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : []
    }));
  },

  getById(id: string): User | null {
    const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : []
    };
  },

  getByUsername(username: string): User | null {
    const row = database.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;
    return {
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : []
    };
  },

  update(id: string, updates: Partial<User>): User | null {
    const user = this.getById(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    const permissions = updatedUser.permissions ? JSON.stringify(updatedUser.permissions) : null;
    
    database.prepare(`
      UPDATE users SET username = ?, fullName = ?, phone = ?, email = ?, firstInternshipDate = ?, avatar = ?, role = ?, status = ?, permissions = ?, password = ?
      WHERE id = ?
    `).run(
      updatedUser.username,
      updatedUser.fullName,
      updatedUser.phone,
      updatedUser.email,
      updatedUser.firstInternshipDate,
      updatedUser.avatar,
      updatedUser.role,
      updatedUser.status,
      permissions,
      updatedUser.password || user.password,
      id
    );
    
    return this.getById(id);
  },

  updateRole(id: string, role: string): User | null {
    const user = this.getById(id);
    if (!user) return null;
    
    database.prepare('UPDATE users SET role = ? WHERE id = ?')
      .run(role, id);
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },

  verifyPassword(username: string, password: string): boolean {
    const user = this.getByUsername(username);
    if (!user || !user.password) return false;
    return bcrypt.compareSync(password, user.password);
  }
};

// Role operations
export const roleDb = {
  getAll(): Role[] {
    const rows = database.prepare('SELECT * FROM roles ORDER BY name').all();
    return rows.map((row: any) => ({
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      modules: row.modules ? JSON.parse(row.modules) : {}
    }));
  },

  getById(id: string): Role | null {
    const row = database.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      modules: row.modules ? JSON.parse(row.modules) : {}
    };
  },

  getByName(name: string): Role | null {
    const row = database.prepare('SELECT * FROM roles WHERE name = ?').get(name) as any;
    if (!row) return null;
    return {
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      modules: row.modules ? JSON.parse(row.modules) : {}
    };
  },

  create(roleData: {
    name: string;
    displayName: string;
    permissions: string[];
    modules?: Record<string, any>;
  }): Role {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    database.prepare(`
      INSERT INTO roles (id, name, displayName, permissions, modules, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      roleData.name,
      roleData.displayName,
      JSON.stringify(roleData.permissions),
      JSON.stringify(roleData.modules || {}),
      now,
      now
    );
    
    return this.getById(id)!;
  },

  update(id: string, updates: Partial<Role>): Role | null {
    const role = this.getById(id);
    if (!role) return null;
    
    const updatedRole = { ...role, ...updates, updatedAt: new Date().toISOString() };
    const permissions = JSON.stringify(updatedRole.permissions);
    const modules = JSON.stringify(updatedRole.modules);
    
    database.prepare(`
      UPDATE roles SET name = ?, displayName = ?, permissions = ?, modules = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      updatedRole.name,
      updatedRole.displayName,
      permissions,
      modules,
      updatedRole.updatedAt,
      id
    );
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM roles WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Audit log operations
export const auditDb = {
  create(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const details = log.details ? JSON.stringify(log.details) : null;
    
    database.prepare(`
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
    
    const rows = database.prepare(query).all(...params);
    return rows.map((row: any) => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }
};

// Shifts database operations
export const shiftDb = {
  create(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Shift {
    const id = uuidv4();
    const now = new Date().toISOString();
    const accounts = shift.accounts ? JSON.stringify(shift.accounts) : '[]';
    const sites = shift.sites ? JSON.stringify(shift.sites) : '[]';
    const screenshots = shift.screenshots ? JSON.stringify(shift.screenshots) : '[]';
    
    database.prepare(`
      INSERT INTO shifts (id, model, modelId, responsible, executor, date, time, start, end, status, totalEarnings, address, room, type, accounts, sites, screenshots, comment, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, shift.model, shift.modelId, shift.responsible, shift.executor, 
      shift.date, shift.time, shift.start, shift.end, shift.status, 
      shift.totalEarnings || 0, shift.address, shift.room, shift.type, 
      accounts, sites, screenshots, shift.comment, now, now
    );
    
    return this.getById(id)!;
  },

  getAll(): Shift[] {
    const rows = database.prepare('SELECT * FROM shifts ORDER BY createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      accounts: row.accounts ? JSON.parse(row.accounts) : [],
      sites: row.sites ? JSON.parse(row.sites) : [],
      screenshots: row.screenshots ? JSON.parse(row.screenshots) : []
    }));
  },

  getById(id: string): Shift | null {
    const row = database.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
    if (!row) return null;
    
    return {
      ...(row as any),
      accounts: (row as any).accounts ? JSON.parse((row as any).accounts) : [],
      sites: (row as any).sites ? JSON.parse((row as any).sites) : [],
      screenshots: (row as any).screenshots ? JSON.parse((row as any).screenshots) : []
    };
  },

  update(id: string, updates: Partial<Shift>): Shift | null {
    const shift = this.getById(id);
    if (!shift) return null;
    
    const updatedShift = { ...shift, ...updates, updatedAt: new Date().toISOString() };
    const accounts = updatedShift.accounts ? JSON.stringify(updatedShift.accounts) : '[]';
    const sites = updatedShift.sites ? JSON.stringify(updatedShift.sites) : '[]';
    const screenshots = updatedShift.screenshots ? JSON.stringify(updatedShift.screenshots) : '[]';
    
    database.prepare(`
      UPDATE shifts SET 
        model = ?, modelId = ?, responsible = ?, executor = ?, date = ?, time = ?, start = ?, end = ?, 
        status = ?, totalEarnings = ?, address = ?, room = ?, type = ?, accounts = ?, sites = ?, 
        screenshots = ?, comment = ?, actualStartTime = ?, actualEndTime = ?, actualDuration = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      updatedShift.model, updatedShift.modelId, updatedShift.responsible, updatedShift.executor,
      updatedShift.date, updatedShift.time, updatedShift.start, updatedShift.end, updatedShift.status,
      updatedShift.totalEarnings, updatedShift.address, updatedShift.room, updatedShift.type,
      accounts, sites, screenshots, updatedShift.comment, 
      (updatedShift as any).actualStartTime || null, (updatedShift as any).actualEndTime || null, (updatedShift as any).actualDuration || null,
      updatedShift.updatedAt, id
    );
    
    return this.getById(id);
  },

  delete(id: string): boolean {
    const result = database.prepare('DELETE FROM shifts WHERE id = ?').run(id);
    return result.changes > 0;
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

export default database;
