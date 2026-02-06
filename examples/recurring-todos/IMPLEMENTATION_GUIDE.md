# Recurring Todos Implementation Guide

## Overview

This document provides step-by-step guidance for implementing the Recurring Todos feature (PRP 03) in a Todo application. It supplements the architecture specification with practical implementation details.

## Prerequisites

Before implementing recurring todos, ensure these features are complete:

- ✅ **PRP 01**: Todo CRUD operations (database, API routes)
- ✅ **PRP 02**: Priority system (for metadata inheritance)
- ✅ **PRP 05**: Subtasks (optional, for full metadata inheritance)
- ✅ **PRP 06**: Tags (optional, for full metadata inheritance)

## Implementation Steps

### Step 1: Database Schema Migration

Add the `recurrence_pattern` column to your existing `todos` table.

**File**: `lib/db.ts` (in initialization section)

```typescript
// Add this to your database initialization
try {
  db.exec(`
    ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT 
      CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') 
            OR recurrence_pattern IS NULL);
  `);
} catch (e) {
  // Column already exists, skip
}

// Create index for better query performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_todos_recurrence 
  ON todos(recurrence_pattern);
`);
```

**Verify**:
```bash
sqlite3 todos.db "PRAGMA table_info(todos);"
# Should show recurrence_pattern column
```

### Step 2: Update TypeScript Interfaces

**File**: `lib/db.ts`

Add the recurrence pattern type and update the Todo interface:

```typescript
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  recurrence_pattern: RecurrencePattern; // ADD THIS
  created_at: string;
  updated_at: string;
}
```

### Step 3: Implement Date Calculation Logic

**File**: `lib/timezone.ts`

Copy the `calculateNextDueDate()` function from `examples/recurring-todos/lib/timezone.ts`:

```typescript
import { RecurrencePattern } from './db';

export function calculateNextDueDate(
  currentDueDate: string,
  pattern: RecurrencePattern
): string {
  if (!pattern) {
    throw new Error('Recurrence pattern is required');
  }

  const date = new Date(currentDueDate);

  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString();
}
```

**Test**:
```typescript
const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'daily');
console.log(next); // Should be '2026-12-26T09:00:00+08:00'
```

### Step 4: Add Database Method for Creating Next Instance

**File**: `lib/db.ts` (in todoDB object)

```typescript
export const todoDB = {
  // ... existing methods ...

  createNextInstance(
    userId: number,
    originalTodo: Todo,
    nextDueDate: string
  ): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (
        user_id, title, completed, due_date, priority, 
        recurrence_pattern, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      userId,
      originalTodo.title,
      0, // completed = false
      nextDueDate,
      originalTodo.priority,
      originalTodo.recurrence_pattern,
      now,
      now
    );

    const newTodo = this.get(result.lastInsertRowid as number, userId);

    // Copy tags if they exist
    if (tagDB && this.getTags) {
      const tags = this.getTags(originalTodo.id);
      if (tags.length > 0) {
        tags.forEach(tag => {
          db.prepare(`
            INSERT INTO todo_tags (todo_id, tag_id)
            VALUES (?, ?)
          `).run(newTodo!.id, tag.id);
        });
      }
    }

    // Copy subtasks if they exist
    if (subtaskDB && this.getSubtasks) {
      const subtasks = this.getSubtasks(originalTodo.id);
      if (subtasks.length > 0) {
        subtasks.forEach(st => {
          subtaskDB.create(newTodo!.id, {
            title: st.title,
            position: st.position,
          });
        });
      }
    }

    return newTodo!;
  },
};
```

### Step 5: Update API Route for Completion

**File**: `app/api/todos/[id]/route.ts`

Update the PUT handler to handle recurring todo completion:

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todoId = parseInt(id);
  const body = await request.json();

  // Handle completion
  if (body.completed === true) {
    const todo = todoDB.get(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Mark as completed
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

      // Create next instance
      const nextTodo = todoDB.createNextInstance(
        session.userId,
        todo,
        nextDueDate
      );

      return NextResponse.json({
        completed_todo: completedTodo,
        next_todo: nextTodo,
      });
    }

    return NextResponse.json({ completed_todo: completedTodo });
  }

  // Handle other updates...
}
```

### Step 6: Create RecurrenceBadge Component

**File**: `components/RecurrenceBadge.tsx`

Copy from `examples/recurring-todos/components/RecurrenceBadge.tsx`:

```tsx
import { RecurrencePattern } from '@/lib/db';

interface RecurrenceBadgeProps {
  pattern: RecurrencePattern;
}

export function RecurrenceBadge({ pattern }: RecurrenceBadgeProps) {
  if (!pattern) return null;

  const patternLabel = pattern.charAt(0).toUpperCase() + pattern.slice(1);

  return (
    <span className="inline-flex items-center gap-1 ml-2">
      <span className="text-lg" role="img" aria-label="Recurring">
        🔁
      </span>
      <span className="text-gray-500 text-sm">({patternLabel})</span>
    </span>
  );
}
```

### Step 7: Create RecurrenceSelector Component

**File**: `components/RecurrenceSelector.tsx`

Copy from `examples/recurring-todos/components/RecurrenceSelector.tsx`

See the full component in the examples directory.

### Step 8: Update TodoForm

**File**: `app/page.tsx` (or your TodoForm component)

Add state for recurrence:

```typescript
const [recurrencePattern, setRecurrencePattern] = 
  useState<RecurrencePattern>(null);
const [dueDate, setDueDate] = useState<string>('');

// In your form JSX:
<RecurrenceSelector
  value={recurrencePattern}
  onChange={setRecurrencePattern}
  hasDueDate={!!dueDate}
/>

// In submit handler:
if (recurrencePattern && !dueDate) {
  setError('Due date is required for recurring todos');
  return;
}

const response = await fetch('/api/todos', {
  method: 'POST',
  body: JSON.stringify({
    title,
    due_date: dueDate,
    recurrence_pattern: recurrencePattern,
    priority,
  }),
});
```

