# Testing Guide: Reminders & Notifications (PRP 04)

## Test Strategy Overview

This guide provides comprehensive test cases for the Reminders & Notifications feature. Tests are organized by type: manual testing, E2E testing, and edge case testing.

---

## Quick Test Checklist

### Pre-Testing Setup
- [ ] Development server running (`npm run dev`)
- [ ] Database migrated with new columns
- [ ] Browser supports Notification API (Chrome, Firefox, Safari, Edge)
- [ ] Test user registered and logged in

### Core Functionality (10 minutes)
- [ ] Permission request works
- [ ] Reminder can be set on new todo
- [ ] Reminder badge displays correctly
- [ ] Notification appears at correct time
- [ ] No duplicate notifications
- [ ] Recurring todo inherits reminder

### Edge Cases (5 minutes)
- [ ] Reminder disabled without due date
- [ ] Past reminder validation
- [ ] Multiple simultaneous reminders
- [ ] Permission denied handling
- [ ] Browser compatibility

---

## Manual Testing Guide

### Test Case 1: Notification Permission Flow

**Objective**: Verify permission request and state management

**Steps**:
1. Open app in browser
2. Locate "Enable Notifications" button in header/nav
3. Verify button shows orange background
4. Click button
5. Browser prompt appears
6. Click "Allow" on prompt

**Expected Results**:
- ✅ Button changes to "Notifications On" with green background
- ✅ Button shows 🔔 icon
- ✅ No errors in console

**Test Permission Denied**:
1. Reset permission in browser: Settings → Privacy → Notifications → Reset
2. Repeat steps 1-5
3. Click "Block" on prompt

**Expected Results**:
- ✅ Button shows "Notifications Blocked" with red background
- ✅ Help message or link appears
- ✅ Reminder dropdowns still work (graceful degradation)

---

### Test Case 2: Create Todo with Reminder

**Objective**: Verify reminder can be set during todo creation

**Steps**:
1. Fill todo title: "Team meeting"
2. Set priority: "High"
3. Set due date: Tomorrow at 2:00 PM
4. Verify reminder dropdown is **enabled**
5. Select "1 day before" from reminder dropdown
6. Click "Add" button

**Expected Results**:
- ✅ Todo appears in list
- ✅ Todo shows 🔔1d badge
- ✅ Badge is blue/cyan color
- ✅ Badge positioned after priority badge

**Test Without Due Date**:
1. Fill todo title: "Review code"
2. Leave due date empty
3. Verify reminder dropdown is **disabled**
4. Attempt to select reminder (should not work)

**Expected Results**:
- ✅ Dropdown shows "None" and is grayed out
- ✅ Cannot select other options
- ✅ Todo created without reminder

---

### Test Case 3: Edit Reminder on Existing Todo

**Objective**: Verify reminder can be changed after todo creation

**Steps**:
1. Create todo with reminder "1 hour before"
2. Verify badge shows 🔔1h
3. Click "Edit" button on todo
4. Change reminder to "2 days before"
5. Click "Update"

**Expected Results**:
- ✅ Badge updates to 🔔2d
- ✅ Database updated (check `reminder_minutes = 2880`)
- ✅ No duplicate todos created

**Test Remove Reminder**:
1. Edit same todo
2. Change reminder dropdown to "None"
3. Click "Update"

**Expected Results**:
- ✅ Badge disappears
- ✅ Database shows `reminder_minutes = NULL`

---

### Test Case 4: Notification Delivery

**Objective**: Verify notification appears at correct time

