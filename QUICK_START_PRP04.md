# Quick Start Guide: Reminders & Notifications (PRP 04)

## TL;DR - What You're Building
Add browser notifications that alert users 15 minutes to 1 week before todos are due.

**User Story**: "As a user, I want to receive a notification 1 day before my todo is due so I don't forget about it."

---

## 5-Minute Overview

### What Changes?
1. **Database**: Add 2 fields to `todos` table
2. **API**: 1 new endpoint to check due reminders
3. **Hooks**: 2 React hooks for notification management
4. **UI**: Reminder dropdown + permission button + bell badges

### File Checklist
```
✨ NEW FILES:
├── app/api/notifications/check/route.ts
├── lib/hooks/useNotifications.ts
└── lib/hooks/useNotificationPolling.ts

✏️  MODIFIED FILES:
├── lib/db.ts (add 2 fields + 2 methods)
├── app/layout.tsx (add permission button)
├── app/page.tsx (add reminder selector + badge)
└── app/api/todos/route.ts (include reminder in CRUD)
```

---

## Step-by-Step (30 Minutes)

### Step 1: Database (5 minutes)
**File**: `lib/db.ts`

Add to `Todo` interface:
```typescript
reminder_minutes: number | null;      // 15, 30, 60, 120, 1440, 2880, 10080
last_notification_sent: string | null; // ISO timestamp
```

Add migration:
```sql
ALTER TABLE todos ADD COLUMN reminder_minutes INTEGER;
ALTER TABLE todos ADD COLUMN last_notification_sent TEXT;
CREATE INDEX idx_todos_reminder ON todos(reminder_minutes, due_date) 
  WHERE reminder_minutes IS NOT NULL AND completed = 0;
```

Add methods:
```typescript
getDueReminders(userId: number, now: Date): Todo[]
markNotificationSent(todoId: number, timestamp: string): void
```

---

### Step 2: API Endpoint (5 minutes)
**File**: `app/api/notifications/check/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const now = getSingaporeNow();
  const reminders = todoDB.getDueReminders(session.userId, now);
  
  reminders.forEach(r => todoDB.markNotificationSent(r.id, now.toISOString()));
  
  return NextResponse.json({ reminders });
}
```

---

### Step 3: Notification Hook (5 minutes)
**File**: `lib/hooks/useNotifications.ts`

```typescript
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };
  
  const showNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };
  
  return { permission, requestPermission, showNotification };
}
```

---

### Step 4: Polling Hook (5 minutes)
**File**: `lib/hooks/useNotificationPolling.ts`

```typescript
export function useNotificationPolling(enabled: boolean) {
  const { showNotification } = useNotifications();
  
  useEffect(() => {
    if (!enabled) return;
    
    const check = async () => {
      const res = await fetch('/api/notifications/check');
      const { reminders } = await res.json();
      
      reminders.forEach((r: Todo) => {
        showNotification('📋 Todo Reminder', `${r.title} is due soon`);
      });
    };
    
    check(); // Immediate
    const id = setInterval(check, 60000); // Every 60s
    return () => clearInterval(id);
  }, [enabled]);
}
```

---

### Step 5: UI - Permission Button (5 minutes)
**File**: `app/layout.tsx`

```tsx
const { permission, requestPermission } = useNotifications();

<button onClick={requestPermission} className="...">
  🔔 {permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
</button>
```

Enable polling in `app/page.tsx`:
```typescript
const { permission } = useNotifications();
useNotificationPolling(permission === 'granted');
```

---

### Step 6: UI - Reminder Selector (5 minutes)
**File**: `app/page.tsx`

Add to todo form (below due date):
```tsx
<select 
  value={reminderMinutes ?? ''} 
  onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : null)}
  disabled={!dueDate}
>
  <option value="">None</option>
  <option value="15">15 minutes before</option>
  <option value="30">30 minutes before</option>
  <option value="60">1 hour before</option>
  <option value="120">2 hours before</option>
  <option value="1440">1 day before</option>
  <option value="2880">2 days before</option>
  <option value="10080">1 week before</option>
</select>
```

Add badge to todo item:
```tsx
{todo.reminder_minutes && (
  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
    🔔 {formatReminderBadge(todo.reminder_minutes)}
  </span>
)}
```

---

## Testing (5 Minutes)

### Manual Test
1. Click "Enable Notifications" → Grant permission
2. Create todo with due date 5 minutes from now
3. Set reminder to "15 minutes before" → Should be disabled (already past)
4. Create todo with due date 20 minutes from now
5. Set reminder to "15 minutes before"
6. Wait 5 minutes → Notification should appear

### Quick Verification
```bash
# Check database has new columns
sqlite3 todos.db "PRAGMA table_info(todos);"

# Check API endpoint works
curl http://localhost:3000/api/notifications/check -H "Cookie: session=..."

# Check notification permission
# In browser console:
Notification.permission
```

---

## Common Gotchas

1. **❌ Reminder not working?**
   - Check permission granted: `Notification.permission === 'granted'`
   - Check polling enabled: Look for network requests every 60s
   - Check reminder time: Must be in future

2. **❌ Duplicate notifications?**
   - Verify `last_notification_sent` being set in database
   - Check query excludes already-notified todos

3. **❌ Wrong timezone?**
   - Use `getSingaporeNow()` from `lib/timezone.ts` everywhere
   - Don't use `new Date()` directly

4. **❌ Reminder dropdown disabled?**
   - Due date must be set first
   - Check `disabled={!dueDate}` logic

---

## Success Criteria

You're done when:
- [x] Permission button changes "Enable Notifications" → "Notifications On"
- [x] Reminder dropdown appears when due date set
- [x] Bell badge (🔔) shows on todos with reminders
- [x] Browser notification appears at correct time
- [x] Clicking notification focuses the app
- [x] No duplicate notifications sent
- [x] Recurring todos inherit reminder offset

---

## Next Steps

After completing:
1. Run E2E tests: `npx playwright test tests/06-reminders-notifications.spec.ts`
2. Test on mobile (responsive design)
3. Test in dark mode
4. Update `EVALUATION.md` checklist

---

## Need Help?

**Full details**: See `IMPLEMENTATION_PLAN_PRP04.md`  
**Architecture**: See `PRPs/04-reminders-notifications.md`  
**User docs**: See `USER_GUIDE.md` section 6

---

**Quick Reference Card**
```
Database:   + reminder_minutes, last_notification_sent
API:        + GET /api/notifications/check
Hooks:      + useNotifications, useNotificationPolling
UI:         + Permission button, reminder dropdown, 🔔 badge
Poll:       Every 60 seconds when permission granted
Timing:     due_date - reminder_minutes = notification time
```

---

**Created**: 2026-02-06  
**Est. Time**: 30 minutes (with existing codebase)  
**Complexity**: Medium  
**Dependencies**: Todo CRUD, Priority, Recurring
