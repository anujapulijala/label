import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const storageRoot = process.env.STORAGE_ROOT || process.cwd();
const dataDir = path.join(storageRoot, 'data');
const dbPath = path.join(dataDir, 'app.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event TEXT,
  colors TEXT,
  look TEXT,
  notes TEXT,
  material TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER,
  kind TEXT NOT NULL, -- 'sketch' | 'ai'
  filename TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  filename TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// Lightweight migrations
try {
  const cols = db.prepare(`PRAGMA table_info('requests')`).all() as Array<{ name: string }>;
  const names = new Set(cols.map(c => c.name));
  if (!names.has('material')) {
    db.exec(`ALTER TABLE requests ADD COLUMN material TEXT;`);
  }
} catch {}

// Add username column to users if missing
try {
  const colsU = db.prepare(`PRAGMA table_info('users')`).all() as Array<{ name: string }>;
  const namesU = new Set(colsU.map(c => c.name));
  if (!namesU.has('username')) {
    // Cannot add a UNIQUE column via ALTER in SQLite reliably; add column, then create a unique index
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
} catch {}

// Seed default admin if none exists
try {
  const adminCount = db.prepare(`SELECT COUNT(*) as c FROM users WHERE is_admin = 1`).get() as { c: number };
  if ((adminCount?.c ?? 0) === 0) {
    const existingAdmin = db.prepare(`SELECT 1 FROM users WHERE username = ? OR email = ?`).get('admin', 'admin@local');
    if (!existingAdmin) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      db.prepare(`INSERT INTO users (email, username, name, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)`)
        .run('admin@local', 'admin', 'Admin', passwordHash);
    }
  }
} catch {}

export type UserRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  is_admin: number;
  created_at: string;
};

export type RequestRow = {
  id: number;
  user_id: number;
  event: string | null;
  colors: string | null;
  look: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type AssetRow = {
  id: number;
  request_id: number | null;
  kind: 'sketch' | 'ai';
  filename: string;
  created_at: string;
};


