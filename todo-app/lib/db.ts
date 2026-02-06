/**
 * Database layer using better-sqlite3
 * Single source of truth for all database operations
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database interfaces
export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  credential_public_key: string;
  counter: number;
  credential_device_type: 'singleDevice' | 'multiDevice';
  credential_backed_up: boolean;
  transports: string; // JSON array
  created_at: string;
}

// Initialize database
const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE CHECK(length(username) >= 3 AND length(username) <= 30),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS authenticators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    credential_public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    credential_device_type TEXT NOT NULL CHECK(credential_device_type IN ('singleDevice', 'multiDevice')),
    credential_backed_up INTEGER NOT NULL DEFAULT 0,
    transports TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
  CREATE INDEX IF NOT EXISTS idx_authenticators_credential_id ON authenticators(credential_id);
`);

// User CRUD operations
export const userDB = {
  create(username: string): User {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = stmt.run(username);
    return {
      id: result.lastInsertRowid as number,
      username,
      created_at: new Date().toISOString(),
    };
  },

  getByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },

  getById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

  exists(username: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
    const result = stmt.get(username) as { count: number };
    return result.count > 0;
  },
};

// Authenticator CRUD operations
export const authenticatorDB = {
  create(data: {
    user_id: number;
    credential_id: string;
    credential_public_key: string;
    counter: number;
    credential_device_type: 'singleDevice' | 'multiDevice';
    credential_backed_up: boolean;
    transports: string[];
  }): Authenticator {
    const stmt = db.prepare(`
      INSERT INTO authenticators (
        user_id, credential_id, credential_public_key, counter,
        credential_device_type, credential_backed_up, transports
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id,
      data.credential_id,
      data.credential_public_key,
      data.counter,
      data.credential_device_type,
      data.credential_backed_up ? 1 : 0,
      JSON.stringify(data.transports)
    );

    return {
      id: result.lastInsertRowid as number,
      ...data,
      transports: JSON.stringify(data.transports),
      created_at: new Date().toISOString(),
    };
  },

  getByCredentialId(credentialId: string): Authenticator | null {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE credential_id = ?');
    return stmt.get(credentialId) as Authenticator | null;
  },

  getByUserId(userId: number): Authenticator[] {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE user_id = ?');
    return stmt.all(userId) as Authenticator[];
  },

  updateCounter(credentialId: string, counter: number): void {
    const stmt = db.prepare('UPDATE authenticators SET counter = ? WHERE credential_id = ?');
    stmt.run(counter, credentialId);
  },
};

export default db;
