# Calendar View Implementation Guide
## Based on PRP 10: Calendar View

**Date Created**: 2026-02-06  
**Feature**: Monthly Calendar Visualization with Singapore Holidays  
**Status**: Ready for Implementation  
**Reference**: [PRPs/10-calendar-view.md](../PRPs/10-calendar-view.md)

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Step-by-Step Guide](#detailed-step-by-step-guide)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Considerations](#deployment-considerations)

---

## Overview

The Calendar View feature adds a monthly calendar visualization to the Todo App, showing todos on their due dates and highlighting Singapore public holidays. This feature integrates with the existing todo system and timezone handling.

### Key Features
- Monthly grid calendar (7 columns × 5-6 rows)
- Singapore public holidays highlighted
- Todos displayed on due date cells
- Month navigation (previous/next)
- Today indicator
- Click-to-expand todo list per day
- Navigate from calendar to main todo list

### Technical Stack
- **Frontend**: React 19 Client Component
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3) with holidays table
- **Timezone**: Singapore (Asia/Singapore) throughout
- **Testing**: Playwright E2E

---

## Prerequisites

Before starting, ensure these features are implemented:
- ✅ PRP 01: Todo CRUD Operations (foundation)
- ✅ PRP 02: Priority System (for todo display)
- ✅ PRP 11: WebAuthn Authentication (route protection)
- ✅ Timezone utilities in `lib/timezone.ts`
- ✅ Database layer in `lib/db.ts`

---

## Implementation Phases

### Phase 1: Database & Data Layer (Est. 2-3 hours)
1. Add Holiday interface and database schema
2. Create holiday CRUD methods in lib/db.ts
3. Create seed-holidays.ts script
4. Seed Singapore holidays for 2024-2030

### Phase 2: API Layer (Est. 1-2 hours)
1. Create GET /api/holidays route
2. Implement date range filtering
3. Add validation and error handling
4. Test API endpoints

### Phase 3: Calendar Page Foundation (Est. 2-3 hours)
1. Create app/calendar/page.tsx
2. Add route protection in middleware.ts
3. Implement data fetching logic
4. Create calendar data structures

### Phase 4: Calendar Grid Logic (Est. 3-4 hours)
1. Implement generateCalendarMonth function
2. Handle month padding days
3. Map todos and holidays to dates
4. Add today indicator logic

### Phase 5: UI Components (Est. 4-5 hours)
1. Create MonthNavigator component
2. Create CalendarGrid component
3. Create CalendarDay component
4. Implement expand/collapse functionality

### Phase 6: Styling & Accessibility (Est. 2-3 hours)
1. Style calendar grid with Tailwind CSS
2. Add today/holiday/weekend styling
3. Implement keyboard navigation
4. Add ARIA labels and focus indicators

### Phase 7: Testing (Est. 3-4 hours)
1. Create E2E test file
2. Test calendar navigation
3. Test todo display
4. Test accessibility features
5. Test edge cases

**Total Estimated Time**: 17-24 hours (2-3 days)

---

## Detailed Step-by-Step Guide

### Step 1: Database Setup

#### 1.1 Add Holiday Interface to `lib/db.ts`

Add this interface to the file:

```typescript
export interface Holiday {
  id: number;
  date: string;              // ISO date (YYYY-MM-DD)
  name: string;              // "Christmas Day"
  type: 'public' | 'observance';
  created_at: string;
}
```

#### 1.2 Create holidays Table Migration

Add this to the database initialization section in `lib/db.ts`:

