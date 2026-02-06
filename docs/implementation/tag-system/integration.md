# Tag System - Integration Guide

## Overview
This guide explains how to integrate the tag system with the existing Todo App features.

## Prerequisites
Before integrating tags, ensure these features are implemented:
- ✅ PRP 01: Todo CRUD Operations
- ✅ PRP 11: WebAuthn Authentication (for user sessions)

## Step-by-Step Integration

### 1. Database Migration

Add the tag tables to your database initialization in `lib/db.ts`:

```typescript
// In lib/db.ts initialization section
db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK(length(name) <= 30),
    color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
`);
```

### 2. Type Definitions

Add the new types to `lib/db.ts`:

```typescript
// Add to lib/db.ts

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TodoTag {
  todo_id: number;
  tag_id: number;
}

// Update existing Todo interface
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string;
  // ... existing fields
  tags?: Tag[];  // Add this field
}

// Add validation constants and utilities
export const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Orange', value: '#F97316' },
] as const;

export const TAG_CONSTRAINTS = {
  MAX_NAME_LENGTH: 30,
  MIN_NAME_LENGTH: 1,
  COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/,
} as const;

export function validateTagData(name: string, color: string) {
  const errors: any = {};

  if (name.length < 1 || name.length > 30) {
    errors.name = 'Tag name must be between 1 and 30 characters';
  }

  if (!TAG_CONSTRAINTS.COLOR_REGEX.test(color)) {
    errors.color = 'Color must be a valid hex color (#RRGGBB)';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function getContrastColor(hexColor: string): '#FFFFFF' | '#000000' {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function isValidHexColor(color: string): boolean {
  return TAG_CONSTRAINTS.COLOR_REGEX.test(color);
}
```

### 3. Database Layer

Add tag database operations to `lib/db.ts`:

```typescript
// Add to lib/db.ts after existing database objects

export const tagDB = {
  list(userId: number): Tag[] {
    const stmt = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC');
    return stmt.all(userId) as Tag[];
  },

  get(tagId: number, userId: number): Tag | undefined {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?');
    return stmt.get(tagId, userId) as Tag | undefined;
  },

  create(userId: number, name: string, color: string): Tag {
    const stmt = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');
    const result = stmt.run(userId, name, color);
    return {
      id: result.lastInsertRowid as number,
      user_id: userId,
      name,
      color,
      created_at: new Date().toISOString()
    };
  },

  update(tagId: number, userId: number, name: string, color: string): void {
    const stmt = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?');
    stmt.run(name, color, tagId, userId);
  },

  delete(tagId: number, userId: number): void {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');
    stmt.run(tagId, userId);
  }
};

export const todoTagDB = {
  assign(todoId: number, tagId: number): void {
    const stmt = db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)');
    stmt.run(todoId, tagId);
  },

  unassign(todoId: number, tagId: number): void {
    const stmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?');
    stmt.run(todoId, tagId);
  },

  getTagsForTodo(todoId: number): Tag[] {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
      ORDER BY t.name ASC
    `);
    return stmt.all(todoId) as Tag[];
  },

  getTodosWithTag(tagId: number, userId: number): number[] {
    const stmt = db.prepare(`
      SELECT tt.todo_id FROM todo_tags tt
      INNER JOIN todos t ON t.id = tt.todo_id
      WHERE tt.tag_id = ? AND t.user_id = ?
    `);
    return (stmt.all(tagId, userId) as Array<{ todo_id: number }>).map(row => row.todo_id);
  },

  copyTags(fromTodoId: number, toTodoId: number): void {
    const stmt = db.prepare(`
      INSERT INTO todo_tags (todo_id, tag_id)
      SELECT ?, tag_id FROM todo_tags WHERE todo_id = ?
    `);
    stmt.run(toTodoId, fromTodoId);
  }
};
```

### 4. Update Todo List Query

Modify the existing `todoDB.list()` method to include tags:

```typescript
// In lib/db.ts, update todoDB object

export const todoDB = {
  // Update existing list method
  list(userId: number, filters?: { tagId?: number; priority?: Priority; completed?: boolean }): Todo[] {
    let query = 'SELECT DISTINCT t.* FROM todos t WHERE t.user_id = ?';
    const params: any[] = [userId];

    // Filter by tag if specified
    if (filters?.tagId) {
      query += ' AND t.id IN (SELECT todo_id FROM todo_tags WHERE tag_id = ?)';
      params.push(filters.tagId);
    }

    // ... existing filters (priority, completed, etc.)

    query += ' ORDER BY t.created_at DESC';

    const stmt = db.prepare(query);
    const todos = stmt.all(...params) as Todo[];

    // Populate tags for each todo
    return todos.map(todo => ({
      ...todo,
      tags: todoTagDB.getTagsForTodo(todo.id)
    }));
  },

  // Add new method for getting single todo with tags
  getWithTags(todoId: number, userId: number): Todo | undefined {
    const todo = this.get(todoId, userId);
    if (todo) {
      todo.tags = todoTagDB.getTagsForTodo(todoId);
    }
    return todo;
  },

  // ... rest of existing methods
};
```

### 5. API Routes

Create the API route files as specified in `docs/implementation/tag-system/api-routes/`:

**File structure:**
```
app/api/
├── tags/
│   ├── route.ts              # GET, POST
│   └── [id]/
│       └── route.ts          # PUT, DELETE
└── todos/
    └── [id]/
        └── tags/
            ├── route.ts      # POST (assign tag)
            └── [tagId]/
                └── route.ts  # DELETE (unassign tag)
```

Copy the content from the template files in `docs/implementation/tag-system/api-routes/`.

### 6. Update Main Todo UI (`app/page.tsx`)

Add tag functionality to the main todo page:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { TagPill } from '@/components/TagPill';
import { TagSelector } from '@/components/TagSelector';
import { TagManager } from '@/components/TagManager';
import type { Todo, Tag } from '@/lib/db';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<number | null>(null);

  // Fetch todos and tags on mount
  useEffect(() => {
    fetchTodos();
    fetchTags();
  }, []);

  const fetchTodos = async () => {
    const url = tagFilter 
      ? `/api/todos?tagId=${tagFilter}` 
      : '/api/todos';
    const response = await fetch(url);
    const { todos } = await response.json();
    setTodos(todos);
  };

  const fetchTags = async () => {
    const response = await fetch('/api/tags');
    const { tags } = await response.json();
    setTags(tags);
  };

  // Re-fetch todos when tag filter changes
  useEffect(() => {
    fetchTodos();
  }, [tagFilter]);

  // Tag CRUD handlers
  const handleCreateTag = async (name: string, color: string) => {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    const { tag } = await response.json();
    setTags(prev => [...prev, tag]);
  };

  const handleUpdateTag = async (tagId: number, name: string, color: string) => {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    const { tag } = await response.json();
    setTags(prev => prev.map(t => t.id === tagId ? tag : t));
    await fetchTodos(); // Refresh to show updated tags
  };

  const handleDeleteTag = async (tagId: number) => {
    await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
    setTags(prev => prev.filter(t => t.id !== tagId));
    if (tagFilter === tagId) {
      setTagFilter(null);
    }
    await fetchTodos(); // Refresh to show removed tags
  };

  // Tag assignment handlers
  const handleAssignTag = async (todoId: number, tagId: number) => {
    const response = await fetch(`/api/todos/${todoId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId })
    });
    const { todo } = await response.json();
    setTodos(prev => prev.map(t => t.id === todoId ? todo : t));
  };

  const handleUnassignTag = async (todoId: number, tagId: number) => {
    await fetch(`/api/todos/${todoId}/tags/${tagId}`, { method: 'DELETE' });
    setTodos(prev => prev.map(t => 
      t.id === todoId 
        ? { ...t, tags: t.tags?.filter(tag => tag.id !== tagId) }
        : t
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Todos</h1>
        <button
          onClick={() => setIsTagManagerOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Manage Tags
        </button>
      </header>

      {/* Tag filter */}
      {tagFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          <TagPill
            tag={tags.find(t => t.id === tagFilter)!}
            onRemove={() => setTagFilter(null)}
            removable
          />
        </div>
      )}

      {/* Todo list */}
      <div className="space-y-4">
        {todos.map(todo => (
          <div key={todo.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium text-lg">{todo.title}</h3>
            <p className="text-gray-600 mt-1">{todo.description}</p>
            
            {/* Tags display */}
            {todo.tags && todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {todo.tags.map(tag => (
                  <TagPill
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    onClick={(tag) => setTagFilter(tag.id)}
                    onRemove={(tag) => handleUnassignTag(todo.id, tag.id)}
                    removable
                  />
                ))}
              </div>
            )}

            {/* Tag selector */}
            <div className="mt-3">
              <TagSelector
                availableTags={tags}
                selectedTags={todo.tags || []}
                onChange={(newTags) => {
                  // Find newly added tag
                  const addedTag = newTags.find(
                    newTag => !todo.tags?.some(t => t.id === newTag.id)
                  );
                  if (addedTag) {
                    handleAssignTag(todo.id, addedTag.id);
                  }
                }}
                onCreateNew={handleCreateTag}
                placeholder="Add tags..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />
    </div>
  );
}
```

### 7. Integration with Recurring Todos (PRP 03)

When creating the next instance of a recurring todo, copy its tags:

```typescript
// In app/api/todos/[id]/route.ts PUT handler (complete recurring todo)

if (todo.recurrence_pattern && todo.recurrence_pattern !== 'none') {
  // ... existing logic to create next instance ...
  
  // Copy tags from completed todo to next instance
  todoTagDB.copyTags(todoId, nextTodo.id);
}
```

### 8. Integration with Templates (PRP 07)

Store tag IDs in template JSON and apply when using template:

```typescript
// When creating a template, store tag IDs
interface Template {
  // ... existing fields
  tag_ids: number[];  // Store as JSON array
}

// When using a template
const handleUseTemplate = async (templateId: number) => {
  const response = await fetch(`/api/templates/${templateId}/use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* due_date offset */ })
  });
  const { todo, template } = await response.json();

  // Assign tags from template
  if (template.tag_ids && template.tag_ids.length > 0) {
    for (const tagId of template.tag_ids) {
      await fetch(`/api/todos/${todo.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId })
      });
    }
  }
};
```

### 9. Integration with Search/Filter (PRP 08)

Add tag filtering to search functionality:

```typescript
// Update search/filter UI
interface TodoFilters {
  searchQuery: string;
  priority: Priority | null;
  completed: boolean | null;
  tagId: number | null;  // Add this
}

// Update API call
const fetchTodos = async (filters: TodoFilters) => {
  const params = new URLSearchParams();
  if (filters.searchQuery) params.append('q', filters.searchQuery);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.completed !== null) params.append('completed', String(filters.completed));
  if (filters.tagId) params.append('tagId', String(filters.tagId));

  const response = await fetch(`/api/todos?${params}`);
  const { todos } = await response.json();
  return todos;
};
```

### 10. Integration with Export/Import (PRP 09)

Export tags by name (not ID) for portability:

```typescript
// In GET /api/todos/export
export async function GET(request: NextRequest) {
  // ... existing logic ...
  
  const exportData = {
    todos: todos.map(todo => ({
      ...todo,
      tag_names: todo.tags?.map(t => t.name) || []  // Export by name
    })),
    tags: tags.map(tag => ({ name: tag.name, color: tag.color }))  // Export all tags
  };

  return NextResponse.json(exportData);
}

// In POST /api/todos/import
export async function POST(request: NextRequest) {
  const { todos: importedTodos, tags: importedTags } = await request.json();

  // Create/match tags first
  const tagMap = new Map<string, number>();
  for (const importedTag of importedTags) {
    let tag = tags.find(t => t.name === importedTag.name);
    if (!tag) {
      tag = tagDB.create(userId, importedTag.name, importedTag.color);
    }
    tagMap.set(importedTag.name, tag.id);
  }

  // Import todos and assign tags
  for (const importedTodo of importedTodos) {
    const todo = todoDB.create(/* ... */);
    
    // Assign tags
    if (importedTodo.tag_names) {
      for (const tagName of importedTodo.tag_names) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          todoTagDB.assign(todo.id, tagId);
        }
      }
    }
  }
}
```

## Testing Integration

### Manual Testing Checklist

- [ ] Create a new tag via Tag Manager
- [ ] Edit tag name and color
- [ ] Delete a tag (verify cascade delete from todos)
- [ ] Assign tag to todo via TagSelector
- [ ] Remove tag from todo via × button on TagPill
- [ ] Filter todos by clicking a tag pill
- [ ] Create a recurring todo with tags, complete it, verify next instance has same tags
- [ ] Create a template with tags, use template, verify todo gets tags
- [ ] Export todos with tags, import to another account

### E2E Testing

See `docs/implementation/tag-system/tests/` for Playwright test specifications.

## Common Issues & Solutions

### Issue: Duplicate tag error not showing in UI
**Solution**: Check error handling in TagManager component, ensure 409 status is caught and displayed.

### Issue: Tags not appearing on todos after assignment
**Solution**: Ensure `todoDB.list()` and `getWithTags()` are calling `todoTagDB.getTagsForTodo()`.

### Issue: Tag filter not working
**Solution**: Verify API route includes `tagId` query parameter in WHERE clause.

### Issue: Deleting tag doesn't remove from todos
**Solution**: Check CASCADE DELETE foreign key constraint is set on `todo_tags` table.

## Performance Optimization

1. **Batch tag assignments**: Use transactions when assigning multiple tags
2. **Cache tags list**: Tags change infrequently, cache client-side for 5 minutes
3. **Lazy load tags**: Only fetch tags when Tag Manager is opened
4. **Debounce search**: Add debounce to TagSelector search input

## Security Considerations

1. **Ownership verification**: Always verify tag and todo belong to authenticated user
2. **Input validation**: Validate tag name length and color format server-side
3. **SQL injection prevention**: Use prepared statements (already done with better-sqlite3)
4. **XSS prevention**: Tag colors are validated hex codes, names are user content but rendered as text

## Next Steps

After integration is complete:
1. Write E2E tests (see `tests/` directory)
2. Update USER_GUIDE.md with tag feature documentation
3. Consider analytics: track most-used tags, tag usage statistics
4. Consider advanced features: tag categories, tag suggestions

---

**Integration Status**: Ready for implementation  
**Last Updated**: 2026-02-06  
**Prerequisites**: PRP 01 (Todo CRUD), PRP 11 (Auth)
