# Implementation Plan: PRP 04 - Reminders & Notifications

## Overview
This document provides a step-by-step implementation plan for adding browser-based push notifications to the Todo App, as specified in `PRPs/04-reminders-notifications.md`.

**Feature**: Browser notifications for todos with configurable reminder timing (15 minutes to 1 week before due date)  
**Status**: Ready for Implementation  
**Est. Time**: 2 days  
**Dependencies**: Todo CRUD (PRP 01), Priority System (PRP 02), Recurring Todos (PRP 03)

---

## Implementation Checklist

### Phase 1: Database Layer (30-45 minutes)

#### 1.1 Update Database Schema
**File**: `lib/db.ts`

- [ ] Add `reminder_minutes` field to `Todo` interface
  ```typescript
  reminder_minutes: number | null;  // 15, 30, 60, 120, 1440, 2880, 10080, or null
  ```

- [ ] Add `last_notification_sent` field to `Todo` interface
  ```typescript
  last_notification_sent: string | null;  // ISO timestamp to prevent duplicates
  ```

- [ ] Add migration SQL in database initialization:
  ```sql
  ALTER TABLE todos ADD COLUMN reminder_minutes INTEGER;
  ALTER TABLE todos ADD COLUMN last_notification_sent TEXT;
  CREATE INDEX idx_todos_reminder ON todos(reminder_minutes, due_date) 
    WHERE reminder_minutes IS NOT NULL AND completed = 0;
  ```

#### 1.2 Add Database Methods
**File**: `lib/db.ts`

- [ ] Implement `todoDB.getDueReminders(userId: number, now: Date)`:
  - Query todos WHERE:
    - `user_id = userId`
    - `completed = 0`
    - `reminder_minutes IS NOT NULL`
    - `due_date - reminder_minutes <= now` (use Singapore timezone)
    - `last_notification_sent IS NULL`
  - Return array of todos with id, title, due_date, reminder_minutes

- [ ] Implement `todoDB.markNotificationSent(todoId: number, timestamp: string)`:
  - Update `last_notification_sent = timestamp` for given todo
  - Use prepared statement for performance

- [ ] Update `todoDB.create()` to accept `reminder_minutes` parameter
- [ ] Update `todoDB.update()` to accept `reminder_minutes` parameter
- [ ] Update `todoDB.createRecurringInstance()` to:
  - Copy `reminder_minutes` from parent (preserve offset, not absolute time)
  - Set `last_notification_sent = null` for new instance

---

### Phase 2: API Layer (30-45 minutes)

#### 2.1 Create Notification Check Endpoint
**File**: `app/api/notifications/check/route.ts` (NEW)

- [ ] Create directory structure: `app/api/notifications/check/`
- [ ] Implement `GET` handler:
  ```typescript
  export async function GET(request: NextRequest) {
    // 1. Get session (check authentication)
    const session = await getSession();
    if (!session) return 401 error
    
    // 2. Get current Singapore time
    const now = getSingaporeNow();
    
    // 3. Query due reminders
    const reminders = todoDB.getDueReminders(session.userId, now);
    
    // 4. Mark each as sent
    reminders.forEach(reminder => {
      todoDB.markNotificationSent(reminder.id, now.toISOString());
    });
    
    // 5. Return reminder list
    return NextResponse.json({ reminders });
  }
  ```

- [ ] Add error handling (try-catch)
- [ ] Add logging for debugging
- [ ] Test with Postman/curl

#### 2.2 Update Todo CRUD Endpoints
**Files**: `app/api/todos/route.ts`, `app/api/todos/[id]/route.ts`

- [ ] **POST /api/todos**: Add `reminder_minutes` to request body validation
- [ ] **PUT /api/todos/[id]**: Add `reminder_minutes` to update logic
- [ ] **PUT /api/todos/[id]**: When completing recurring todo:
  - Copy `reminder_minutes` to next instance
  - Reset `last_notification_sent = null` for new instance

---