```typescript
// Create holidays table
db.exec(`
  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'public' CHECK(type IN ('public', 'observance')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  
  CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
`);
```

#### 1.3 Implement Holiday CRUD Methods

Add to `lib/db.ts`:

```typescript
export const holidayDB = {
  /**
   * Get holidays within a date range
   */
  getByDateRange(from: string, to: string): Holiday[] {
    const stmt = db.prepare(`
      SELECT * FROM holidays
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    return stmt.all(from, to) as Holiday[];
  },

  /**
   * Create a new holiday
   */
  create(date: string, name: string, type: 'public' | 'observance'): Holiday {
    const stmt = db.prepare(`
      INSERT INTO holidays (date, name, type)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(date, name, type);
    return { id: info.lastInsertRowid as number, date, name, type, created_at: new Date().toISOString() };
  },

  /**
   * Get all holidays
   */
  list(): Holiday[] {
    const stmt = db.prepare('SELECT * FROM holidays ORDER BY date ASC');
    return stmt.all() as Holiday[];
  },
};
```

#### 1.4 Create Seed Holidays Script

Create `scripts/seed-holidays.ts`:

```typescript
import { db, holidayDB } from '../lib/db';

const singaporeHolidays = [
  // 2024
  { date: '2024-01-01', name: "New Year's Day", type: 'public' as const },
  { date: '2024-02-10', name: 'Chinese New Year', type: 'public' as const },
  { date: '2024-02-11', name: 'Chinese New Year', type: 'public' as const },
  { date: '2024-02-12', name: 'Chinese New Year (in lieu)', type: 'public' as const },
  { date: '2024-03-29', name: 'Good Friday', type: 'public' as const },
  { date: '2024-04-10', name: 'Hari Raya Puasa', type: 'public' as const },
  { date: '2024-05-01', name: 'Labour Day', type: 'public' as const },
  { date: '2024-05-22', name: 'Vesak Day', type: 'public' as const },
  { date: '2024-06-17', name: 'Hari Raya Haji', type: 'public' as const },
  { date: '2024-08-09', name: 'National Day', type: 'public' as const },
  { date: '2024-11-01', name: 'Deepavali', type: 'public' as const },
  { date: '2024-12-25', name: 'Christmas Day', type: 'public' as const },

  // 2025
  { date: '2025-01-01', name: "New Year's Day", type: 'public' as const },
  { date: '2025-01-29', name: 'Chinese New Year', type: 'public' as const },
  { date: '2025-01-30', name: 'Chinese New Year', type: 'public' as const },
  { date: '2025-03-31', name: 'Hari Raya Puasa', type: 'public' as const },
  { date: '2025-04-18', name: 'Good Friday', type: 'public' as const },
  { date: '2025-05-01', name: 'Labour Day', type: 'public' as const },
  { date: '2025-05-12', name: 'Vesak Day', type: 'public' as const },
  { date: '2025-06-07', name: 'Hari Raya Haji', type: 'public' as const },
  { date: '2025-08-09', name: 'National Day', type: 'public' as const },
  { date: '2025-10-21', name: 'Deepavali', type: 'public' as const },
  { date: '2025-12-25', name: 'Christmas Day', type: 'public' as const },

  // 2026
  { date: '2026-01-01', name: "New Year's Day", type: 'public' as const },
  { date: '2026-02-17', name: 'Chinese New Year', type: 'public' as const },
  { date: '2026-02-18', name: 'Chinese New Year', type: 'public' as const },
  { date: '2026-03-20', name: 'Hari Raya Puasa', type: 'public' as const },
  { date: '2026-04-03', name: 'Good Friday', type: 'public' as const },
  { date: '2026-05-01', name: 'Labour Day', type: 'public' as const },
  { date: '2026-05-29', name: 'Vesak Day', type: 'public' as const },
  { date: '2026-05-27', name: 'Hari Raya Haji', type: 'public' as const },
  { date: '2026-08-09', name: 'National Day', type: 'public' as const },
  { date: '2026-11-08', name: 'Deepavali', type: 'public' as const },
  { date: '2026-12-25', name: 'Christmas Day', type: 'public' as const },
];

console.log('Seeding Singapore public holidays...');

let insertedCount = 0;
let skippedCount = 0;

for (const holiday of singaporeHolidays) {
  try {
    holidayDB.create(holiday.date, holiday.name, holiday.type);
    insertedCount++;
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      skippedCount++;
    } else {
      console.error(`Error inserting ${holiday.date}:`, error.message);
    }
  }
}

console.log(`✅ Seeding complete: ${insertedCount} inserted, ${skippedCount} skipped`);
console.log(`Total holidays in database: ${holidayDB.list().length}`);
```

Run the seed script:
```bash
npx tsx scripts/seed-holidays.ts
```

---

### Step 2: API Layer

#### 2.1 Create Holiday API Route

Create `app/api/holidays/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { holidayDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Auth check
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Validation
  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to' },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  // Fetch holidays
  try {
    const holidays = holidayDB.getByDateRange(from, to);
    return NextResponse.json({ holidays });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Step 3: Calendar Page Foundation

#### 3.1 Create Calendar Page

Create `app/calendar/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';
import { Todo, Holiday } from '@/lib/db';

interface CalendarDay {
  date: string;              // YYYY-MM-DD
  isToday: boolean;
  isCurrentMonth: boolean;   // False for padding days from prev/next month
  holiday: Holiday | null;
  todos: Todo[];
}

interface CalendarMonth {
  year: number;
  month: number;             // 1-12
  days: CalendarDay[];       // 35-42 days (5-6 weeks)
}

export default function CalendarPage() {
  const router = useRouter();
  const now = getSingaporeNow();
  
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Fetch data on mount and when month changes
  useEffect(() => {
    fetchData();
  }, [currentYear, currentMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch todos
      const todosRes = await fetch('/api/todos');
      if (todosRes.ok) {
        const data = await todosRes.json();
        setTodos(data.todos);
      }

      // Fetch holidays for this month
      const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0);
      const lastDayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      const holidaysRes = await fetch(`/api/holidays?from=${firstDay}&to=${lastDayStr}`);
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        setHolidays(data.holidays);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Generate calendar month data
  const calendarMonth = generateCalendarMonth(currentYear, currentMonth, todos, holidays);

  // Month navigation
  function goToPrevMonth() {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  // Handle day click
  function handleDayClick(day: CalendarDay) {
    if (!day.isCurrentMonth) return;
    setExpandedDay(expandedDay === day.date ? null : day.date);
  }

  // Handle todo click - navigate to main list
  function handleTodoClick(todoId: number) {
    router.push(`/#todo-${todoId}`);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Previous
          </button>
          
          <h1 className="text-3xl font-bold">
            {monthNames[currentMonth - 1]} {currentYear}
          </h1>
          
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          month={calendarMonth}
          expandedDay={expandedDay}
          onDayClick={handleDayClick}
          onTodoClick={handleTodoClick}
        />
      </div>
    </div>
  );
}

// Calendar grid generation helper
function generateCalendarMonth(
  year: number,
  month: number,
  todos: Todo[],
  holidays: Holiday[]
): CalendarMonth {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPadding = firstDay.getDay(); // 0=Sun, 6=Sat
  const totalDays = lastDay.getDate();
  const days: CalendarDay[] = [];
  
  const todayStr = formatSingaporeDate(getSingaporeNow());

  // Padding days from previous month
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 2, prevMonthLastDay - i);
    const dateStr = formatSingaporeDate(date);
    days.push({
      date: dateStr,
      isToday: false,
      isCurrentMonth: false,
      holiday: null,
      todos: [],
    });
  }
  
  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatSingaporeDate(date);
    days.push({
      date: dateStr,
      isToday: dateStr === todayStr,
      isCurrentMonth: true,
      holiday: holidays.find(h => h.date === dateStr) || null,
      todos: todos.filter(t => t.due_date?.startsWith(dateStr)),
    });
  }
  
  // Padding days from next month
  const remainingCells = Math.ceil(days.length / 7) * 7 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, month, i);
    const dateStr = formatSingaporeDate(date);
    days.push({
      date: dateStr,
      isToday: false,
      isCurrentMonth: false,
      holiday: null,
      todos: [],
    });
  }
  
  return { year, month, days };
}

