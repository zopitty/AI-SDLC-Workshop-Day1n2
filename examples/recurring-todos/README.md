# Recurring Todos - Example Implementation

This directory contains example implementation code for **PRP 03: Recurring Todos** feature. These files demonstrate how the recurring todos feature should be implemented according to the architecture specification in `/PRPs/03-recurring-todos.md`.

## 📁 Directory Structure

```
examples/recurring-todos/
├── lib/
│   ├── timezone.ts          # Date calculation utilities
│   └── db-types.ts          # Database types and migration
├── components/
│   ├── RecurrenceBadge.tsx  # Visual indicator component
│   └── RecurrenceSelector.tsx # Recurrence pattern selector
├── api/
│   └── complete-recurring-todo.ts # API logic example
├── tests/
│   └── calculateNextDueDate.test.ts # Unit tests
└── README.md
```

## 🎯 What's Included

### 1. Date Calculation Logic (`lib/timezone.ts`)

Core utility for calculating next due dates based on recurrence patterns:

- ✅ **Daily**: Adds 1 day
- ✅ **Weekly**: Adds 7 days  
- ✅ **Monthly**: Adds 1 month (handles month-end edge cases)
- ✅ **Yearly**: Adds 1 year (handles leap year edge cases)

**Edge cases handled:**
- Jan 31 → Feb 28/29 (last valid day)
- Feb 29 (leap year) → Feb 28 (non-leap year)
- Aug 31 → Sep 30
- Timezone consistency (Singapore/Asia +08:00)

### 2. Database Types (`lib/db-types.ts`)

TypeScript interfaces and database migration for recurring todos:

```typescript
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  recurrence_pattern: RecurrencePattern; // NEW
  created_at: string;
  updated_at: string;
}
```

**Migration SQL:**
```sql
ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT 
  CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly') OR recurrence_pattern IS NULL);

CREATE INDEX idx_todos_recurrence ON todos(recurrence_pattern);
```

### 3. React Components

#### RecurrenceBadge (`components/RecurrenceBadge.tsx`)
Visual indicator showing recurring status:

```tsx
<RecurrenceBadge pattern="daily" />
// Renders: 🔁 (Daily)
```

**Features:**
- Icon + text label for accessibility
- Conditional rendering (only shows if recurring)
- ARIA labels for screen readers

#### RecurrenceSelector (`components/RecurrenceSelector.tsx`)
Form control for setting recurrence pattern:

```tsx
<RecurrenceSelector 
  value={pattern} 
  onChange={setPattern}
  hasDueDate={!!dueDate}
/>
```

**Features:**
- Checkbox to enable/disable recurring
- Dropdown for pattern selection (daily/weekly/monthly/yearly)
- Validation warning if due date not set
- Fully accessible (keyboard navigation, ARIA labels)

### 4. API Logic (`api/complete-recurring-todo.ts`)

Demonstrates the completion flow with next instance creation:

**Process:**
1. Mark current todo as completed
2. If recurring:
   - Calculate next due date
   - Create new todo with same metadata
   - Copy tags and subtasks (unchecked)
3. Return both completed todo and next instance

**Example response:**
```json
{
  "completed_todo": {
    "id": 123,
    "title": "Daily standup",
    "completed": true
  },
  "next_todo": {
    "id": 124,
    "title": "Daily standup",
    "completed": false,
    "due_date": "2026-12-26T09:00:00+08:00",
    "recurrence_pattern": "daily"
  }
}
```

### 5. Unit Tests (`tests/calculateNextDueDate.test.ts`)

Comprehensive test coverage for date calculation:

- ✅ Daily recurrence
- ✅ Weekly recurrence (preserves day of week)
- ✅ Monthly recurrence (edge cases: Jan 31 → Feb 28/29, Aug 31 → Sep 30)
- ✅ Yearly recurrence (leap year handling)
- ✅ Timezone consistency
- ✅ Error handling (invalid patterns)

