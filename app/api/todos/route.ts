/**
 * API Routes: /api/todos
 * GET - List all todos for current user
 * POST - Create new todo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDemoSession } from '@/lib/auth';
import { todoDB, userDB } from '@/lib/db';

/**
 * GET /api/todos
 * List all todos for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getDemoSession();
    
    // Ensure demo user exists in database
    userDB.getOrCreate(session.username);
    
    const todos = todoDB.list(session.userId);
    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todos
 * Create new todo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getDemoSession();
    
    // Ensure demo user exists in database
    userDB.getOrCreate(session.username);
    
    const body = await request.json();
    const { title, due_date } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: 'Title must be 500 characters or less' },
        { status: 400 }
      );
    }

    const todo = todoDB.create(session.userId, {
      title: title.trim(),
      due_date: due_date || null,
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
