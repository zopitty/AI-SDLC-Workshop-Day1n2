/**
 * Database layer for Todo App
 * Uses better-sqlite3 for synchronous SQLite operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { getSingaporeNow, toSingaporeISO } from './timezone';

// Database file location
const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}

// ============================================================================
// Database Initialization
// ============================================================================

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) <= 500),
    completed INTEGER DEFAULT 0 NOT NULL,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
`);

// ============================================================================
// User Database Operations
// ============================================================================

export const userDB = {
  /**
   * Create a new user
   */
  create(username: string): User {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const info = stmt.run(username);
    return this.get(Number(info.lastInsertRowid))!;
  },

  /**
   * Get user by ID
   */
  get(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return row as User;
  },

  /**
   * Get user by username
   */
  getByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    if (!row) return null;
    return row as User;
  },

  /**
   * Get or create user by username
   */
  getOrCreate(username: string): User {
    let user = this.getByUsername(username);
    if (!user) {
      user = this.create(username);
    }
    return user;
  },
};

// ============================================================================
// Todo Database Operations
// ============================================================================

export const todoDB = {
  /**
   * Get all todos for a user (ordered by created_at DESC)
   */
  list(userId: number): Todo[] {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  /**
   * Get single todo by ID (with user_id check)
   */
  get(id: number, userId: number): Todo | null {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as any;
    if (!row) return null;
    return {
      ...row,
      completed: Boolean(row.completed),
    };
  },

  /**
   * Create new todo
   */
  create(
    userId: number,
    data: { title: string; due_date?: string | null }
  ): Todo {
    const now = toSingaporeISO(getSingaporeNow());
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      data.title,
      data.due_date || null,
      now,
      now
    );
    return this.get(Number(info.lastInsertRowid), userId)!;
  },

  /**
   * Update existing todo
   */
  update(
    id: number,
    userId: number,
    data: Partial<Omit<Todo, 'id' | 'user_id' | 'created_at'>>
  ): Todo | null {
    const existing = this.get(id, userId);
    if (!existing) return null;

    const now = toSingaporeISO(getSingaporeNow());
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(data.due_date);
    }

    // Always update timestamp
    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length === 0) return existing;

    values.push(id, userId);
    const stmt = db.prepare(`
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(...values);

    return this.get(id, userId);
  },

  /**
   * Delete todo
   */
  delete(id: number, userId: number): boolean {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);
    return info.changes > 0;
  },
};

// Export database instance for advanced usage
export { db };