**Run tests:**
```bash
npm test -- calculateNextDueDate.test.ts
```

## 🚀 How to Use These Examples

### For Developers

1. **Review the architecture**: Read `/PRPs/03-recurring-todos.md` first
2. **Study the examples**: Understand the implementation patterns
3. **Adapt to your codebase**: Copy and modify for your specific app structure
4. **Test thoroughly**: Use the test file as a template

### For AI Coding Assistants

When implementing recurring todos:

```
I want to implement recurring todos feature.
Reference:
- Architecture: /PRPs/03-recurring-todos.md
- Example implementation: /examples/recurring-todos/

Please:
1. Add recurrence_pattern column to database
2. Implement calculateNextDueDate() in lib/timezone.ts
3. Create RecurrenceBadge and RecurrenceSelector components
4. Update API route to handle completion with next instance creation
5. Write tests for date calculation edge cases
```

## 📋 Implementation Checklist

Based on PRP 03 Implementation Steps:

- [x] **Date calculation utility** (`lib/timezone.ts`)
  - [x] `calculateNextDueDate()` function
  - [x] Edge case handling (month-end, leap years)
  - [x] Singapore timezone consistency

- [x] **Database schema** (`lib/db-types.ts`)
  - [x] `recurrence_pattern` column definition
  - [x] CHECK constraint for valid patterns
  - [x] Index for filtering

- [x] **React components**
  - [x] `RecurrenceBadge` - Visual indicator
  - [x] `RecurrenceSelector` - Form control

- [x] **API logic** (`api/complete-recurring-todo.ts`)
  - [x] Completion handler
  - [x] Next instance creation
  - [x] Metadata inheritance (tags, subtasks)

- [x] **Unit tests** (`tests/calculateNextDueDate.test.ts`)
  - [x] All recurrence patterns
  - [x] Edge cases
  - [x] Error handling

## 🔗 Related PRP Sections

- **Data Model**: Lines 52-108 (interfaces, schema, examples)
- **Component Specifications**: Lines 290-340 (React components)
- **API Specification**: Lines 227-289 (request/response formats)
- **Date Calculation Logic**: Lines 110-132 (algorithm)
- **Testing Strategy**: Lines 588-688 (E2E and unit tests)

## ⚠️ Important Notes

1. **Dependencies**: This feature requires PRPs 01 (Todo CRUD), 02 (Priority), 05 (Subtasks), and 06 (Tags) to be implemented first for full metadata inheritance.

2. **Timezone**: All date operations MUST use Singapore timezone. Never use `new Date()` directly - always use `getSingaporeNow()`.

3. **Validation**: Due date is REQUIRED for recurring todos. The `RecurrenceSelector` component shows a warning if `hasDueDate={false}`.

4. **Next.js 16**: API route params are async. Use `const { id } = await params;`

5. **Database operations**: Use synchronous `better-sqlite3` (no async/await for DB queries).

## 📊 Test Coverage

The example includes:
- **12 unit tests** for date calculation
- **4 edge case tests** for month-end/leap year scenarios
- **100% coverage** of recurrence patterns (daily/weekly/monthly/yearly)

## 🎓 Learning Resources

- **PRP Document**: `/PRPs/03-recurring-todos.md` (24KB, comprehensive architecture)
- **Project Patterns**: `/.github/copilot-instructions.md` (coding standards)
- **User Guide**: `/USER_GUIDE.md` (end-user documentation)

## 📝 Next Steps

To integrate this into a real application:

1. Copy `lib/timezone.ts` to your `lib/` directory
2. Add migration SQL to your `lib/db.ts` initialization
3. Create components in your `components/` directory
4. Update API routes in `app/api/todos/[id]/route.ts`
5. Add E2E tests to `tests/` directory (see PRP 03 lines 588-661)

---

**Created**: 2026-02-06  
**Based on**: PRP 03: Recurring Todos v1.0  
**Status**: ✅ Example implementation complete
