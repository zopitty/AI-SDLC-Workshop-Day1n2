# Tag System - Database Schema

## Overview
Implements a many-to-many relationship between todos and tags using a junction table pattern.

## Schema Definitions

### 1. Tags Table

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(name) <= 30),
  color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)  -- Tag names unique per user
);
```

**Constraints:**
- `name`: Maximum 30 characters
- `color`: Must be valid hex color (#RRGGBB format)
- `UNIQUE(user_id, name)`: Each user cannot have duplicate tag names

### 2. Todo-Tags Junction Table

```sql
CREATE TABLE todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**Composite Primary Key:**
- `(todo_id, tag_id)`: Prevents duplicate assignments

**Cascade Behavior:**
- Deleting a todo removes all its tag assignments
- Deleting a tag removes all its todo assignments

### 3. Indexes

```sql
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX idx_todo_tags_tag_id ON todo_tags(tag_id);
```

**Performance:**
- `idx_tags_user_id`: Fast lookup of user's tags
- `idx_todo_tags_todo_id`: Fast lookup of todo's tags (for display)
- `idx_todo_tags_tag_id`: Fast lookup of todos with specific tag (for filtering)

## Migration Script (better-sqlite3)

```typescript
// In lib/db.ts - Add to existing migration logic

const db = new Database('todos.db');

// Create tags table
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
`);

