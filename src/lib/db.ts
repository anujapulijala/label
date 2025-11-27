import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const isPg = !!process.env.DATABASE_URL;
let sqliteDb: Database | null = null;
let pgPool: Pool | null = null;

function toParamSql(sql: string) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function initSqlite() {
  const storageRoot = process.env.STORAGE_ROOT || process.cwd();
  const dataDir = path.join(storageRoot, 'data');
  const dbPath = path.join(dataDir, 'app.db');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.exec(`
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
    kind TEXT NOT NULL,
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
  );`);
  // migrations
  try {
    const cols = sqliteDb.prepare(`PRAGMA table_info('requests')`).all() as Array<{ name: string }>;
    const names = new Set(cols.map(c => c.name));
    if (!names.has('material')) sqliteDb.exec(`ALTER TABLE requests ADD COLUMN material TEXT;`);
  } catch {}
  try {
    const colsU = sqliteDb.prepare(`PRAGMA table_info('users')`).all() as Array<{ name: string }>;
    const namesU = new Set(colsU.map(c => c.name));
    if (!namesU.has('username')) sqliteDb.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);
    sqliteDb.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
  } catch {}
  try {
    const adminCount = sqliteDb.prepare(`SELECT COUNT(*) as c FROM users WHERE is_admin = 1`).get() as { c: number };
    if ((adminCount?.c ?? 0) === 0) {
      const existingAdmin = sqliteDb.prepare(`SELECT 1 FROM users WHERE username = ? OR email = ?`).get('admin', 'admin@local');
      if (!existingAdmin) {
        const passwordHash = bcrypt.hashSync('admin123', 10);
        sqliteDb.prepare(`INSERT INTO users (email, username, name, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)`)
          .run('admin@local', 'admin', 'Admin', passwordHash);
      }
    }
  } catch {}
}

async function initPg() {
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined });
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        event TEXT,
        colors TEXT,
        look TEXT,
        notes TEXT,
        material TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id),
        kind TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES requests(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        filename TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    const { rows } = await client.query(`SELECT COUNT(*)::int as c FROM users WHERE is_admin = TRUE`);
    if ((rows?.[0]?.c ?? 0) === 0) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      await client.query(`INSERT INTO users (email, username, name, password_hash, is_admin) VALUES ($1,$2,$3,$4,TRUE) ON CONFLICT DO NOTHING`, ['admin@local', 'admin', 'Admin', passwordHash]);
    }
  } finally {
    client.release();
  }
}

let initPromise: Promise<void> | null = null;
export async function ensureDb() {
  if (!initPromise) initPromise = (isPg ? initPg() : initSqlite());
  return initPromise;
}

export async function queryOne<T = any>(sql: string, ...params: any[]): Promise<T | null> {
  await ensureDb();
  if (isPg && pgPool) {
    const { rows } = await pgPool.query(toParamSql(sql), params);
    return (rows[0] as T) ?? null;
    }
  const row = sqliteDb!.prepare(sql).get(...params) as T | undefined;
  return (row as any) ?? null;
}

export async function queryMany<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  await ensureDb();
  if (isPg && pgPool) {
    const { rows } = await pgPool.query(toParamSql(sql), params);
    return rows as T[];
  }
  return sqliteDb!.prepare(sql).all(...params) as T[];
}

export async function run(sql: string, ...params: any[]): Promise<{ changes: number; lastInsertRowid?: number }> {
  await ensureDb();
  if (isPg && pgPool) {
    const isInsert = /^\s*insert/i.test(sql);
    const finalSql = isInsert && !/returning\s+id/i.test(sql) ? `${sql} RETURNING id` : sql;
    const res = await pgPool.query(toParamSql(finalSql), params);
    const lastInsertRowid = isInsert ? res.rows?.[0]?.id : undefined;
    return { changes: res.rowCount || 0, lastInsertRowid };
  }
  const info = sqliteDb!.prepare(sql).run(...params);
  return { changes: info.changes || 0, lastInsertRowid: Number(info.lastInsertRowid) };
}

export type UserRow = {
  id: number;
  email: string;
  username?: string;
  name: string;
  password_hash: string;
  is_admin: number | boolean;
  created_at: string;
};
export type RequestRow = {
  id: number;
  user_id: number;
  event: string | null;
  colors: string | null;
  look: string | null;
  notes: string | null;
  material: string | null;
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

