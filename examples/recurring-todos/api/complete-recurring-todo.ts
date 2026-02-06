/**
 * API Route Logic: Complete Recurring Todo
 * Demonstrates the completion flow with next instance creation
 * Based on PRP 03 API Specification section
 */

import { Todo, Subtask, Tag } from '../lib/db-types';
import { calculateNextDueDate, RecurrencePattern } from '../lib/timezone';

/**
 * Response type when completing a recurring todo
 */
interface CompleteRecurringTodoResponse {
  completed_todo: Todo;
  next_todo?: Todo; // Only present if recurring
}

/**
 * Mock database functions (in real app, these would be in lib/db.ts)
 */
interface TodoDB {
  get(id: number, userId: number): Todo | null;
  update(id: number, updates: Partial<Todo>): Todo;
  create(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Todo;
  getTags(todoId: number): Tag[];
  getSubtasks(todoId: number): Subtask[];
  addTags(todoId: number, tagIds: number[]): void;
  createSubtasks(todoId: number, subtasks: Array<{ title: string; position: number }>): void;
}

/**
 * Complete a todo and create next instance if recurring
 * 
 * This logic would be in: app/api/todos/[id]/route.ts (PUT handler)
 * 
 * Flow:
 * 1. Mark current todo as completed
 * 2. If recurring:
 *    a. Calculate next due date
 *    b. Create new todo with same metadata
 *    c. Copy tags and subtasks
 * 3. Return both completed todo and next instance (if applicable)
 */
export async function completeRecurringTodo(
  todoId: number,
  userId: number,
  db: TodoDB
): Promise<CompleteRecurringTodoResponse> {
  // 1. Get the todo
  const todo = db.get(todoId, userId);
  if (!todo) {
    throw new Error('Todo not found');
  }

  // 2. Mark as completed
  const completedTodo = db.update(todoId, {
    completed: true,
    updated_at: new Date().toISOString(),
  });

  // 3. Check if recurring
  if (!todo.recurrence_pattern || !todo.due_date) {
    // Not recurring or no due date - just complete it
    return { completed_todo: completedTodo };
  }

  // 4. Calculate next due date
  const nextDueDate = calculateNextDueDate(
    todo.due_date,
    todo.recurrence_pattern
  );

  // 5. Get metadata to copy
  const tags = db.getTags(todoId);
  const subtasks = db.getSubtasks(todoId);

  // 6. Create next instance
  const nextTodo = db.create({
    user_id: userId,
    title: todo.title,
    completed: false,
    due_date: nextDueDate,
    priority: todo.priority,
    recurrence_pattern: todo.recurrence_pattern,
  });

  // 7. Copy tags (if any)
  if (tags.length > 0) {
    const tagIds = tags.map(tag => tag.id);
    db.addTags(nextTodo.id, tagIds);
  }

  // 8. Copy subtasks (unchecked, if any)
  if (subtasks.length > 0) {
    const subtaskData = subtasks.map(st => ({
      title: st.title,
      position: st.position,
    }));
    db.createSubtasks(nextTodo.id, subtaskData);
  }

  // 9. Return both todos
  return {
    completed_todo: completedTodo,
    next_todo: nextTodo,
  };
}

/**
 * Example API route handler (Next.js 16)
 * File: app/api/todos/[id]/route.ts
 */
export const EXAMPLE_API_ROUTE = `
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { calculateNextDueDate } from '@/lib/timezone';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse params (async in Next.js 16)
  const { id } = await params;
  const todoId = parseInt(id);

  // Parse body
  const body = await request.json();

  // Handle completion
  if (body.completed === true) {
    const todo = todoDB.get(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Mark completed
    const completedTodo = todoDB.update(todoId, {
      completed: true,
      updated_at: new Date().toISOString(),
    });

    // Check if recurring
    if (todo.recurrence_pattern && todo.due_date) {
      // Calculate next due date
      const nextDueDate = calculateNextDueDate(
        todo.due_date,
        todo.recurrence_pattern
      );

      // Create next instance with metadata inheritance
      const nextTodo = todoDB.createNextInstance(session.userId, {
        title: todo.title,
        priority: todo.priority,
        recurrencePattern: todo.recurrence_pattern,
        nextDueDate,
        reminderMinutes: todo.reminder_minutes,
        // Tags and subtasks copied internally
      });

      return NextResponse.json({
        completed_todo: completedTodo,
        next_todo: nextTodo,
      });
    }

    return NextResponse.json({ completed_todo: completedTodo });
  }

  // Handle other updates...
}
`;