// Create junction table
db.exec(`
  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
`);
```

## Database Operations (lib/db.ts)

### Tag CRUD Operations

```typescript
export const tagDB = {
  // Get all tags for a user
  list(userId: number): Tag[] {
    const stmt = db.prepare(`
      SELECT id, user_id, name, color, created_at
      FROM tags
      WHERE user_id = ?
      ORDER BY name ASC
    `);
    return stmt.all(userId) as Tag[];
  },

  // Get single tag
  get(tagId: number, userId: number): Tag | undefined {
    const stmt = db.prepare(`
      SELECT id, user_id, name, color, created_at
      FROM tags
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(tagId, userId) as Tag | undefined;
  },

  // Create new tag
  create(userId: number, name: string, color: string): Tag {
    const stmt = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(userId, name, color);
    
    return {
      id: result.lastInsertRowid as number,
      user_id: userId,
      name,
      color,
      created_at: new Date().toISOString()
    };
  },

  // Update tag
  update(tagId: number, userId: number, name: string, color: string): void {
    const stmt = db.prepare(`
      UPDATE tags
      SET name = ?, color = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(name, color, tagId, userId);
  },

  // Delete tag (cascades to todo_tags)
  delete(tagId: number, userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM tags
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(tagId, userId);
  }
};
```

### Todo-Tag Junction Operations

```typescript
export const todoTagDB = {
  // Assign tag to todo
  assign(todoId: number, tagId: number): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO todo_tags (todo_id, tag_id)
      VALUES (?, ?)
    `);
    stmt.run(todoId, tagId);
  },

  // Unassign tag from todo
  unassign(todoId: number, tagId: number): void {
    const stmt = db.prepare(`
      DELETE FROM todo_tags
      WHERE todo_id = ? AND tag_id = ?
    `);
    stmt.run(todoId, tagId);
  },

  // Get all tags for a todo
  getTagsForTodo(todoId: number): Tag[] {
    const stmt = db.prepare(`
      SELECT t.id, t.user_id, t.name, t.color, t.created_at
      FROM tags t
      INNER JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
      ORDER BY t.name ASC
    `);
    return stmt.all(todoId) as Tag[];
  },

  // Get all todos with a specific tag
  getTodosWithTag(tagId: number, userId: number): number[] {
    const stmt = db.prepare(`
      SELECT tt.todo_id
      FROM todo_tags tt
      INNER JOIN todos t ON t.id = tt.todo_id
      WHERE tt.tag_id = ? AND t.user_id = ?
    `);
    return (stmt.all(tagId, userId) as Array<{ todo_id: number }>)
      .map(row => row.todo_id);
  },

  // Copy tags from one todo to another (for recurring todos)
  copyTags(fromTodoId: number, toTodoId: number): void {
    const stmt = db.prepare(`
      INSERT INTO todo_tags (todo_id, tag_id)
      SELECT ?, tag_id
      FROM todo_tags
      WHERE todo_id = ?
    `);
    stmt.run(toTodoId, fromTodoId);
  }
};
```

### Updated Todo List Query (with tags)

```typescript
export const todoDB = {
  // Updated list method to include tags
  list(userId: number, filters?: { tagId?: number }): Todo[] {
    let query = `
      SELECT DISTINCT t.*
      FROM todos t
      WHERE t.user_id = ?
    `;
    const params: any[] = [userId];

    // Filter by tag if specified
    if (filters?.tagId) {
      query += `
        AND t.id IN (
          SELECT todo_id FROM todo_tags WHERE tag_id = ?
        )
      `;
      params.push(filters.tagId);
    }

    query += ` ORDER BY t.created_at DESC`;

    const stmt = db.prepare(query);
    const todos = stmt.all(...params) as Todo[];

    // Populate tags for each todo
    return todos.map(todo => ({
      ...todo,
      tags: todoTagDB.getTagsForTodo(todo.id)
    }));
  },

  // Get single todo with tags
  getWithTags(todoId: number, userId: number): Todo | undefined {
    const stmt = db.prepare(`
      SELECT * FROM todos WHERE id = ? AND user_id = ?
    `);
    const todo = stmt.get(todoId, userId) as Todo | undefined;
    
    if (todo) {
      todo.tags = todoTagDB.getTagsForTodo(todoId);
    }
    
    return todo;
  }
};
```

## Example Data

```sql
-- Sample tags for user 1
INSERT INTO tags (user_id, name, color) VALUES
  (1, 'work', '#3B82F6'),
  (1, 'personal', '#10B981'),
  (1, 'urgent', '#EF4444'),
  (1, 'shopping', '#F59E0B');

-- Sample tag assignments
INSERT INTO todo_tags (todo_id, tag_id) VALUES
  (1, 1),  -- Todo 1 has 'work' tag
  (1, 3),  -- Todo 1 also has 'urgent' tag
  (2, 2),  -- Todo 2 has 'personal' tag
  (3, 4);  -- Todo 3 has 'shopping' tag
```

## Query Examples

```sql
-- Get all tags for a user
SELECT * FROM tags WHERE user_id = 1 ORDER BY name;

-- Get all tags for a specific todo
SELECT t.*
FROM tags t
INNER JOIN todo_tags tt ON t.id = tt.tag_id
WHERE tt.todo_id = 1;

-- Get all todos with 'urgent' tag
SELECT todo.*
FROM todos todo
INNER JOIN todo_tags tt ON todo.id = tt.todo_id
INNER JOIN tags t ON tt.tag_id = t.id
WHERE t.name = 'urgent' AND todo.user_id = 1;

-- Count todos per tag
SELECT t.name, t.color, COUNT(tt.todo_id) as todo_count
FROM tags t
LEFT JOIN todo_tags tt ON t.id = tt.tag_id
WHERE t.user_id = 1
GROUP BY t.id
ORDER BY todo_count DESC;
```

## Error Handling

### Unique Constraint Violation
```typescript
try {
  tagDB.create(userId, 'work', '#3B82F6');
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    throw new Error('Tag name already exists');
  }
  throw error;
}
```

### Color Validation
```typescript
const colorRegex = /^#[0-9A-Fa-f]{6}$/;
if (!colorRegex.test(color)) {
  throw new Error('Invalid color format. Use #RRGGBB');
}
```

### Tag Name Length
```typescript
if (name.length > 30) {
  throw new Error('Tag name must be 30 characters or less');
}
```

## Performance Considerations

1. **Indexes**: All foreign keys are indexed for fast JOINs
2. **Prepared Statements**: All queries use prepared statements for performance and security
3. **Batch Operations**: Use transactions for bulk tag assignments:

```typescript
const assignMultipleTags = db.transaction((todoId: number, tagIds: number[]) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)');
  for (const tagId of tagIds) {
    stmt.run(todoId, tagId);
  }
});

// Usage
assignMultipleTags(todoId, [1, 2, 3]);
```

## Testing Queries

```sql
-- Verify cascade delete (tag)
DELETE FROM tags WHERE id = 1;
-- Should also delete from todo_tags

-- Verify cascade delete (todo)
DELETE FROM todos WHERE id = 1;
-- Should also delete from todo_tags

-- Test unique constraint
INSERT INTO tags (user_id, name, color) VALUES (1, 'work', '#000000');
-- Should fail if 'work' tag already exists for user 1
```
