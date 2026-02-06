# Reminders & Notifications - Technical Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[User] -->|1. Clicks Enable| B[Permission Button]
        B -->|2. Requests| C[Browser Notification API]
        C -->|3. Grants| D[useNotifications Hook]
        
        D -->|4. Enabled| E[useNotificationPolling Hook]
        E -->|5. Poll every 60s| F[/api/notifications/check]
        
        G[TodoForm] -->|Set reminder| H[Reminder Dropdown]
        H -->|15m to 1w| I[reminder_minutes state]
        I -->|On submit| J[POST /api/todos]
        
        K[TodoItem] -->|Display| L[🔔 Reminder Badge]
    end
    
    subgraph "API Layer"
        F -->|Auth check| M[getSession]
        M -->|userId| N[todoDB.getDueReminders]
        
        J -->|Create todo| O[todoDB.create]
        O -->|Save| P[(todos table)]
        
        N -->|Query| P
        N -->|Due reminders| Q[Mark as sent]
        Q -->|Update| P
    end
    
    subgraph "Database Layer"
        P -->|Schema| R[reminder_minutes: number]
        P -->|Schema| S[last_notification_sent: string]
        P -->|Index| T[idx_todos_reminder]
    end
    
    subgraph "Notification Flow"
        F -->|Returns| U[{reminders: []}]
        U -->|For each| E
        E -->|Trigger| V[showNotification]
        V -->|Browser API| W[Browser Notification]
        W -->|Click| X[Focus window]
    end
    
    style B fill:#f9a825
    style C fill:#4caf50
    style E fill:#2196f3
    style F fill:#ff5722
    style P fill:#9c27b0
    style W fill:#4caf50
```

---

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant Hook as useNotificationPolling
    participant API as /api/notifications/check
    participant DB as Database
    participant Browser as Browser Notification API
    
    U->>UI: Create todo with reminder
    UI->>API: POST /api/todos
    API->>DB: INSERT todo with reminder_minutes
    DB-->>API: Success
    API-->>UI: Todo created
    
    Note over Hook: Every 60 seconds
    Hook->>API: GET /api/notifications/check
    API->>DB: SELECT due reminders
    Note over DB: WHERE due_date - reminder_minutes <= now<br/>AND last_notification_sent IS NULL
    DB-->>API: [todo1, todo2]
    
    loop For each reminder
        API->>DB: UPDATE last_notification_sent
    end
    
    API-->>Hook: {reminders: [todo1, todo2]}
    
    loop For each reminder
        Hook->>Browser: new Notification(title, body)
        Browser-->>U: Show notification
    end
    
    U->>Browser: Click notification
    Browser->>UI: Focus window
```

---

## State Machine: Notification Permission

```mermaid
stateDiagram-v2
    [*] --> Checking: Page Load
    
    Checking --> Default: Permission not set
    Checking --> Granted: Permission granted
    Checking --> Denied: Permission denied
    
    Default --> Prompting: User clicks "Enable Notifications"
    Prompting --> Granted: User allows
    Prompting --> Denied: User blocks
    
    Granted --> Polling: Start 60s interval
    Polling --> Granted: Continue polling
    
    Denied --> HelpMessage: Show instructions
    HelpMessage --> Default: User resets in browser
    
    Granted --> Checking: Page refresh
    Denied --> Checking: Page refresh
    
    note right of Polling
        Check /api/notifications/check
        Show browser notifications
        Continue until page closed
    end note
    
    note right of HelpMessage
        Display: "Enable in browser settings"
        Reminder UI remains disabled
    end note
```

---

## Component Architecture

```mermaid
graph LR
    subgraph "Layout (Global)"
        A[app/layout.tsx]
        A -->|Uses| B[useNotifications]
        A -->|Renders| C[Permission Button]
    end
    
    subgraph "Main Page"
        D[app/page.tsx]
        D -->|Uses| B
        D -->|Uses| E[useNotificationPolling]
        D -->|Renders| F[TodoForm]
        D -->|Renders| G[TodoList]
        
        F -->|Contains| H[Reminder Dropdown]
        G -->|Contains| I[TodoItem]
        I -->|Shows| J[🔔 Badge]
    end
    
    subgraph "Hooks"
        B -->|Manages| K[Permission State]
        B -->|Calls| L[Notification API]
        
        E -->|Polls| M[/api/notifications/check]
        E -->|Triggers| B
    end
    
    subgraph "API Routes"
        M -->|Reads| N[lib/db.ts]
        O[/api/todos] -->|Writes| N
        P[/api/todos/id] -->|Updates| N
    end
    
    style A fill:#1976d2
    style D fill:#1976d2
    style B fill:#ff9800
    style E fill:#ff9800
    style M fill:#4caf50
    style N fill:#9c27b0
```

