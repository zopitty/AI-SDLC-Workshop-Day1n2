/**
 * API Route: /api/todos/[id]/tags
 * 
 * Handles assigning (POST) and unassigning (DELETE) tags to/from todos
 * 
 * Location: app/api/todos/[id]/tags/route.ts (for POST)
 * Location: app/api/todos/[id]/tags/[tagId]/route.ts (for DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, tagDB, todoTagDB } from '@/lib/db';
import type { AssignTagRequest, AssignTagResponse } from '@/lib/db';

// ============================================================================
// POST /api/todos/[id]/tags - Assign tag to todo
// ============================================================================

/**
 * POST /api/todos/[id]/tags
 * 
 * Assigns a tag to a todo
 * 
 * @param {number} id - Todo ID from URL params
 * @body {AssignTagRequest} { tag_id: number }
 * @returns {AssignTagResponse} Todo with updated tags array
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // 2. Get todo ID from params
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return NextResponse.json(
        { error: 'Invalid todo ID' },
        { status: 400 }
      );
    }

    // 3. Verify todo exists and belongs to user
    const todo = todoDB.get(todoId, session.userId);
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // 4. Parse request body
    const body: AssignTagRequest = await request.json();
    const { tag_id } = body;

    if (!tag_id || isNaN(tag_id)) {
      return NextResponse.json(
        { error: 'Valid tag_id is required' },
        { status: 400 }
      );
    }

    // 5. Verify tag exists and belongs to user
    const tag = tagDB.get(tag_id, session.userId);
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 6. Assign tag to todo (INSERT OR IGNORE prevents duplicates)
    todoTagDB.assign(todoId, tag_id);

    // 7. Fetch and return updated todo with tags
    const updatedTodo = todoDB.getWithTags(todoId, session.userId);
    
    return NextResponse.json({ todo: updatedTodo } as AssignTagResponse);
  } catch (error) {
    console.error('Error assigning tag:', error);
    return NextResponse.json(
      { error: 'Failed to assign tag' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/todos/[id]/tags/[tagId] - Unassign tag from todo
// File: app/api/todos/[id]/tags/[tagId]/route.ts
// ============================================================================

/**
 * DELETE /api/todos/[id]/tags/[tagId]
 * 
 * Removes a tag from a todo
 * 
 * @param {number} id - Todo ID from URL params
 * @param {number} tagId - Tag ID from URL params
 * @returns {void} 204 No Content on success
 */
export async function DELETE_TAG(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // 2. Get IDs from params
    const { id, tagId } = await params;
    const todoId = parseInt(id, 10);
    const tagIdNum = parseInt(tagId, 10);

    if (isNaN(todoId) || isNaN(tagIdNum)) {
      return NextResponse.json(
        { error: 'Invalid todo or tag ID' },
        { status: 400 }
      );
    }

    // 3. Verify todo exists and belongs to user
    const todo = todoDB.get(todoId, session.userId);
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // 4. Verify tag exists and belongs to user
    const tag = tagDB.get(tagIdNum, session.userId);
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 5. Unassign tag from todo
    todoTagDB.unassign(todoId, tagIdNum);

    // 6. Return success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unassigning tag:', error);
    return NextResponse.json(
      { error: 'Failed to unassign tag' },
      { status: 500 }
    );
  }
}

/**
 * Example Usage (Client-side)
 * 
 * // Assign tag to todo
 * const response = await fetch('/api/todos/123/tags', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ tag_id: 5 })
 * });
 * const { todo } = await response.json();
 * // todo.tags now includes the newly assigned tag
 * 
 * // Unassign tag from todo
 * const response = await fetch('/api/todos/123/tags/5', {
 *   method: 'DELETE'
 * });
 * // Response is 204 No Content
 */

/**
 * React Hook Example
 * 
 * function useTodoTags(todoId: number) {
 *   const [todo, setTodo] = useState<Todo | null>(null);
 * 
 *   const assignTag = async (tagId: number) => {
 *     const response = await fetch(`/api/todos/${todoId}/tags`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ tag_id: tagId })
 *     });
 *     const { todo: updatedTodo } = await response.json();
 *     setTodo(updatedTodo);
 *   };
 * 
 *   const unassignTag = async (tagId: number) => {
 *     await fetch(`/api/todos/${todoId}/tags/${tagId}`, {
 *       method: 'DELETE'
 *     });
 *     // Optimistically remove tag from local state
 *     setTodo(prev => prev ? {
 *       ...prev,
 *       tags: prev.tags?.filter(t => t.id !== tagId)
 *     } : null);
 *   };
 * 
 *   return { todo, assignTag, unassignTag };
 * }
 */

/**
 * Optimistic UI Update Pattern
 * 
 * const handleAssignTag = async (tagId: number) => {
 *   // Find tag object
 *   const tag = tags.find(t => t.id === tagId);
 *   if (!tag) return;
 * 
 *   // Optimistically update UI
 *   setTodo(prev => ({
 *     ...prev,
 *     tags: [...(prev.tags || []), tag]
 *   }));
 * 
 *   try {
 *     // Make API call
 *     const response = await fetch(`/api/todos/${todo.id}/tags`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ tag_id: tagId })
 *     });
 * 
 *     if (!response.ok) throw new Error('Failed to assign tag');
 * 
 *     // Server confirmed - update with server response
 *     const { todo: updatedTodo } = await response.json();
 *     setTodo(updatedTodo);
 *   } catch (error) {
 *     // Revert optimistic update on error
 *     setTodo(prev => ({
 *       ...prev,
 *       tags: prev.tags?.filter(t => t.id !== tagId)
 *     }));
 *     alert('Failed to assign tag');
 *   }
 * };
 */

/**
 * Error Responses
 * 
 * 401 Unauthorized:
 * {
 *   "error": "Not authenticated"
 * }
 * 
 * 400 Bad Request:
 * {
 *   "error": "Valid tag_id is required"
 * }
 * 
 * 404 Not Found (todo):
 * {
 *   "error": "Todo not found"
 * }
 * 
 * 404 Not Found (tag):
 * {
 *   "error": "Tag not found"
 * }
 * 
 * 500 Internal Server Error:
 * {
 *   "error": "Failed to assign tag"
 * }
 */

/**
 * Testing with curl
 * 
 * # Assign tag to todo
 * curl -X POST http://localhost:3000/api/todos/123/tags \
 *   -H "Cookie: session=<your-session-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"tag_id":5}'
 * 
 * # Unassign tag from todo
 * curl -X DELETE http://localhost:3000/api/todos/123/tags/5 \
 *   -H "Cookie: session=<your-session-token>"
 */

/**
 * Important Notes
 * 
 * 1. INSERT OR IGNORE:
 *    Using INSERT OR IGNORE prevents errors when assigning an already-assigned tag.
 *    This makes the operation idempotent.
 * 
 * 2. Authorization:
 *    Both todo and tag must belong to the authenticated user.
 *    This prevents users from assigning tags they don't own.
 * 
 * 3. Return Full Todo:
 *    POST returns the full todo object with updated tags array,
 *    allowing client to update state with a single response.
 * 
 * 4. Optimistic Updates:
 *    Recommended pattern for better UX - update UI immediately,
 *    then sync with server response or revert on error.
 */

/**
 * File Structure for DELETE
 * 
 * Since DELETE needs both todo ID and tag ID in URL,
 * create a separate route file:
 * 
 * app/api/todos/[id]/tags/[tagId]/route.ts
 * 
 * Export the DELETE_TAG function as DELETE in that file.
 */
