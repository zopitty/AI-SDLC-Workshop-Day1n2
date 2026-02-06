# Calendar View - Technical Specification

**Feature**: Monthly Calendar Visualization  
**PRP Reference**: [PRPs/10-calendar-view.md](PRPs/10-calendar-view.md)  
**Implementation Guide**: [docs/calendar-view-implementation-guide.md](docs/calendar-view-implementation-guide.md)  
**Status**: Ready for Development

---

## Architecture Decision Records

### ADR-001: Singapore Timezone Only
**Decision**: All calendar operations use Singapore timezone (Asia/Singapore)  
**Rationale**: App is designed for Singapore market; simplifies timezone handling  
**Impact**: Must use `lib/timezone.ts` for all date operations

### ADR-002: Client-Side Calendar Generation
**Decision**: Calendar grid generated on client, not server  
**Rationale**: Faster navigation between months, no API calls needed  
**Impact**: Full todo dataset fetched once, filtered client-side

### ADR-003: Holidays Pre-Seeded
**Decision**: Singapore holidays stored in database, not fetched from external API  
**Rationale**: Reliability, performance, no external dependencies  
**Impact**: Requires annual holiday data updates

### ADR-004: No Drag-and-Drop (MVP)
**Decision**: Cannot drag todos to reschedule in calendar view  
**Rationale**: Out of scope for MVP, adds significant complexity  
**Impact**: Users navigate to main list to edit todos

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│           Calendar Page (/calendar)                  │
│                                                       │
│  ┌─────────────┐      ┌──────────────┐             │
│  │  useState   │      │  useEffect   │             │
│  │  - year     │      │  - fetchData │             │
│  │  - month    │      └──────┬───────┘             │
│  │  - todos    │             │                      │
│  │  - holidays │             │                      │
│  │  - expanded │             ▼                      │
│  └─────────────┘      ┌──────────────┐             │
│                        │  API Calls   │             │
│                        │  - GET /todos│             │
│                        │  - GET /holidays           │
│                        └──────┬───────┘             │
│                               │                      │
│                               ▼                      │
│                        ┌──────────────┐             │
│                        │ Calendar     │             │
│                        │ Generation   │             │
│                        │ (client)     │             │
│                        └──────┬───────┘             │
│                               │                      │
│                               ▼                      │
│  ┌────────────────────────────────────────┐         │
│  │  CalendarGrid (7×6 table)              │         │
│  │                                          │         │
│  │  ┌────┬────┬────┬────┬────┬────┬────┐ │         │
│  │  │Sun │Mon │Tue │Wed │Thu │Fri │Sat │ │         │
│  │  ├────┼────┼────┼────┼────┼────┼────┤ │         │
│  │  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ │         │
│  │  │    │🏖️ │    │📋×2│    │    │    │ │         │
│  │  └────┴────┴────┴────┴────┴────┴────┘ │         │
│  │                                          │         │
│  └────────────────────────────────────────┘         │
│                                                       │
└─────────────────────────────────────────────────────┘

Legend:
🏖️ = Holiday
📋 = Todo(s)
```

---

## Component Hierarchy

```
CalendarPage
├── MonthNavigator
│   ├── Previous Button
│   ├── Month/Year Title
│   └── Next Button
│
└── CalendarGrid
    ├── WeekDayHeaders (Sun-Sat)
    └── CalendarDayCell[] (35-42 cells)
        ├── Day Number
        ├── Holiday Name (if exists)
        ├── Todo Count Badge
        └── Todo List (if expanded)
            └── TodoItem[]
                ├── Priority Indicator
                └── Todo Title (truncated)