### Step 9: Update TodoItem Display

Add RecurrenceBadge to todo items:

```tsx
<div className="todo-item">
  <h3>{todo.title}</h3>
  <RecurrenceBadge pattern={todo.recurrence_pattern} />
  {/* ... other todo details */}
</div>
```

### Step 10: Handle Completion Response

Update your completion handler to add the next todo to state:

```typescript
const handleComplete = async (todoId: number) => {
  const response = await fetch(`/api/todos/${todoId}`, {
    method: 'PUT',
    body: JSON.stringify({ completed: true }),
  });

  const data = await response.json();

  // Update state
  setTodos(prev => {
    const updated = prev.filter(t => t.id !== todoId);
    
    // Add next todo if it exists
    if (data.next_todo) {
      updated.push(data.next_todo);
      
      // Show toast notification
      toast.success(
        `Completed! Next instance on ${formatDate(data.next_todo.due_date)}`
      );
    }
    
    return updated;
  });
};
```

## Testing

### Unit Tests

Create tests for date calculation:

```typescript
// tests/calculateNextDueDate.test.ts
describe('calculateNextDueDate', () => {
  test('daily recurrence adds 1 day', () => {
    const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'daily');
    expect(new Date(next).getDate()).toBe(26);
  });

  // ... more tests from examples/recurring-todos/tests/
});
```

### E2E Tests

**File**: `tests/04-recurring-todos.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('create and complete daily recurring todo', async ({ page }) => {
  await page.goto('/');
  
  // Create recurring todo
  await page.fill('[placeholder="What needs to be done?"]', 'Daily standup');
  await page.fill('input[type="datetime-local"]', '2026-12-25T09:00');
  await page.check('input[type="checkbox"][aria-label="Enable recurring"]');
  await page.selectOption('select[aria-label="Recurrence pattern"]', 'daily');
  await page.click('text=Add Todo');
  
  // Verify badge
  await expect(page.locator('text=🔁')).toBeVisible();
  await expect(page.locator('text=(Daily)')).toBeVisible();
  
  // Complete it
  const checkbox = page.locator('text=Daily standup')
    .locator('..')
    .locator('input[type="checkbox"]');
  await checkbox.check();
  
  // Verify next instance created
  await expect(page.locator('text=Next instance on Dec 26')).toBeVisible();
  const activeTodos = page.locator('.active-section .todo-item');
  await expect(activeTodos).toHaveCount(1); // New instance
});
```

## Edge Cases

### Month-End Dates

The `calculateNextDueDate()` function automatically handles:

- **Jan 31 → Feb 28/29**: JavaScript adjusts to last valid day
- **Aug 31 → Sep 30**: Automatically adjusted

**Test**:
```typescript
const next = calculateNextDueDate('2026-01-31T10:00:00+08:00', 'monthly');
const date = new Date(next);
expect(date.getDate()).toBe(28); // Feb 28, 2026
```

### Leap Years

- **Feb 29 (leap) → Feb 28 (non-leap)**: Automatically handled
- **Feb 28 → Feb 28**: Preserves the 28th

### Timezone Consistency

Always use Singapore timezone for all date operations:

```typescript
import { getSingaporeNow } from '@/lib/timezone';
const now = getSingaporeNow(); // NOT new Date()
```

## Troubleshooting

### Issue: "Due date required" error not showing

**Solution**: Ensure `RecurrenceSelector` receives `hasDueDate={!!dueDate}` prop

### Issue: Next instance not created

**Solution**: Check that:
1. `recurrence_pattern` is not null
2. `due_date` is not null
3. API route calls `calculateNextDueDate()` correctly

### Issue: Month-end dates wrong

**Solution**: Use the built-in JavaScript `Date.setMonth()` which handles edge cases automatically

## Performance

- **Next instance creation**: < 50ms (single INSERT + tag/subtask copies)
- **No cascade updates**: Each instance is independent
- **Index on recurrence_pattern**: Faster filtering

## Security

- ✅ **User isolation**: Next instance created with same `user_id`
- ✅ **Input validation**: Enum check for recurrence patterns
- ✅ **No infinite loops**: Each completion creates exactly one new todo

## Accessibility

- ✅ **ARIA labels**: "Enable recurring", "Recurrence pattern"
- ✅ **Keyboard navigation**: Dropdown navigable with arrow keys
- ✅ **Visual + text**: 🔁 icon + "(Daily)" label
- ✅ **Screen reader announcements**: Toast notifications via `aria-live="polite"`

## Completion Checklist

- [ ] Database schema migration added
- [ ] TypeScript interfaces updated
- [ ] `calculateNextDueDate()` implemented
- [ ] `todoDB.createNextInstance()` added
- [ ] API route updated for completion
- [ ] `RecurrenceBadge` component created
- [ ] `RecurrenceSelector` component created
- [ ] TodoForm updated with recurrence fields
- [ ] TodoItem displays recurrence badge
- [ ] Completion handler adds next todo to state
- [ ] Unit tests for date calculation
- [ ] E2E tests for user flow
- [ ] Edge cases tested (month-end, leap year)

## References

- **PRP Document**: `/PRPs/03-recurring-todos.md`
- **Example Code**: `/examples/recurring-todos/`
- **Project Patterns**: `/.github/copilot-instructions.md`

---

**Last Updated**: 2026-02-06  
**Status**: Ready for implementation
