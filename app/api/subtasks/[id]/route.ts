import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';

/**
 * PUT /api/subtasks/[id]
 * Update a subtask
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const subtaskId = parseInt(id);

    if (isNaN(subtaskId)) {
      return NextResponse.json({ error: 'Invalid subtask ID' }, { status: 400 });
    }

    const subtask = subtaskDB.getById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Verify subtask's todo belongs to user
    const todo = todoDB.getById(session.userId, subtask.todo_id);
    if (!todo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, completed } = body;

    const updateData: { title?: string; completed?: boolean } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (title.length > 200) {
        return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
      }
      updateData.completed = completed;
    }

    const success = subtaskDB.update(subtaskId, updateData);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }

    const updatedSubtask = subtaskDB.getById(subtaskId);
    return NextResponse.json({ subtask: updatedSubtask });
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/subtasks/[id]
 * Delete a subtask
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const subtaskId = parseInt(id);

    if (isNaN(subtaskId)) {
      return NextResponse.json({ error: 'Invalid subtask ID' }, { status: 400 });
    }

    const subtask = subtaskDB.getById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Verify subtask's todo belongs to user
    const todo = todoDB.getById(session.userId, subtask.todo_id);
    if (!todo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = subtaskDB.delete(subtaskId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