**Method 1: Fast Test (Recommended)**
1. Create todo with due date 5 minutes from now
2. Set reminder to "15 minutes before"
3. Verify dropdown is disabled or shows validation (can't set reminder in past)

**Expected Results**:
- ✅ System prevents setting invalid reminder
- ✅ User sees validation message or disabled state

**Method 2: Real-Time Test**
1. Create todo with due date 20 minutes from now
2. Set reminder to "15 minutes before"
3. Ensure notifications enabled
4. Keep browser tab open (can be in background)
5. Wait 5 minutes

**Expected Results**:
- ✅ After ~5 minutes (max 6 due to polling), notification appears
- ✅ Notification title: "📋 Todo Reminder"
- ✅ Notification body: "{todo_title} is due in {time}"
- ✅ Notification shows app icon
- ✅ Notification persists until clicked/dismissed

**Method 3: Developer Tools (Advanced)**
```javascript
// In browser console
// 1. Create todo with future due date
// 2. Manually trigger notification check
fetch('/api/notifications/check')
  .then(r => r.json())
  .then(console.log);

// 3. If todo is ready, you'll see it in response
// 4. Verify notification appears
```

---

### Test Case 5: Notification Click Behavior

**Objective**: Verify clicking notification focuses the app

**Steps**:
1. Create todo with short-term reminder (as in Test Case 4)
2. Switch to different browser tab or minimize window
3. Wait for notification to appear
4. Click notification

**Expected Results**:
- ✅ Browser focuses the todo app window/tab
- ✅ Notification closes automatically
- ✅ (Optional) App scrolls to the specific todo

---

### Test Case 6: Duplicate Prevention

**Objective**: Verify notification sent only once per todo

**Steps**:
1. Create todo with reminder
2. Wait for notification to appear (or manually trigger)
3. Keep browser open for additional 2+ minutes
4. Observe network tab polling `/api/notifications/check`

**Expected Results**:
- ✅ Only ONE notification appears for the todo
- ✅ Subsequent polls return empty `reminders: []`
- ✅ Database `last_notification_sent` is set (check with SQLite)

**Verification Query**:
```sql
SELECT id, title, last_notification_sent FROM todos WHERE reminder_minutes IS NOT NULL;
```

---

### Test Case 7: Recurring Todo Integration

**Objective**: Verify next recurring instance inherits reminder

**Steps**:
1. Create recurring todo:
   - Title: "Weekly standup"
   - Due date: Next Monday 10:00 AM
   - Recurrence: "Weekly"
   - Reminder: "1 day before"
2. Verify todo shows 🔄 and 🔔 badges
3. Mark todo as complete
4. Verify next instance created

**Expected Results**:
- ✅ Next instance has due date 7 days later
- ✅ Next instance has `reminder_minutes = 1440` (same offset)
- ✅ Next instance has `last_notification_sent = NULL` (reset)
- ✅ Next instance shows 🔔1d badge

**Database Verification**:
```sql
SELECT id, title, due_date, reminder_minutes, last_notification_sent 
FROM todos 
WHERE title = 'Weekly standup' 
ORDER BY due_date DESC;
```

---

### Test Case 8: Reminder Badge Display

**Objective**: Verify badge formatting for all reminder options

**Test Data**:
| Reminder Minutes | Expected Badge |
|------------------|----------------|
| 15               | 🔔15m         |
| 30               | 🔔30m         |
| 60               | 🔔1h          |
| 120              | 🔔2h          |
| 1440             | 🔔1d          |
| 2880             | 🔔2d          |
| 10080            | 🔔1w          |

**Steps**:
1. Create 7 todos, each with different reminder
2. Verify badge displays correct format

**Expected Results**:
- ✅ All badges show correct abbreviation
- ✅ Badge colors consistent (blue/cyan)
- ✅ Badge readable in light and dark mode

---

### Test Case 9: Multiple Simultaneous Reminders

**Objective**: Verify system handles multiple due reminders

**Steps**:
1. Create 5 todos with same due date
2. Set all reminders to "15 minutes before"
3. Wait for reminder time
4. Observe notifications

**Expected Results**:
- ✅ All 5 notifications appear
- ✅ Notifications may stack or appear sequentially
- ✅ Each notification has correct todo title
- ✅ All marked as sent in database

**Note**: If more than 5 notifications, check if batch limiting is implemented (per PRP spec)

---

## E2E Testing with Playwright

### Test File: `tests/06-reminders-notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers';

test.describe('Reminders & Notifications', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    await auth.register();
  });

  test('should request notification permission', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);

    // Click enable button
    await page.click('text=Enable Notifications');

    // Verify button state changed
    await expect(page.locator('text=Notifications On')).toBeVisible();
  });

  test('should create todo with reminder', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.click('text=Enable Notifications');

    // Fill todo form
    await page.fill('[placeholder="What needs to be done?"]', 'Test reminder');
    
    // Set due date (20 minutes from now)
    const futureDate = new Date(Date.now() + 20 * 60 * 1000);
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));
    
    // Select reminder
    await page.selectOption('select[name="reminder"]', '15'); // 15 minutes
    
    // Submit
    await page.click('button:has-text("Add")');

    // Verify badge appears
    await expect(page.locator('text=🔔15m')).toBeVisible();
  });

  test('should disable reminder dropdown without due date', async ({ page }) => {
    // No due date set
    await page.fill('[placeholder="What needs to be done?"]', 'No date todo');

    // Reminder dropdown should be disabled
    const dropdown = page.locator('select[name="reminder"]');
    await expect(dropdown).toBeDisabled();
  });

  test('should edit reminder on existing todo', async ({ page }) => {
    // Create todo with reminder
    await page.fill('[placeholder="What needs to be done?"]', 'Edit reminder test');
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));
    await page.selectOption('select[name="reminder"]', '1440'); // 1 day
    await page.click('button:has-text("Add")');

    // Verify initial badge
    await expect(page.locator('text=🔔1d')).toBeVisible();

    // Edit todo
    await page.click('[aria-label="Edit todo"]');
    await page.selectOption('select[name="reminder"]', '2880'); // 2 days
    await page.click('button:has-text("Update")');

    // Verify badge updated
    await expect(page.locator('text=🔔2d')).toBeVisible();
    await expect(page.locator('text=🔔1d')).not.toBeVisible();
  });

  test('should send notification at reminder time', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.click('text=Enable Notifications');

    // Create todo with very short due time for testing
    await page.fill('[placeholder="What needs to be done?"]', 'Urgent task');
    const futureDate = new Date(Date.now() + 16 * 60 * 1000); // 16 min from now
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));
    await page.selectOption('select[name="reminder"]', '15'); // 15 minutes
    await page.click('button:has-text("Add")');

    // Fast-forward time by 1 minute (when reminder should trigger)
    await page.clock.install({ time: new Date() });
    await page.clock.fastForward('01:00'); // 1 minute

    // Wait for polling interval (max 60s)
    await page.waitForTimeout(2000); // In real test, poll immediately

    // Verify notification sent (check database or API call)
    const response = await page.request.get('/api/notifications/check');
    const data = await response.json();
    expect(data.reminders).toHaveLength(1);
    expect(data.reminders[0].title).toBe('Urgent task');
  });

  test('should prevent duplicate notifications', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.click('text=Enable Notifications');

    // Create and trigger notification
    // (Setup similar to previous test)
    
    // Call API twice
    const response1 = await page.request.get('/api/notifications/check');
    const data1 = await response1.json();
    
    const response2 = await page.request.get('/api/notifications/check');
    const data2 = await response2.json();

    // First call should have reminder, second should be empty
    expect(data1.reminders.length).toBeGreaterThan(0);
    expect(data2.reminders).toHaveLength(0);
  });

  test('should inherit reminder in recurring todo', async ({ page }) => {
    // Create recurring todo with reminder
    await page.fill('[placeholder="What needs to be done?"]', 'Weekly meeting');
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));
    await page.check('[name="is_recurring"]');
    await page.selectOption('select[name="recurrence_pattern"]', 'weekly');
    await page.selectOption('select[name="reminder"]', '1440'); // 1 day
    await page.click('button:has-text("Add")');

    // Complete the todo
    await page.click('[aria-label="Mark as complete"]');

    // Verify next instance has same reminder
    const todos = page.locator('[data-testid="todo-item"]');
    await expect(todos).toHaveCount(1); // New instance created
    await expect(page.locator('text=🔔1d')).toBeVisible();
  });
});
```

---

## Edge Cases & Error Handling

### Edge Case 1: Reminder Time Already Passed

**Scenario**: User tries to set reminder for time that's already past

**Test Steps**:
1. Set due date to 1 hour from now
2. Try to select "2 hours before" reminder

**Expected Behavior**:
- Option A: Dropdown validates and shows error
- Option B: Dropdown allows but notification never sends (past time)
- **Recommended**: Option A (prevent invalid state)

**Implementation**:
```typescript
const validateReminder = (dueDate: Date, reminderMinutes: number): boolean => {
  const reminderTime = dueDate.getTime() - (reminderMinutes * 60 * 1000);
  return reminderTime > Date.now();
};
```

---

### Edge Case 2: Browser Doesn't Support Notifications

**Scenario**: Old browser or notification API blocked

**Test Steps**:
1. Open app in browser with notifications disabled
2. Check if "Enable Notifications" button appears

**Expected Behavior**:
- ✅ Check `'Notification' in window` before showing button
- ✅ If unsupported, hide button or show warning
- ✅ Reminder dropdown still works (silent fail)

**Test Code**:
```javascript
// In browser console
delete window.Notification;
// Reload page
// Verify app still works
```

---

### Edge Case 3: Permission Denied After Enabling

**Scenario**: User enables, then revokes permission in OS/browser

**Test Steps**:
1. Grant permission
2. Go to browser settings → Revoke notification permission
3. Return to app

**Expected Behavior**:
- ✅ App detects permission change on next interaction
- ✅ Button updates to "Notifications Blocked"
- ✅ No errors thrown

---

### Edge Case 4: Tab Closed During Polling

**Scenario**: User closes tab, then reopens

**Test Steps**:
1. Enable notifications and create reminders
2. Close browser tab
3. Reopen app before reminder time
4. Wait for reminder time

**Expected Behavior**:
- ✅ Polling restarts on page load
- ✅ Notification still sent if tab is open at reminder time
- ✅ If tab closed at reminder time, notification not sent (expected)

---

### Edge Case 5: Completed Todo with Pending Reminder

**Scenario**: Todo completed before reminder time

**Test Steps**:
1. Create todo with reminder
2. Mark as complete before reminder time
3. Wait for reminder time
4. Check if notification sent

**Expected Behavior**:
- ✅ Query filters `WHERE completed = 0`
- ✅ No notification sent for completed todo
- ✅ Verify in database query

---

### Edge Case 6: Network Failure During API Call

**Scenario**: `/api/notifications/check` fails

**Test Steps**:
1. Enable notifications
2. Use browser devtools → Network → Offline
3. Wait for polling interval
4. Go back online

**Expected Behavior**:
- ✅ Hook catches fetch error
- ✅ Error logged to console
- ✅ Polling continues on next interval
- ✅ No UI breakage

---

## Performance Testing

### Test: Query Performance with Large Dataset

**Setup**:
```sql
-- Insert 10,000 todos
INSERT INTO todos (user_id, title, due_date, reminder_minutes, completed)
SELECT 1, 'Todo ' || n, datetime('now', '+' || n || ' hours'), 15, 0
FROM (SELECT value AS n FROM generate_series(1, 10000));
```

**Test**:
```sql
EXPLAIN QUERY PLAN
SELECT * FROM todos 
WHERE user_id = 1 
  AND completed = 0 
  AND reminder_minutes IS NOT NULL 
  AND datetime(due_date, '-' || reminder_minutes || ' minutes') <= datetime('now');
