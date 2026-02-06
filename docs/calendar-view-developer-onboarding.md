# Calendar View Developer Onboarding

**Welcome!** This guide will help you implement the Calendar View feature for the Todo App.

---

## 📚 Required Reading (30 minutes)

Read these documents in order:

1. **PRP 10**: [PRPs/10-calendar-view.md](../PRPs/10-calendar-view.md)  
   ⏱️ 15 minutes - Understand the feature requirements and user stories

2. **Quick Start**: [CALENDAR_VIEW_QUICK_START.md](../CALENDAR_VIEW_QUICK_START.md)  
   ⏱️ 5 minutes - Get the high-level implementation overview

3. **Technical Spec**: [docs/calendar-view-technical-spec.md](./calendar-view-technical-spec.md)  
   ⏱️ 10 minutes - Understand architecture decisions and data flow

---

## 🎯 Your Implementation Task

**Goal**: Add a monthly calendar view at `/calendar` that shows todos on their due dates and highlights Singapore public holidays.

**Timeline**: 2-3 days (17-24 hours)  
**Difficulty**: Medium  
**Prerequisites**: PRP 01 (Todos), PRP 02 (Priority), PRP 11 (Auth) must be implemented

---

## 🛠️ Development Environment Setup

### 1. Verify Prerequisites
```bash
# Check that the app is running
npm run dev

# Verify these features exist:
# - Can create todos with due dates ✅
# - Priority system works ✅
# - Authentication with WebAuthn ✅
# - lib/timezone.ts exists ✅
# - lib/db.ts exists ✅
```

### 2. Create Feature Branch
```bash
git checkout -b feature/calendar-view
```

### 3. Install Any Missing Dependencies (if needed)
```bash
# Should already be installed, but verify:
npm install @simplewebauthn/browser @simplewebauthn/server
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

---

## 📋 Implementation Phases

### Phase 1: Database Layer (2-3 hours)

**Files to modify**: `lib/db.ts`  
**Files to create**: `scripts/seed-holidays.ts`

#### Checklist:
- [ ] Add `Holiday` interface to `lib/db.ts`
- [ ] Add holidays table creation in database init
- [ ] Create `holidayDB` object with methods:
  - [ ] `getByDateRange(from, to)`
  - [ ] `create(date, name, type)`
  - [ ] `list()`
- [ ] Create `scripts/seed-holidays.ts` with Singapore holidays
- [ ] Run seed script: `npx tsx scripts/seed-holidays.ts`
- [ ] Verify: `sqlite3 todos.db "SELECT COUNT(*) FROM holidays;"`

**Code Reference**: See [Implementation Guide Step 1](./calendar-view-implementation-guide.md#step-1-database-setup)

---

### Phase 2: API Layer (1-2 hours)

**Files to create**: `app/api/holidays/route.ts`

#### Checklist:
- [ ] Create GET endpoint with `from` and `to` params
- [ ] Add authentication check
- [ ] Add date format validation
- [ ] Return holidays in date range
- [ ] Test manually: `curl http://localhost:3000/api/holidays?from=2026-01-01&to=2026-12-31 -H "Cookie: session=..."`

