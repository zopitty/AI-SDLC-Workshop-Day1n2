# Calendar View - Quick Start Reference

**Based on**: PRP 10: Calendar View  
**Guide**: [docs/calendar-view-implementation-guide.md](./docs/calendar-view-implementation-guide.md)  
**Estimated Time**: 2-3 days

---

## Quick Implementation Checklist

### Phase 1: Database (2-3 hours)
```bash
# 1. Add to lib/db.ts
- Holiday interface
- holidays table schema
- holidayDB methods (getByDateRange, create, list)

# 2. Create scripts/seed-holidays.ts
- Singapore holidays 2024-2026
- Run: npx tsx scripts/seed-holidays.ts
```

### Phase 2: API (1-2 hours)
```bash
# 3. Create app/api/holidays/route.ts
- GET endpoint with date range params
- Validation and error handling
```

### Phase 3: Calendar Page (2-3 hours)
```bash
# 4. Create app/calendar/page.tsx
- CalendarPage component (state, fetching)
- generateCalendarMonth function
- Month navigation handlers

# 5. Update middleware.ts
- Add '/calendar' to protected routes
```

### Phase 4: UI Components (4-5 hours)
```bash
# 6. Add to app/calendar/page.tsx
- CalendarGrid component
- CalendarDayCell component
- Expand/collapse logic
- Navigation to main list
```

### Phase 5: Styling (2-3 hours)
```bash
# 7. Style with Tailwind CSS
- Today indicator (blue ring)
- Holidays (red background)
- Responsive grid
- Dark mode support
```

### Phase 6: Testing (3-4 hours)
```bash
# 8. Create tests/10-calendar-view.spec.ts
- Calendar navigation tests
- Todo display tests
- Holiday display tests
- Accessibility tests
```

---

## Key Code Snippets

### Holiday Interface (lib/db.ts)
```typescript
export interface Holiday {
  id: number;
  date: string;              // YYYY-MM-DD
  name: string;
  type: 'public' | 'observance';
  created_at: string;
}

export const holidayDB = {
  getByDateRange(from: string, to: string): Holiday[] {
    const stmt = db.prepare(`
      SELECT * FROM holidays
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    return stmt.all(from, to) as Holiday[];
  },
};
```

### API Route (app/api/holidays/route.ts)
```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  if (!from || !to) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  
  const holidays = holidayDB.getByDateRange(from, to);
  return NextResponse.json({ holidays });
}
```

### Calendar Data Structure
```typescript
interface CalendarDay {
  date: string;              // YYYY-MM-DD
  isToday: boolean;
  isCurrentMonth: boolean;
  holiday: Holiday | null;
  todos: Todo[];
}

interface CalendarMonth {
  year: number;
  month: number;             // 1-12
  days: CalendarDay[];       // 35-42 days
}
```

### Generate Calendar Month
```typescript
function generateCalendarMonth(year: number, month: number, todos: Todo[], holidays: Holiday[]): CalendarMonth {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days: CalendarDay[] = [];
  
  // Add padding days from previous month
  // Add current month days
  // Add padding days from next month
  
  return { year, month, days };
}
```

---

## Singapore Holidays Sample (2026)

```typescript
const singaporeHolidays2026 = [
  { date: '2026-01-01', name: "New Year's Day", type: 'public' },
  { date: '2026-02-17', name: 'Chinese New Year', type: 'public' },
  { date: '2026-02-18', name: 'Chinese New Year', type: 'public' },
  { date: '2026-03-20', name: 'Hari Raya Puasa', type: 'public' },
  { date: '2026-04-03', name: 'Good Friday', type: 'public' },
  { date: '2026-05-01', name: 'Labour Day', type: 'public' },
  { date: '2026-05-29', name: 'Vesak Day', type: 'public' },
  { date: '2026-05-27', name: 'Hari Raya Haji', type: 'public' },
  { date: '2026-08-09', name: 'National Day', type: 'public' },
  { date: '2026-11-08', name: 'Deepavali', type: 'public' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'public' },
];
```

---

## Acceptance Criteria

✅ Verify before marking complete:

1. [ ] User can navigate to /calendar (protected route)
2. [ ] Calendar displays current month on load
3. [ ] Calendar shows 7-column grid (Sun-Sat)
4. [ ] Today's date highlighted with blue border
5. [ ] Singapore holidays displayed with name and color
6. [ ] Todos shown on due date cells (count badge)
7. [ ] Click day cell to expand todo list
8. [ ] Click todo title to navigate to main list
9. [ ] User can navigate prev/next month
10. [ ] Padding days shown in gray

---

## Testing Commands

```bash
# Run E2E tests
npx playwright test tests/10-calendar-view.spec.ts

# Interactive mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

---

## Troubleshooting

**Calendar doesn't load**: Check middleware, auth, API errors  
**Todos not showing**: Verify timezone handling, date format  
**Holidays missing**: Run seed script, check API route  
**Performance slow**: Optimize with React.memo, check todo count

---

## Resources

- **Full Guide**: [docs/calendar-view-implementation-guide.md](./docs/calendar-view-implementation-guide.md)
- **PRP 10**: [PRPs/10-calendar-view.md](./PRPs/10-calendar-view.md)
- **Architecture**: [PRPs/ARCHITECTURE.md](./PRPs/ARCHITECTURE.md)

---

**Total Time**: 17-24 hours  
**Difficulty**: Medium  
**Dependencies**: PRP 01, 02, 11
