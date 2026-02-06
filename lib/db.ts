/**
 * Database Layer - Single source of truth for all DB operations
 * Uses better-sqlite3 (synchronous SQLite)
 */

import Database from 'better-sqlite3';
import path from 'path';

// Types
export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
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
    username TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) <= 500 AND length(trim(title)) > 0),
    completed INTEGER DEFAULT 0 NOT NULL,
    due_date TEXT,
    priority TEXT DEFAULT 'medium' NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
`);

// User operations
export const userDB = {
  create: (username: string): User => {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = stmt.run(username);
    return userDB.findById(result.lastInsertRowid as number)!;
  },

  findById: (id: number): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

  findByUsername: (username: string): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },
};

// Todo operations
export const todoDB = {
  create: (userId: number, data: { 
    title: string; 
    due_date?: string | null;
    priority?: Priority;
  }): Todo => {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, due_date, priority, completed)
      VALUES (?, ?, ?, ?, 0)
    `);
    const result = stmt.run(
      userId,
      data.title.trim(),
      data.due_date || null,
      data.priority || 'medium'
    );
    return todoDB.findById(result.lastInsertRowid as number)!;
  },

  findById: (id: number): Todo | null => {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      completed: Boolean(row.completed),
    };
  },

  list: (userId: number): Todo[] => {
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

  listByPriority: (userId: number, priority: Priority): Todo[] => {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? AND priority = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(userId, priority) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  update: (id: number, data: Partial<Pick<Todo, 'title' | 'completed' | 'due_date' | 'priority'>>): Todo | null => {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title.trim());
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }

    if (updates.length === 0) return todoDB.findById(id);

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
    return todoDB.findById(id);
  },

  delete: (id: number): boolean => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

export default db;
