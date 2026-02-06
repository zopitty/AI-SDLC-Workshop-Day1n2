/**
 * API Route: /api/tags
 * 
 * Handles listing all tags (GET) and creating new tags (POST)
 * 
 * Location: app/api/tags/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';
import { validateTagData, DuplicateTagError } from '@/lib/db';
import type { CreateTagRequest, CreateTagResponse, ListTagsResponse } from '@/lib/db';

/**
 * GET /api/tags
 * 
 * Returns all tags for the authenticated user
 * 
 * @returns {ListTagsResponse} Array of tags
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // 2. Fetch tags from database (synchronous with better-sqlite3)
    const tags = tagDB.list(session.userId);

    // 3. Return response
    return NextResponse.json({ tags } as ListTagsResponse);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * 
 * Creates a new tag for the authenticated user
 * 
 * @body {CreateTagRequest} { name: string, color: string }
 * @returns {CreateTagResponse} Created tag object
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // 2. Parse request body
    const body: CreateTagRequest = await request.json();
    const { name, color } = body;

    // 3. Validate input
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    // Trim and validate
    const trimmedName = name.trim();
    const upperColor = color.toUpperCase();

    const validation = validateTagData(trimmedName, upperColor);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 4. Create tag in database
    try {
      const tag = tagDB.create(session.userId, trimmedName, upperColor);

      // 5. Return created tag
      return NextResponse.json(
        { tag } as CreateTagResponse,
        { status: 201 }
      );
    } catch (dbError: any) {
      // Handle unique constraint violation
      if (dbError.code === 'SQLITE_CONSTRAINT') {
        return NextResponse.json(
          { error: `Tag "${trimmedName}" already exists` },
          { status: 409 } // Conflict
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

/**
 * Example Usage (Client-side)
 * 
 * // Fetch all tags
 * const response = await fetch('/api/tags');
 * const { tags } = await response.json();
 * 
 * // Create new tag
 * const response = await fetch('/api/tags', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'urgent',
 *     color: '#EF4444'
 *   })
 * });
 * const { tag } = await response.json();
 */

/**
 * Error Responses
 * 
 * 401 Unauthorized:
 * {
 *   "error": "Not authenticated"
 * }
 * 
 * 400 Bad Request (missing fields):
 * {
 *   "error": "Name and color are required"
 * }
 * 
 * 400 Bad Request (validation):
 * {
 *   "error": "Validation failed",
 *   "details": {
 *     "name": "Tag name must be between 1 and 30 characters",
 *     "color": "Color must be a valid hex color (#RRGGBB)"
 *   }
 * }
 * 
 * 409 Conflict (duplicate):
 * {
 *   "error": "Tag \"urgent\" already exists"
 * }
 * 
 * 500 Internal Server Error:
 * {
 *   "error": "Failed to create tag"
 * }
 */

/**
 * Testing with curl
 * 
 * # Get all tags
 * curl -X GET http://localhost:3000/api/tags \
 *   -H "Cookie: session=<your-session-token>"
 * 
 * # Create new tag
 * curl -X POST http://localhost:3000/api/tags \
 *   -H "Cookie: session=<your-session-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"urgent","color":"#EF4444"}'
 */
