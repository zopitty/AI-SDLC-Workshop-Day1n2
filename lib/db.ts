<<<<<<< HEAD
import Database from 'better-sqlite3';
import { getSingaporeNow } from './timezone';

// Types
export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Interfaces
export interface User {
  id: number;
  username: string;
  created_at: string;
}
=======
/**
 * Database Layer - Single source of truth for all DB operations
 * Uses better-sqlite3 (synchronous SQLite)
 */

import Database from 'better-sqlite3';
import path from 'path';

// Types
export type Priority = 'high' | 'medium' | 'low';
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
<<<<<<< HEAD
  priority: Priority;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  progress?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
=======
  due_date: string | null;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
  created_at: string;
}

// Initialize database
<<<<<<< HEAD
const db = new Database('todos.db');
db.pragma('journal_mode = WAL');
=======
const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Enable foreign keys
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
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
<<<<<<< HEAD
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    due_date TEXT,
    is_recurring INTEGER DEFAULT 0 NOT NULL,
    recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL),
    reminder_minutes INTEGER,
=======
    due_date TEXT,
    priority TEXT DEFAULT 'medium' NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

<<<<<<< HEAD
  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(title) <= 200 AND length(trim(title)) > 0),
    completed INTEGER DEFAULT 0 NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
  CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
  CREATE INDEX IF NOT EXISTS idx_subtasks_position ON subtasks(todo_id, position);
`);

// User DB operations
export const userDB = {
  create(username: string): User {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const info = stmt.run(username);
    return this.getById(info.lastInsertRowid as number)!;
  },

  getById(id: number): User | null {
=======
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
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

<<<<<<< HEAD
  getByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },
};

// Todo DB operations
export const todoDB = {
  create(userId: number, data: {
    title: string;
    priority?: Priority;
    due_date?: string | null;
    is_recurring?: boolean;
    recurrence_pattern?: RecurrencePattern | null;
    reminder_minutes?: number | null;
  }): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, is_recurring, recurrence_pattern, reminder_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      data.title,
      data.priority || 'medium',
      data.due_date || null,
      data.is_recurring ? 1 : 0,
      data.recurrence_pattern || null,
      data.reminder_minutes || null
    );
    return this.getById(userId, info.lastInsertRowid as number)!;
  },

  getById(userId: number, id: number): Todo | null {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
    const todo = stmt.get(id, userId) as any;
    if (!todo) return null;
    
    // Convert INTEGER to boolean
    todo.completed = Boolean(todo.completed);
    todo.is_recurring = Boolean(todo.is_recurring);
    
    return todo as Todo;
  },

  getWithSubtasks(userId: number, id: number): Todo | null {
    const todo = this.getById(userId, id);
    if (!todo) return null;
    
    todo.subtasks = subtaskDB.list(id);
    todo.progress = calculateProgress(todo.subtasks);
    
    return todo;
  },

  list(userId: number): Todo[] {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        due_date IS NULL,
        due_date ASC,
        created_at DESC
    `);
    const todos = stmt.all(userId) as any[];
    
    return todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed),
      is_recurring: Boolean(todo.is_recurring),
    })) as Todo[];
  },

  update(userId: number, id: number, data: Partial<Todo>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.is_recurring !== undefined) {
      fields.push('is_recurring = ?');
      values.push(data.is_recurring ? 1 : 0);
    }
    if (data.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = ?');
      values.push(data.recurrence_pattern);
    }
    if (data.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = ?');
      values.push(data.reminder_minutes);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = datetime("now")');
    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE todos 
      SET ${fields.join(', ')} 
      WHERE id = ? AND user_id = ?
    `);
    const info = stmt.run(...values);
    return info.changes > 0;
  },

  delete(userId: number, id: number): boolean {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);
    return info.changes > 0;
  },
};

// Subtask DB operations
export const subtaskDB = {
  list(todoId: number): Subtask[] {
    const stmt = db.prepare(`
      SELECT * FROM subtasks 
      WHERE todo_id = ? 
      ORDER BY position ASC, created_at ASC
    `);
    const subtasks = stmt.all(todoId) as any[];
    
    return subtasks.map(subtask => ({
      ...subtask,
      completed: Boolean(subtask.completed),
    })) as Subtask[];
  },

  create(todoId: number, data: { title: string }): Subtask {
    // Get max position for this todo
    const maxPosition = this.getMaxPosition(todoId);
    const nextPosition = maxPosition + 1;

    const stmt = db.prepare(`
      INSERT INTO subtasks (todo_id, title, position)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(todoId, data.title, nextPosition);
    return this.getById(info.lastInsertRowid as number)!;
  },

  getById(id: number): Subtask | null {
    const stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
    const subtask = stmt.get(id) as any;
    if (!subtask) return null;
    
    subtask.completed = Boolean(subtask.completed);
    return subtask as Subtask;
  },

  update(id: number, data: { title?: string; completed?: boolean }): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }

    if (fields.length === 0) return false;

    values.push(id);

    const stmt = db.prepare(`
      UPDATE subtasks 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    const info = stmt.run(...values);
    return info.changes > 0;
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },

  getMaxPosition(todoId: number): number {
    const stmt = db.prepare('SELECT MAX(position) as max_pos FROM subtasks WHERE todo_id = ?');
    const result = stmt.get(todoId) as { max_pos: number | null };
    return result.max_pos ?? -1;
  },
};

// Helper function to calculate progress
export function calculateProgress(subtasks: Subtask[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = subtasks.length;
  const completed = subtasks.filter(s => s.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, percentage };
}

=======
  findByUsername: (username: string): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },

  getOrCreate: (username: string): User => {
    let user = userDB.findByUsername(username);
    if (!user) {
      user = userDB.create(username);
    }
    return user;
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

>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
export default db;
