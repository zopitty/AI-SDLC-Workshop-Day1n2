/**
 * GET /api/todos - List all todos for current user
 * POST /api/todos - Create a new todo
 */

import { NextRequest, NextResponse } from 'next/server';
import { todoDB, userDB, Priority } from '@/lib/db';
import { getDemoSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getDemoSession();
    
    // Ensure demo user exists in database
    userDB.getOrCreate(session.username);

    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') as Priority | null;

    let todos;
    if (priority && ['high', 'medium', 'low'].includes(priority)) {
      todos = todoDB.listByPriority(session.userId, priority);
    } else {
      todos = todoDB.list(session.userId);
    }

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('GET /api/todos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDemoSession();
    
    // Ensure demo user exists in database
    userDB.getOrCreate(session.username);

    const body = await request.json();
    const { title, due_date, priority } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or less' }, { status: 400 });
    }

    if (priority && !['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority. Must be high, medium, or low.' }, { status: 400 });
    }

    const todo = todoDB.create(session.userId, {
      title,
      due_date: due_date || null,
      priority: priority || 'medium',
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