---

## Database Schema Detail

```mermaid
erDiagram
    TODOS {
        int id PK
        int user_id FK
        string title
        datetime due_date
        int reminder_minutes "15, 30, 60, 120, 1440, 2880, 10080, NULL"
        string last_notification_sent "ISO timestamp, NULL"
        bool completed
        bool is_recurring
        string recurrence_pattern
    }
    
    USERS {
        int id PK
        string username
    }
    
    USERS ||--o{ TODOS : owns
    
    TODOS ||--o| NOTIFICATION_CHECK : triggers
    
    NOTIFICATION_CHECK {
        condition "due_date - reminder_minutes <= now"
        condition "last_notification_sent IS NULL"
        condition "completed = 0"
    }
```

**Index Strategy**:
```sql
CREATE INDEX idx_todos_reminder ON todos(reminder_minutes, due_date) 
  WHERE reminder_minutes IS NOT NULL AND completed = 0;
```
- **Why**: Speeds up query for due reminders
- **Filter**: Only incomplete todos with reminders
- **Columns**: Both used in WHERE clause

---

## Polling Mechanism Detail

```mermaid
graph TD
    A[useNotificationPolling enabled=true] -->|useEffect| B[Mount]
    B -->|Immediate| C[checkReminders]
    C -->|fetch| D[GET /api/notifications/check]
    
    B -->|setInterval 60000ms| E[Every 60 seconds]
    E -->|Call| C
    
    D -->|Response| F{Success?}
    F -->|Yes| G[Parse reminders]
    F -->|No| H[Log error]
    
    G -->|For each| I[showNotification]
    I -->|Browser API| J[Display notification]
    
    K[Component unmount] -->|clearInterval| L[Stop polling]
    
    style A fill:#2196f3
    style D fill:#ff5722
    style J fill:#4caf50
```

**Key Decisions**:
- **60 second interval**: Balance between responsiveness and battery/network
- **Immediate check on mount**: Don't wait 60s for first check
- **Error handling**: Silent fail, log to console, don't break UI
- **Cleanup**: Clear interval on unmount to prevent memory leaks

---

## Reminder Time Calculation

```mermaid
flowchart LR
    A[Todo Created] -->|due_date| B[2026-02-06 14:00]
    A -->|reminder_minutes| C[1440 min = 1 day]
    
    B -->|Subtract| D[Notification Time]
    C -->|Convert| E[1440 * 60 * 1000 ms]
    
    D -->|Calc| F[2026-02-05 14:00]
    
    G[Singapore Time Now] -->|Compare| H{now >= notification time?}
    H -->|Yes| I[Send notification]
    H -->|No| J[Wait for next poll]
    
    I -->|Update| K[last_notification_sent = now]
    
    style F fill:#4caf50
    style K fill:#9c27b0
```

**Formula**:
```typescript
const notificationTime = new Date(todo.due_date).getTime() - (todo.reminder_minutes * 60 * 1000);
const shouldNotify = getSingaporeNow().getTime() >= notificationTime 
  && todo.last_notification_sent === null;
```

---

## Recurring Todo Integration

```mermaid
flowchart TD
    A[User completes recurring todo] -->|PUT /api/todos/id| B{is_recurring?}
    B -->|No| C[Mark complete, done]
    B -->|Yes| D[Create next instance]
    
    D -->|Copy| E[reminder_minutes: 1440]
    D -->|Calculate| F[next_due_date]
    D -->|Reset| G[last_notification_sent: null]
    D -->|Copy| H[priority, tags, pattern]
    
    E -->|Relative offset| I[Next reminder time]
    F -->|Based on pattern| J[daily/weekly/monthly/yearly]
    
    I -->|Example| K[If due 2026-02-13,<br/>remind on 2026-02-12]
    
    style E fill:#ff9800
    style G fill:#4caf50
```

**Critical**: Reminder is a **relative offset**, not an absolute time!
- ❌ Wrong: Copy `last_notification_sent` from parent
- ✅ Correct: Copy `reminder_minutes`, reset `last_notification_sent = null`

---

## Error Handling Strategy

