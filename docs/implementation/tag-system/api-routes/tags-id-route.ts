/**
 * API Route: /api/tags/[id]
 * 
 * Handles updating (PUT) and deleting (DELETE) individual tags
 * 
 * Location: app/api/tags/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';
import { validateTagData } from '@/lib/db';
import type { UpdateTagRequest, UpdateTagResponse } from '@/lib/db';

/**
 * PUT /api/tags/[id]
 * 
 * Updates an existing tag
 * 
 * @param {number} id - Tag ID from URL params
 * @body {UpdateTagRequest} { name?: string, color?: string }
 * @returns {UpdateTagResponse} Updated tag object
 */
export async function PUT(
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
    // 2. Get tag ID from params (Next.js 16: params is Promise)
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    // 3. Verify tag exists and belongs to user
    const existingTag = tagDB.get(tagId, session.userId);
    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 4. Parse request body
    const body: UpdateTagRequest = await request.json();
    const { name, color } = body;

    // Use existing values if not provided
    const updatedName = name?.trim() ?? existingTag.name;
    const updatedColor = color?.toUpperCase() ?? existingTag.color;

    // 5. Validate input
    const validation = validateTagData(updatedName, updatedColor);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 6. Update tag in database
    try {
      tagDB.update(tagId, session.userId, updatedName, updatedColor);

      // 7. Fetch and return updated tag
      const updatedTag = tagDB.get(tagId, session.userId);
      return NextResponse.json({ tag: updatedTag } as UpdateTagResponse);
    } catch (dbError: any) {
      // Handle unique constraint violation
      if (dbError.code === 'SQLITE_CONSTRAINT') {
        return NextResponse.json(
          { error: `Tag "${updatedName}" already exists` },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tags/[id]
 * 
 * Deletes a tag and all its assignments (CASCADE)
 * 
 * @param {number} id - Tag ID from URL params
 * @returns {void} 204 No Content on success
 */
export async function DELETE(
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
    // 2. Get tag ID from params
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    // 3. Verify tag exists and belongs to user
    const existingTag = tagDB.get(tagId, session.userId);
    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 4. Delete tag (CASCADE deletes todo_tags entries)
    tagDB.delete(tagId, session.userId);

    // 5. Return success (204 No Content)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}

/**
 * Example Usage (Client-side)
 * 
 * // Update tag
 * const response = await fetch('/api/tags/5', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Work Tasks',
 *     color: '#1E40AF'
 *   })
 * });
 * const { tag } = await response.json();
 * 
 * // Delete tag
 * const response = await fetch('/api/tags/5', {
 *   method: 'DELETE'
 * });
 * // Response is 204 No Content
 */

/**
 * Error Responses
 * 
 * 401 Unauthorized:
 * {
 *   "error": "Not authenticated"
 * }
 * 
 * 400 Bad Request (invalid ID):
 * {
 *   "error": "Invalid tag ID"
 * }
 * 
 * 404 Not Found:
 * {
 *   "error": "Tag not found"
 * }
 * 
 * 400 Bad Request (validation):
 * {
 *   "error": "Validation failed",
 *   "details": {
 *     "name": "Tag name must be between 1 and 30 characters"
 *   }
 * }
 * 
 * 409 Conflict (duplicate name):
 * {
 *   "error": "Tag \"urgent\" already exists"
 * }
 * 
 * 500 Internal Server Error:
 * {
 *   "error": "Failed to update tag"
 * }
 */

/**
 * Testing with curl
 * 
 * # Update tag
 * curl -X PUT http://localhost:3000/api/tags/5 \
 *   -H "Cookie: session=<your-session-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Work Tasks","color":"#1E40AF"}'
 * 
 * # Update only color
 * curl -X PUT http://localhost:3000/api/tags/5 \
 *   -H "Cookie: session=<your-session-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"color":"#10B981"}'
 * 
 * # Delete tag
 * curl -X DELETE http://localhost:3000/api/tags/5 \
 *   -H "Cookie: session=<your-session-token>"
 */

/**
 * Important Notes
 * 
 * 1. CASCADE DELETE:
 *    When a tag is deleted, all entries in todo_tags referencing it
 *    are automatically deleted via FOREIGN KEY CASCADE constraint.
 * 
 * 2. Ownership Verification:
 *    Always verify tag belongs to authenticated user before allowing
 *    update/delete operations.
 * 
 * 3. Partial Updates:
 *    PUT allows updating only name or only color. Omitted fields
 *    retain their existing values.
 * 
 * 4. Optimistic UI Updates:
 *    Client should optimistically update UI before API call completes,
 *    then revert on error for better UX.
 */
