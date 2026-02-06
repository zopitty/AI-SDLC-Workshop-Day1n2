/**
 * Database Types for Recurring Todos
 * Extended from PRP 03 specification
 */

import { RecurrencePattern } from './timezone';

export type Priority = 'low' | 'medium' | 'high';

/**
 * Todo interface with recurrence support
 * Based on PRP 03 Data Model section
 */
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  recurrence_pattern: RecurrencePattern; // NEW in PRP 03
  created_at: string;
  updated_at: string;
}

/**
 * Subtask interface for checklist functionality
 */
export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

/**
 * Tag interface for organization
 */
export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Database migration for recurrence_pattern column
 * 
 * This should be added to lib/db.ts initialization:
 */
export const RECURRENCE_PATTERN_MIGRATION = `
-- Add recurrence_pattern column to todos table
ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT 
  CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL);

-- Create index for filtering recurring todos
CREATE INDEX idx_todos_recurrence ON todos(recurrence_pattern);
`;

/**
 * Example: Creating next instance from completed recurring todo
 * This logic would be in todoDB.createNextInstance() method
 */
export interface CreateNextInstanceParams {
  userId: number;
  title: string;
  priority: Priority;
  recurrencePattern: RecurrencePattern;
  nextDueDate: string;
  reminderMinutes?: number | null;
  tagIds?: number[];
  subtasks?: Array<{ title: string; position: number }>;
}