```

---

## State Management

### Calendar Page State
```typescript
const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1); // 1-12
const [todos, setTodos] = useState<Todo[]>([]);
const [holidays, setHolidays] = useState<Holiday[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [expandedDay, setExpandedDay] = useState<string | null>(null); // YYYY-MM-DD or null
```

### State Transitions
```
[Page Load]
  ↓
[loading = true]
  ↓
[Fetch todos + holidays]
  ↓
[loading = false]
  ↓
[Render calendar grid]
  ↓
[User clicks day] → [expandedDay = date]
  ↓
[User clicks todo] → [Navigate to /]
  ↓
[User clicks prev/next] → [Update year/month] → [Re-fetch holidays]
```

---

## API Contracts

### GET /api/holidays

**Request**:
```http
GET /api/holidays?from=2026-02-01&to=2026-02-28
Authorization: Cookie (session token)
```

**Response** (200 OK):
```json
{
  "holidays": [
    {
      "id": 1,
      "date": "2026-02-17",
      "name": "Chinese New Year",
      "type": "public",
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "date": "2026-02-18",
      "name": "Chinese New Year",
      "type": "public",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid session
- `400 Bad Request`: Missing or invalid date parameters
- `500 Internal Server Error`: Database error

---

## Database Schema

### Holidays Table
```sql
CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'public' CHECK(type IN ('public', 'observance')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_holidays_date ON holidays(date);
```

**Indexes**:
- `idx_holidays_date`: Optimizes date range queries

**Constraints**:
- `date` must be unique (prevents duplicate holidays)
- `type` must be 'public' or 'observance'

---

## Algorithm: Generate Calendar Month

```typescript
function generateCalendarMonth(
  year: number,
  month: number, // 1-12
  todos: Todo[],
  holidays: Holiday[]
): CalendarMonth {
  // 1. Calculate first and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // 2. Calculate padding needed
  const startPadding = firstDay.getDay(); // 0=Sunday, 6=Saturday
  const totalDays = lastDay.getDate();
  
  // 3. Initialize days array
  const days: CalendarDay[] = [];
  
  // 4. Add padding days from previous month
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push({
      date: formatDate(new Date(year, month - 2, prevMonthLastDay - i)),
      isToday: false,
      isCurrentMonth: false,
      holiday: null,
      todos: [],
    });
  }
  
  // 5. Add current month days
  const todayStr = formatSingaporeDate(getSingaporeNow());
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDate(new Date(year, month - 1, day));
    days.push({
      date: dateStr,
      isToday: dateStr === todayStr,
      isCurrentMonth: true,
      holiday: holidays.find(h => h.date === dateStr) || null,
      todos: todos.filter(t => t.due_date?.startsWith(dateStr)),
    });
  }
  
  // 6. Add padding days from next month to complete grid
  const remainingCells = Math.ceil(days.length / 7) * 7 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: formatDate(new Date(year, month, i)),
      isToday: false,
      isCurrentMonth: false,
      holiday: null,
      todos: [],
    });
  }
  
  return { year, month, days };
}
```

**Time Complexity**: O(n) where n is number of days (max 42)  
**Space Complexity**: O(n) for days array

---

## Styling Specification

### Today Indicator
```typescript
className="ring-2 ring-blue-500"
```
**Visual**: 2px blue ring around cell  
**WCAG Compliance**: AA (contrast ratio 4.5:1)

### Holiday Cells
```typescript
className="bg-red-50 dark:bg-red-900/20"
```
**Light Mode**: Light red background (#fef2f2)  
**Dark Mode**: Dark red with 20% opacity  
**Holiday Name**: `text-red-600 dark:text-red-400`

### Todo Count Badge
```typescript
className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
```
**Light Mode**: Blue background, dark blue text  
**Dark Mode**: Dark blue background, light blue text

### Padding Days
```typescript
className="bg-gray-100 dark:bg-gray-800 text-gray-400"
```
**Visual**: Grayed out, clearly non-current month

---

## Performance Characteristics

### Initial Load
- **Target**: < 500ms
- **API Calls**: 2 (todos + holidays)
- **Rendering**: Client-side React

### Month Navigation
- **Target**: < 100ms
- **API Calls**: 1 (holidays only, todos cached)
- **Rendering**: Pure client-side re-render

### Expand/Collapse Day
- **Target**: < 50ms
- **API Calls**: 0 (state update only)
- **Rendering**: Single cell re-render

### Scalability
- **Todos**: Tested up to 500 todos
- **Holidays**: ~100 holidays cached
- **Browser Memory**: ~2-5MB for typical dataset

---

## Accessibility Requirements

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate between days |
| Shift+Tab | Navigate backwards |
| Enter | Expand/collapse day |
| Space | Expand/collapse day |
| Arrow Left | Previous month (when focus on nav) |
| Arrow Right | Next month (when focus on nav) |

### ARIA Labels
```typescript
<div
  role="gridcell"
  aria-label={`${dayNumber}, ${holiday ? holiday.name + ', ' : ''}${todos.length} tasks`}
  tabIndex={0}
>
```

### Screen Reader Announcements
- Day number
- Holiday name (if exists)
- Todo count
- Today indicator ("Today, February 17, Chinese New Year, 3 tasks")

---

## Security Considerations

### Route Protection
- `/calendar` protected by `middleware.ts`
- Redirects unauthenticated users to `/login`

### API Security
- Session token required for all API calls
- Date parameters validated (regex: `^\d{4}-\d{2}-\d{2}$`)
- SQL injection prevented via prepared statements

### Data Isolation
- Todos filtered by `session.userId`
- Users cannot access other users' todos

---

## Testing Matrix

| Test Type | Coverage | Tool | Files |
|-----------|----------|------|-------|
| E2E | Calendar navigation | Playwright | `tests/10-calendar-view.spec.ts` |
| E2E | Todo display | Playwright | `tests/10-calendar-view.spec.ts` |
| E2E | Holiday display | Playwright | `tests/10-calendar-view.spec.ts` |
| E2E | Accessibility | Playwright | `tests/10-calendar-view.spec.ts` |
| Manual | Visual regression | Human | QA checklist |
| Manual | Responsive design | Human | Mobile/Tablet/Desktop |

---

## Migration Plan

### Database Migration
```sql
-- Step 1: Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'public' CHECK(type IN ('public', 'observance')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Step 3: Seed data (via script)
-- Run: npx tsx scripts/seed-holidays.ts
```

### Rollback Plan
```sql
-- If needed, rollback:
DROP INDEX IF EXISTS idx_holidays_date;
DROP TABLE IF EXISTS holidays;

-- No impact on existing todos/users tables
```

---

## Dependencies

### External Libraries
- **@simplewebauthn/browser**: Authentication (existing)
- **next**: 16.x (existing)
- **react**: 19.x (existing)
- **tailwindcss**: 4.x (existing)

### Internal Dependencies
- `lib/timezone.ts`: Date handling
- `lib/db.ts`: Database operations
- `lib/auth.ts`: Session management
- `middleware.ts`: Route protection

---

## Monitoring & Observability

### Metrics to Track
- Calendar page load time
- API response times (todos, holidays)
- Month navigation frequency
- Todo click-through rate (calendar → main list)

### Error Logging
```typescript
try {
  const holidays = holidayDB.getByDateRange(from, to);
} catch (error) {
  console.error('Error fetching holidays:', error);
  // Log to monitoring service in production
}
```

---

## Future Enhancements (Out of Scope)

1. **Week View**: Show single week with more detail
2. **Day View**: Show single day with hourly breakdown
3. **Drag-and-Drop**: Reschedule todos by dragging
4. **Create from Calendar**: Add todo directly from day cell
5. **Multi-day Events**: Support todos spanning multiple days
6. **Print Calendar**: Export to PDF
7. **iCal Integration**: Export to external calendars
8. **Custom Holidays**: Allow users to add personal holidays

---

## References

- **PRP 10**: [PRPs/10-calendar-view.md](PRPs/10-calendar-view.md)
- **Implementation Guide**: [docs/calendar-view-implementation-guide.md](docs/calendar-view-implementation-guide.md)
- **Quick Start**: [CALENDAR_VIEW_QUICK_START.md](CALENDAR_VIEW_QUICK_START.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: ✅ Approved for Implementation