**Code Reference**: See [Implementation Guide Step 2](./calendar-view-implementation-guide.md#step-2-api-layer)

---

### Phase 3: Calendar Page Foundation (2-3 hours)

**Files to create**: `app/calendar/page.tsx`  
**Files to modify**: `middleware.ts`

#### Checklist:
- [ ] Create `app/calendar/page.tsx` as client component
- [ ] Add state: year, month, todos, holidays, loading, expandedDay
- [ ] Implement `fetchData()` function
- [ ] Create `generateCalendarMonth()` helper
- [ ] Add month navigation handlers (prev/next)
- [ ] Update `middleware.ts` to protect `/calendar` route
- [ ] Test: Navigate to `/calendar` and verify it loads

**Code Reference**: See [Implementation Guide Step 3](./calendar-view-implementation-guide.md#step-3-calendar-page-foundation)

---

### Phase 4: UI Components (4-5 hours)

**Files to modify**: `app/calendar/page.tsx`

#### Checklist:
- [ ] Create `CalendarGrid` component (7-column table)
- [ ] Create `CalendarDayCell` component with:
  - [ ] Day number display
  - [ ] Holiday name (if exists)
  - [ ] Todo count badge
  - [ ] Expanded todo list
- [ ] Implement expand/collapse on day click
- [ ] Implement navigation to main list on todo click
- [ ] Test: Click on a day with todos, verify list expands

**Code Reference**: See [Implementation Guide Step 3.1](./calendar-view-implementation-guide.md#31-create-calendar-page)

---

### Phase 5: Styling (2-3 hours)

**Files to modify**: `app/calendar/page.tsx` (Tailwind classes)

#### Checklist:
- [ ] Style today indicator (blue ring)
- [ ] Style holidays (red background)
- [ ] Style padding days (grayed out)
- [ ] Style todo count badge
- [ ] Style expanded todo list
- [ ] Add hover effects
- [ ] Test dark mode compatibility
- [ ] Test responsive layout (mobile/tablet/desktop)

**Styling Guide**: See [Technical Spec - Styling](./calendar-view-technical-spec.md#styling-specification)

---

### Phase 6: Accessibility (1-2 hours)

**Files to modify**: `app/calendar/page.tsx`

#### Checklist:
- [ ] Add ARIA labels to calendar cells
- [ ] Add keyboard navigation (Tab, Enter)
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Test keyboard-only navigation
- [ ] Verify WCAG AA contrast compliance

**Accessibility Guide**: See [Technical Spec - Accessibility](./calendar-view-technical-spec.md#accessibility-requirements)

---

### Phase 7: Testing (3-4 hours)

**Files to create**: `tests/10-calendar-view.spec.ts`

#### Checklist:
- [ ] Create test file
- [ ] Test: Calendar displays current month
- [ ] Test: Today is highlighted
- [ ] Test: Todos show on correct dates
- [ ] Test: Prev/next month navigation
- [ ] Test: Expand day to see todos
- [ ] Test: Click todo navigates to main list
- [ ] Test: Holidays display correctly
- [ ] Run tests: `npx playwright test tests/10-calendar-view.spec.ts`

**Test Reference**: See [Implementation Guide Step 4](./calendar-view-implementation-guide.md#step-4-testing)

---

## 🧪 Testing Your Implementation

### Manual Testing Checklist

#### Basic Functionality
- [ ] Navigate to `/calendar` (should require login)
- [ ] Current month displays correctly
- [ ] Today's date has blue ring
- [ ] Month/year title is correct
- [ ] Prev/Next buttons work

#### Todo Display
- [ ] Create todo with today's date
- [ ] Go to calendar, verify todo shows on today
- [ ] Todo count badge displays correctly
- [ ] Click day to expand, see todo list
- [ ] Click todo title, navigate to main list

#### Holiday Display
- [ ] Navigate to December 2026
- [ ] Verify Christmas Day (Dec 25) is highlighted
- [ ] Holiday name displays in red
- [ ] Background is red-tinted

#### Edge Cases
- [ ] Navigate to February 2026 (6 weeks needed)
- [ ] Create todo without due date (shouldn't show on calendar)
- [ ] Multiple todos on same day (count badge updates)
- [ ] Multiple holidays on same date (both show)

#### Responsive Design
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)

#### Dark Mode
- [ ] Toggle dark mode
- [ ] Verify all colors have sufficient contrast
- [ ] Verify holiday highlighting visible

---

## 🐛 Troubleshooting

### Common Issues

#### "Calendar page shows 401 Unauthorized"
**Solution**: Ensure middleware protects `/calendar` route and you're logged in

#### "Todos not showing on correct dates"
**Solution**: Verify using `formatSingaporeDate()` from `lib/timezone.ts`

#### "Holidays not displaying"
**Solution**: Run `npx tsx scripts/seed-holidays.ts` to populate database

#### "generateCalendarMonth is not defined"
**Solution**: Ensure function is defined before CalendarPage component

#### "Dark mode styling broken"
**Solution**: Add `dark:` prefix to all color classes

---

## ✅ Definition of Done

Before marking this feature complete, verify:

### Functionality
- [ ] All 10 acceptance criteria from PRP 10 are met
- [ ] E2E tests pass
- [ ] Manual testing checklist completed
- [ ] No console errors or warnings

### Code Quality
- [ ] TypeScript types defined for all interfaces
- [ ] No ESLint errors
- [ ] Code follows project patterns from `copilot-instructions.md`
- [ ] Singapore timezone used throughout

### Documentation
- [ ] Code comments added for complex logic
- [ ] USER_GUIDE.md updated with calendar section (if applicable)
- [ ] Screenshots added to documentation (optional)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] WCAG AA compliance verified
- [ ] Focus indicators visible

---

## 📊 Progress Tracking

Use this checklist to track your progress:

```
Day 1 (Morning)
[ ] Read all documentation (30 min)
[ ] Setup environment and branch (15 min)
[ ] Phase 1: Database layer (2-3 hours)

Day 1 (Afternoon)
[ ] Phase 2: API layer (1-2 hours)
[ ] Phase 3: Calendar page foundation (2-3 hours)

Day 2 (Morning)
[ ] Phase 4: UI components (4-5 hours)

Day 2 (Afternoon)
[ ] Phase 5: Styling (2-3 hours)
[ ] Phase 6: Accessibility (1-2 hours)

Day 3
[ ] Phase 7: Testing (3-4 hours)
[ ] Manual testing (1 hour)
[ ] Documentation updates (1 hour)
[ ] Code review and cleanup (1 hour)
```

---

## 🆘 Getting Help

### Resources
1. **Implementation Guide**: [docs/calendar-view-implementation-guide.md](./calendar-view-implementation-guide.md)
2. **Technical Spec**: [docs/calendar-view-technical-spec.md](./calendar-view-technical-spec.md)
3. **PRP 10**: [PRPs/10-calendar-view.md](../PRPs/10-calendar-view.md)

### Questions?
- Check troubleshooting section above
- Review similar code in `app/page.tsx` (main todo list)
- Look at existing API routes in `app/api/`
- Review existing tests in `tests/`

---

## 🎉 Completion

Once you've completed all phases and verified the definition of done:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: implement calendar view with Singapore holidays (PRP-10)"
   ```

2. **Push to remote**:
   ```bash
   git push origin feature/calendar-view
   ```

3. **Create Pull Request**:
   - Title: "feat: Calendar View with Singapore Holidays (PRP-10)"
   - Description: Link to PRP 10 and list all acceptance criteria met
   - Request review

4. **Demo the feature**:
   - Show calendar navigation
   - Show todo display
   - Show holiday highlighting
   - Show responsive design

---

**Good luck! You've got this! 🚀**

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Estimated Time**: 2-3 days