```

**Expected**:
- ✅ Query uses `idx_todos_reminder` index
- ✅ Query time < 10ms
- ✅ SCAN count low (not full table scan)

---

### Test: Polling Network Overhead

**Steps**:
1. Open browser devtools → Network tab
2. Enable notifications
3. Monitor requests over 5 minutes

**Expected**:
- ✅ 5 requests to `/api/notifications/check` (one per minute)
- ✅ Each request < 100 bytes
- ✅ Response time < 200ms
- ✅ No memory leaks (check browser task manager)

---

## Accessibility Testing

### Test: Keyboard Navigation

**Steps**:
1. Tab through form
2. Verify reminder dropdown reachable
3. Use arrow keys to select option
4. Press Enter to confirm

**Expected**:
- ✅ All elements reachable via Tab
- ✅ Dropdown works with arrow keys
- ✅ Focus indicators visible

---

### Test: Screen Reader Compatibility

**Tools**: NVDA (Windows), VoiceOver (Mac), JAWS

**Steps**:
1. Enable screen reader
2. Navigate to reminder dropdown
3. Listen to announcement

**Expected**:
- ✅ "Reminder, combo box, None selected"
- ✅ Reads each option when arrowing through
- ✅ Announces when selection changes

---

### Test: Color Contrast

**Tool**: Browser DevTools → Lighthouse → Accessibility

**Expected**:
- ✅ Reminder badge contrast ≥ 4.5:1
- ✅ Notification button contrast ≥ 4.5:1
- ✅ All text readable in light and dark mode

---

## Test Automation with CI/CD

### GitHub Actions Workflow

```yaml
name: E2E Tests - Reminders

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/06-reminders-notifications.spec.ts
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: playwright-report/
```

---

## Debugging Checklist

**Notification not appearing?**
- [ ] Check `Notification.permission === 'granted'`
- [ ] Check polling is active (look for network requests every 60s)
- [ ] Check API returns reminders: `curl http://localhost:3000/api/notifications/check`
- [ ] Check database: `SELECT * FROM todos WHERE last_notification_sent IS NULL`
- [ ] Check browser console for errors

**Badge not showing?**
- [ ] Check `todo.reminder_minutes` is not null
- [ ] Check `formatReminderBadge()` function
- [ ] Check CSS classes applied correctly

**Reminder dropdown disabled?**
- [ ] Check due date is set: `!!dueDate`
- [ ] Check `disabled` attribute logic

---

## Test Coverage Goals

- **E2E Tests**: 90%+ of user flows
- **API Tests**: 100% of endpoints
- **Hook Tests**: 95%+ of logic branches
- **Edge Cases**: All identified scenarios

---

**Created**: 2026-02-06  
**Version**: 1.0  
**Based on**: PRPs/04-reminders-notifications.md