### Phase 3: Notification Hooks (45-60 minutes)

#### 3.1 Create Base Notification Hook
**File**: `lib/hooks/useNotifications.ts` (NEW)

- [ ] Create `lib/hooks/` directory if not exists
- [ ] Implement `useNotifications` hook:
  ```typescript
  export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    
    useEffect(() => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }, []);
    
    const requestPermission = async () => {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    };
    
    const showNotification = (title: string, body: string, todoId: number) => {
      if (permission !== 'granted') return;
      
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `todo-${todoId}`,  // Prevent duplicates
      });
      
      notification.onclick = () => {
        window.focus();
        // TODO: Navigate to specific todo (if needed)
        notification.close();
      };
    };
    
    return { permission, requestPermission, showNotification };
  }
  ```

- [ ] Add TypeScript types for hook return value
- [ ] Handle browsers without Notification API support

#### 3.2 Create Polling Hook
**File**: `lib/hooks/useNotificationPolling.ts` (NEW)

- [ ] Implement `useNotificationPolling` hook:
  ```typescript
  export function useNotificationPolling(enabled: boolean) {
    const { showNotification } = useNotifications();
    
    useEffect(() => {
      if (!enabled) return;
      
      const checkReminders = async () => {
        try {
          const response = await fetch('/api/notifications/check');
          if (!response.ok) return;
          
          const { reminders } = await response.json();
          
          reminders.forEach((reminder: Todo) => {
            const timeRemaining = formatTimeRemaining(reminder.due_date);
            showNotification(
              '📋 Todo Reminder',
              `${reminder.title} is due ${timeRemaining}`,
              reminder.id
            );
          });
        } catch (error) {
          console.error('Failed to check reminders:', error);
        }
      };
      
      // Check immediately on mount
      checkReminders();
      
      // Then poll every 60 seconds
      const intervalId = setInterval(checkReminders, 60000);
      
      return () => clearInterval(intervalId);
    }, [enabled, showNotification]);
  }
  ```

- [ ] Add `formatTimeRemaining` utility function
- [ ] Add error boundaries
- [ ] Test polling behavior (use browser devtools)

---

### Phase 4: UI Components (60-90 minutes)

#### 4.1 Notification Permission Button
**File**: `app/layout.tsx`

- [ ] Import `useNotifications` hook
- [ ] Add state for notification permission
- [ ] Add button in header/nav area:
  ```tsx
  const { permission, requestPermission } = useNotifications();
  
  <button
    onClick={requestPermission}
    className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
      permission === 'granted' 
        ? 'bg-green-100 text-green-800'
        : permission === 'denied'
        ? 'bg-red-100 text-red-800'
        : 'bg-orange-500 text-white hover:bg-orange-600'
    )}
  >
    🔔 {
      permission === 'granted' ? 'Notifications On' :
      permission === 'denied' ? 'Notifications Blocked' :
      'Enable Notifications'
    }
  </button>
  ```

- [ ] Add responsive styling (mobile-friendly)
- [ ] Add aria-label for accessibility
- [ ] Test permission flow (default → prompt → granted/denied)

#### 4.2 Activate Polling
**File**: `app/page.tsx`

- [ ] Import `useNotificationPolling` hook
- [ ] Check permission status before enabling polling:
  ```typescript
  const { permission } = useNotifications();
  useNotificationPolling(permission === 'granted');
  ```

- [ ] Test polling starts/stops based on permission

#### 4.3 Reminder Selector Component
**File**: `app/page.tsx` (add to TodoForm)

- [ ] Define reminder options constant:
  ```typescript
  const REMINDER_OPTIONS = [
    { label: 'None', value: null },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
    { label: '2 days before', value: 2880 },
    { label: '1 week before', value: 10080 },
  ];
  ```

- [ ] Add reminder state to form:
  ```typescript
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  ```