```mermaid
graph TD
    A[Potential Errors] --> B[Browser doesn't support Notification API]
    A --> C[User denies permission]
    A --> D[Fetch fails on /api/notifications/check]
    A --> E[Database query error]
    A --> F[Invalid reminder_minutes value]
    
    B -->|Solution| G[Check 'Notification' in window]
    G -->|False| H[Hide reminder UI]
    
    C -->|Solution| I[Show help message]
    I -->|Action| J[Link to browser settings]
    
    D -->|Solution| K[Silent fail + console.error]
    K -->|Result| L[Retry on next poll]
    
    E -->|Solution| M[API returns 500]
    M -->|Log| N[Server logs]
    
    F -->|Solution| O[Validate in API]
    O -->|Reject| P[Return 400 with error message]
    
    style H fill:#f44336
    style J fill:#ff9800
    style L fill:#4caf50
    style P fill:#f44336
```

---

## Security & Privacy Considerations

```mermaid
mindmap
    root((Reminders Security))
        Browser Permission
            Explicit user consent required
            Can be revoked anytime
            No auto-request
        Data Minimization
            Notification shows only title
            No sensitive metadata
            No todo ID visible
        Server-Side Validation
            Validate reminder_minutes range
            Check user owns todo
            Prevent injection attacks
        Privacy
            Client-side polling only
            No server push
            No external services
            No notification history stored
```

---

## Performance Optimization

```mermaid
graph LR
    A[Query Optimization] -->|Index| B[idx_todos_reminder]
    B -->|Covers| C[reminder_minutes, due_date]
    
    D[Polling Strategy] -->|Interval| E[60 seconds]
    E -->|Trade-off| F[Battery vs Responsiveness]
    
    G[Batch Limit] -->|Max| H[5 notifications per poll]
    H -->|Prevents| I[Notification spam]
    
    J[Database Query] -->|Filter| K[WHERE completed = 0]
    K -->|Reduces| L[Result set size]
    
    M[Prepared Statements] -->|Cache| N[Query plan]
    N -->|Faster| O[Repeated queries]
    
    style B fill:#4caf50
    style E fill:#ff9800
    style H fill:#2196f3
```

**Key Metrics**:
- Query time: < 10ms (with index)
- Polling overhead: ~1% CPU
- Network: ~100 bytes per poll
- Notification delay: 0-60 seconds (average 30s)

---

## Accessibility Features

```mermaid
graph TD
    A[Accessibility] --> B[Visual]
    A --> C[Keyboard]
    A --> D[Screen Reader]
    A --> E[Customization]
    
    B -->|Badge| F[High contrast colors]
    B -->|Notification| G[Persistent until dismissed]
    
    C -->|Button| H[Tab navigation]
    C -->|Dropdown| I[Arrow key selection]
    
    D -->|Button| J[aria-label: Enable notifications]
    D -->|Dropdown| K[aria-label: Reminder time]
    D -->|Badge| L[aria-label: Reminder set for X]
    
    E -->|System| M[Uses OS notification settings]
    E -->|Browser| N[Respects browser preferences]
    
    style F fill:#4caf50
    style H fill:#2196f3
    style J fill:#ff9800
```

**WCAG 2.1 AA Compliance**:
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Keyboard accessible
- ✅ Screen reader friendly
- ✅ No time-based auto-actions (user triggers notification enable)

---

## Testing Strategy

```mermaid
graph TB
    A[Testing Pyramid] --> B[E2E Tests]
    A --> C[Integration Tests]
    A --> D[Unit Tests]
    
    B -->|Playwright| E[Full user flow]
    E -->|Test| F[Permission request]
    E -->|Test| G[Create todo with reminder]
    E -->|Test| H[Notification appears]
    E -->|Test| I[Click notification]
    
    C -->|API Tests| J[GET /api/notifications/check]
    J -->|Mock| K[Database queries]
    J -->|Verify| L[Response structure]
    
    D -->|Hook Tests| M[useNotifications]
    M -->|Test| N[Permission state]
    M -->|Test| O[showNotification call]
    
    D -->|Util Tests| P[formatReminderBadge]
    P -->|Input| Q[15, 60, 1440, 10080]
    P -->|Output| R[15m, 1h, 1d, 1w]
    
    style B fill:#4caf50
    style C fill:#ff9800
    style D fill:#2196f3
```

**Test Coverage Goals**:
- E2E: Full user journey (permission → create → notify)
- API: All endpoints + error cases
- Hooks: Permission states + polling behavior
- Utils: Time formatting + calculations

---

**Created**: 2026-02-06  
**Version**: 1.0  
**Based on**: PRPs/04-reminders-notifications.md