// Calendar Grid Component
function CalendarGrid({
  month,
  expandedDay,
  onDayClick,
  onTodoClick,
}: {
  month: CalendarMonth;
  expandedDay: string | null;
  onDayClick: (day: CalendarDay) => void;
  onTodoClick: (todoId: number) => void;
}) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-700">
        {weekDays.map(day => (
          <div key={day} className="p-4 text-center font-semibold">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {month.days.map((day, index) => (
          <CalendarDayCell
            key={`${day.date}-${index}`}
            day={day}
            isExpanded={expandedDay === day.date}
            onClick={() => onDayClick(day)}
            onTodoClick={onTodoClick}
          />
        ))}
      </div>
    </div>
  );
}

// Calendar Day Cell Component
function CalendarDayCell({
  day,
  isExpanded,
  onClick,
  onTodoClick,
}: {
  day: CalendarDay;
  isExpanded: boolean;
  onClick: () => void;
  onTodoClick: (todoId: number) => void;
}) {
  const dayNumber = new Date(day.date).getDate();
  
  let cellClasses = 'min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750';
  
  if (!day.isCurrentMonth) {
    cellClasses += ' bg-gray-100 dark:bg-gray-800 text-gray-400';
  }
  
  if (day.isToday) {
    cellClasses += ' ring-2 ring-blue-500';
  }
  
  if (day.holiday) {
    cellClasses += ' bg-red-50 dark:bg-red-900/20';
  }

  return (
    <div className={cellClasses} onClick={onClick}>
      {/* Day number */}
      <div className="font-semibold mb-1">{dayNumber}</div>
      
      {/* Holiday name */}
      {day.holiday && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-1">
          {day.holiday.name}
        </div>
      )}
      
      {/* Todo count badge */}
      {day.todos.length > 0 && (
        <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
          {day.todos.length} task{day.todos.length > 1 ? 's' : ''}
        </div>
      )}
      
      {/* Expanded todo list */}
      {isExpanded && day.todos.length > 0 && (
        <div className="mt-2 space-y-1">
          {day.todos.slice(0, 3).map(todo => (
            <div
              key={todo.id}
              className="text-xs p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onTodoClick(todo.id);
              }}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                todo.priority === 'high' ? 'bg-red-500' :
                todo.priority === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}></span>
              {todo.title.substring(0, 30)}
              {todo.title.length > 30 ? '...' : ''}
            </div>
          ))}
          {day.todos.length > 3 && (
            <div className="text-xs text-gray-500">
              ...and {day.todos.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 3.2 Update Middleware to Protect Calendar Route

Edit `middleware.ts` to include `/calendar`:

```typescript
export const config = {
  matcher: ['/', '/calendar'],
};
```

---

### Step 4: Testing

Create `tests/10-calendar-view.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Calendar View', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setupVirtualAuthenticator();
    await helper.registerAndLogin('calendaruser');
  });

  test('should display current month calendar', async ({ page }) => {
    await page.goto('/calendar');
    
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const expectedTitle = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    
    await expect(page.locator('h1')).toContainText(expectedTitle);
  });

  test('should highlight today', async ({ page }) => {
    await page.goto('/calendar');
    
    const today = page.locator('[class*="ring-2 ring-blue-500"]').first();
    await expect(today).toBeVisible();
  });

  test('should show todos on their due dates', async ({ page }) => {
    // Create a todo with today's date
    await helper.createTodo({
      title: 'Calendar Test Todo',
      dueDate: new Date().toISOString().split('T')[0],
    });
    
    await page.goto('/calendar');
    
    await expect(page.locator('text=1 task')).toBeVisible();
  });

  test('should navigate to previous and next month', async ({ page }) => {
    await page.goto('/calendar');
    
    const currentTitle = await page.locator('h1').textContent();
    
    // Go to next month
    await page.click('button:has-text("Next")');
    const nextTitle = await page.locator('h1').textContent();
    expect(nextTitle).not.toBe(currentTitle);
    
    // Go back to previous month
    await page.click('button:has-text("Previous")');
    const backTitle = await page.locator('h1').textContent();
    expect(backTitle).toBe(currentTitle);
  });

  test('should expand day cell to show todo list', async ({ page }) => {
    // Create a todo
    await helper.createTodo({
      title: 'Expandable Todo',
      dueDate: new Date().toISOString().split('T')[0],
    });
    
    await page.goto('/calendar');
    
    // Click on today's cell
    const todayCell = page.locator('[class*="ring-2 ring-blue-500"]').first();
    await todayCell.click();
    
    // Should see the todo title
    await expect(page.locator('text=Expandable Todo')).toBeVisible();
  });

  test('should navigate to main list when clicking todo', async ({ page }) => {
    // Create a todo
    await helper.createTodo({
      title: 'Click to Navigate',
      dueDate: new Date().toISOString().split('T')[0],
    });
    
    await page.goto('/calendar');
    
    // Expand today's cell
    const todayCell = page.locator('[class*="ring-2 ring-blue-500"]').first();
    await todayCell.click();
    
    // Click the todo
    await page.click('text=Click to Navigate');
    
    // Should navigate to main list
    await expect(page).toHaveURL('/');
  });

  test('should display holidays', async ({ page }) => {
    await page.goto('/calendar');
    
    // Navigate to December 2026 (has Christmas)
    while (!(await page.locator('h1').textContent())?.includes('December 2026')) {
      await page.click('button:has-text("Next")');
    }
    
    // Should see Christmas Day
    await expect(page.locator('text=Christmas Day')).toBeVisible();
  });
});
```

---

## Testing Strategy

### Unit Tests (Optional)
- Test `generateCalendarMonth` function
- Test date calculations for month padding
- Test holiday/todo mapping logic

### E2E Tests (Required)
1. **Calendar Navigation**
   - Load calendar page
   - Verify current month displays
   - Test prev/next month buttons
   
2. **Today Indicator**
   - Verify today's date is highlighted
   - Verify highlight persists across month changes
   
3. **Todo Display**
   - Create todos with various due dates
   - Verify todos appear on correct days
   - Test todo count badge
   
4. **Expand/Collapse**
   - Click day cell to expand
   - Verify todo list shows
   - Click again to collapse
   
5. **Navigation to Main List**
   - Click todo title in calendar
   - Verify navigation to main list
   - Verify scroll to todo (if implemented)
   
6. **Holidays**
   - Navigate to months with known holidays
   - Verify holiday names display
   - Verify holiday styling

7. **Keyboard Accessibility**
   - Tab navigation through days
   - Enter key to expand/collapse
   - Arrow keys for month navigation

### Manual Testing Checklist
- [ ] Visual appearance matches design
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Dark mode styling works correctly
- [ ] Today indicator is clearly visible
- [ ] Holiday colors meet WCAG AA contrast
- [ ] Performance is smooth with 50+ todos
- [ ] Timezone handling is correct (Singapore)

---

## Deployment Considerations

### Database Migration
- Run seed-holidays script before deploying
- Ensure holidays table is created in production database
- Consider automating holiday updates annually

### Performance
- Calendar renders client-side (no SSR needed)
- All data fetching happens on client
- Consider caching holidays in localStorage
- Monitor performance with large todo counts (100+)

### Security
- Route is protected by middleware
- All API calls require authentication
- Date range validation prevents injection
- No user input in holiday data

### Accessibility
- Ensure keyboard navigation works
- Test with screen readers
- Verify ARIA labels are present
- Check focus indicators are visible
- Verify color contrast ratios

---

## Next Steps After Implementation

1. **User Testing**
   - Gather feedback on calendar usability
   - Test with real user workflows
   - Identify pain points

2. **Future Enhancements** (Out of Scope for MVP)
   - Week view
   - Day view
   - Drag-and-drop to reschedule
   - Create todo directly from calendar
   - Print calendar
   - Export to iCal/Google Calendar

3. **Documentation Updates**
   - Update USER_GUIDE.md with calendar section
   - Add screenshots to documentation
   - Document keyboard shortcuts

4. **Analytics** (Optional)
   - Track calendar page usage
   - Monitor most common actions
   - Identify feature usage patterns

---

## Troubleshooting Common Issues

### Calendar doesn't load
- Check if middleware is protecting /calendar route
- Verify authentication is working
- Check browser console for API errors

### Todos not showing on correct dates
- Verify timezone handling is using `lib/timezone.ts`
- Check that due_date format is YYYY-MM-DD
- Ensure date comparisons account for time zones

### Holidays not displaying
- Run seed-holidays script
- Verify holidays table exists
- Check API route is returning data
- Ensure date range parameters are correct

### Performance issues
- Check if virtualization is needed for large datasets
- Consider pagination for todos
- Optimize re-renders with React.memo

### Styling issues
- Verify Tailwind classes are correct
- Check dark mode classes
- Ensure responsive breakpoints work
- Test in different browsers

---

## Acceptance Criteria Checklist

Before marking this feature as complete, verify all acceptance criteria:

- [ ] User can navigate to /calendar page (protected route)
- [ ] Calendar displays current month on load
- [ ] Calendar shows 7-column grid (Sun-Sat)
- [ ] Today's date highlighted with blue border
- [ ] Singapore holidays displayed with name and color
- [ ] Todos shown on their due date cells (count badge)
- [ ] Click day cell to expand and see todo list
- [ ] Click todo title to navigate to main list (scroll to todo)
- [ ] User can navigate to prev/next month
- [ ] Padding days from prev/next month shown in gray
- [ ] Keyboard navigation works
- [ ] Screen reader announces day, holiday, todo count
- [ ] WCAG AA contrast compliance
- [ ] E2E tests pass
- [ ] Documentation updated

---

## Resources

- **PRP Reference**: [PRPs/10-calendar-view.md](../PRPs/10-calendar-view.md)
- **Architecture**: [PRPs/ARCHITECTURE.md](../PRPs/ARCHITECTURE.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- **Testing Guide**: Playwright documentation
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Document Status**: ✅ Ready for Implementation  
**Estimated Effort**: 2-3 days  
**Dependencies**: PRP 01, 02, 11  
**Last Updated**: 2026-02-06