- [ ] Add dropdown in todo form (below due date picker):
  ```tsx
  <label className="block text-sm font-medium mb-2">
    Reminder
  </label>
  <select
    value={reminderMinutes ?? ''}
    onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : null)}
    disabled={!dueDate}  // Require due date
    className="w-full border rounded-lg px-3 py-2"
  >
    {REMINDER_OPTIONS.map(opt => (
      <option key={opt.label} value={opt.value ?? ''}>
        {opt.label}
      </option>
    ))}
  </select>
  ```

- [ ] Update form submission to include `reminder_minutes`
- [ ] Update edit modal to include reminder selector
- [ ] Add validation: reminder only if due date exists

#### 4.4 Reminder Badge Display
**File**: `app/page.tsx` (TodoItem component)

- [ ] Create `formatReminderBadge` utility:
  ```typescript
  function formatReminderBadge(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${minutes / 60}h`;
    if (minutes < 10080) return `${minutes / 1440}d`;
    return `${minutes / 10080}w`;
  }
  ```

- [ ] Add badge display in todo item (after priority badge):
  ```tsx
  {todo.reminder_minutes && (
    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
      🔔 {formatReminderBadge(todo.reminder_minutes)}
    </span>
  )}
  ```

- [ ] Style badge for dark mode compatibility
- [ ] Ensure badge appears in all sections (Overdue, Active, Completed)

---

### Phase 5: Testing (60-90 minutes)

#### 5.1 Manual Testing
- [ ] **Permission Flow**:
  - Click "Enable Notifications" → Verify browser prompt
  - Grant permission → Verify button shows "Notifications On"
  - Deny permission → Verify button shows "Notifications Blocked"
  - Reset permission in browser settings → Test again

- [ ] **Create Todo with Reminder**:
  - Create todo with due date in 5 minutes
  - Set reminder to "15 minutes before" → Should be disabled (past)
  - Set reminder to "None" → Should work
  - Create todo with due date in 20 minutes, reminder "15 minutes before" → Should work

- [ ] **Notification Delivery**:
  - Set system clock forward to reminder time (or use short due date)
  - Wait 60 seconds for poll
  - Verify browser notification appears
  - Verify notification shows correct title and time
  - Click notification → Verify window focuses

- [ ] **Duplicate Prevention**:
  - After notification sent, verify no duplicate in next poll
  - Check `last_notification_sent` in database

- [ ] **Recurring Todo Integration**:
  - Create recurring todo with reminder
  - Complete todo → Verify next instance created
  - Verify next instance has same `reminder_minutes`
  - Verify next instance has `last_notification_sent = null`

#### 5.2 E2E Tests (Optional but Recommended)
**File**: `tests/06-reminders-notifications.spec.ts` (NEW)

- [ ] Test: Request notification permission
- [ ] Test: Create todo with reminder
- [ ] Test: Edit reminder on existing todo
- [ ] Test: Reminder badge displays correctly
- [ ] Test: Notification sent at correct time (use virtual time)
- [ ] Test: No duplicate notifications
- [ ] Test: Recurring todo inherits reminder

**Key Testing Pattern**:
```typescript
// Use Playwright's clock manipulation
await page.clock.install({ time: new Date() });
await page.clock.fastForward('15:00'); // Fast-forward 15 minutes
```

#### 5.3 Edge Cases to Test
- [ ] Todo without due date → Reminder dropdown disabled
- [ ] Reminder longer than time until due → Validation or warning
- [ ] Multiple todos with same reminder time → All notifications sent
- [ ] Notification permission denied → Polling still works (silent fail)
- [ ] Browser doesn't support notifications → Graceful degradation
- [ ] User navigates away → Polling continues in background
- [ ] Tab closed and reopened → Polling restarts

---

### Phase 6: Documentation Updates (30 minutes)

#### 6.1 Update User Guide
**File**: `USER_GUIDE.md` (Section 6 already exists)

- [ ] Verify section 6 matches implemented behavior
- [ ] Add screenshots if needed
- [ ] Update any discrepancies

#### 6.2 Code Documentation
- [ ] Add JSDoc comments to new hooks
- [ ] Add inline comments for complex logic (reminder calculation)
- [ ] Update `README.md` if setup instructions changed

#### 6.3 Update Evaluation Checklist
**File**: `EVALUATION.md`

- [ ] Check off PRP 04 implementation items
- [ ] Update status to "Complete" when all tests pass

---

## Acceptance Criteria Verification

Before marking complete, verify all acceptance criteria from PRP 04:

- [ ] ✅ User can request notification permission
- [ ] ✅ User can set reminder when creating todo (if due date set)
- [ ] ✅ User can change reminder on existing todo
- [ ] ✅ Browser notification appears at correct time (due_date - reminder_offset)
- [ ] ✅ Notification shows todo title and time remaining
- [ ] ✅ Clicking notification focuses app and navigates to todo
- [ ] ✅ Duplicate notifications prevented (once per todo)
- [ ] ✅ Recurring todos: Next instance inherits reminder offset (not absolute time)
- [ ] ✅ Completed todos don't send notifications

---

## Technical Considerations

### Singapore Timezone
- **CRITICAL**: All reminder calculations MUST use `getSingaporeNow()` from `lib/timezone.ts`
- Due date comparison: `new Date(todo.due_date).getTime() - (todo.reminder_minutes * 60 * 1000) <= getSingaporeNow().getTime()`

### Performance Optimization
- Query optimization: Composite index on `(reminder_minutes, due_date)` for fast lookups
- Polling interval: 60 seconds balances responsiveness and battery life
- Batch limit: Consider limiting to 5 notifications per poll to prevent spam

### Browser Compatibility
- Check `'Notification' in window` before using API
- Fallback: Disable reminder feature gracefully if unsupported
- Test on: Chrome, Firefox, Safari, Edge

### Security & Privacy
- Notifications show only todo title (no sensitive metadata)
- Permission required: User must explicitly grant
- Server-side validation: Verify reminder_minutes is valid value

---

## Common Issues & Solutions

### Issue: Notifications not appearing
**Solutions**:
1. Check permission status: `Notification.permission`
2. Verify browser notifications enabled in OS settings
3. Check polling is active (use console.log in hook)
4. Verify API endpoint returns reminders

### Issue: Duplicate notifications
**Solutions**:
1. Check `last_notification_sent` is being set correctly
2. Verify database query excludes already-notified todos
3. Use notification `tag` to prevent browser-level duplicates

### Issue: Reminder dropdown disabled
**Solutions**:
1. Ensure due date is set first
2. Check `disabled={!dueDate}` logic in select element

### Issue: Wrong notification time
**Solutions**:
1. Verify Singapore timezone usage in calculations
2. Check client vs server time sync
3. Test reminder offset calculation: `due_date - (reminder_minutes * 60 * 1000)`

---

## Post-Implementation Checklist

- [ ] All acceptance criteria verified
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Code reviewed (self-review or peer)
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Accessibility verified (keyboard navigation, screen reader)
- [ ] Dark mode compatibility checked
- [ ] Mobile responsiveness tested
- [ ] Production build successful (`npm run build`)

---

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Database Layer | 30-45 min |
| 2 | API Layer | 30-45 min |
| 3 | Notification Hooks | 45-60 min |
| 4 | UI Components | 60-90 min |
| 5 | Testing | 60-90 min |
| 6 | Documentation | 30 min |
| **Total** | | **4-6 hours** |

*Note: Times are estimates for experienced developers familiar with the codebase*

---

## Next Steps

After completing PRP 04, consider:
1. **PRP 05 (Subtasks)**: Adds checklist functionality
2. **PRP 07 (Templates)**: Save todo patterns with reminders
3. **Enhancements** (out of scope for PRP 04):
   - Multiple reminders per todo
   - Snooze functionality
   - Email/SMS notifications
   - Push notifications with service worker

---

**Created**: 2026-02-06  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Based on**: PRPs/04-reminders-notifications.md
