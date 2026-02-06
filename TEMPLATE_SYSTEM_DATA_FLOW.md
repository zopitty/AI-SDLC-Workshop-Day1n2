# Template System - Data Flow Diagrams

Visual diagrams to help understand the Template System architecture and data flow.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    React Components (app/page.tsx)            │   │
│  │                                                                │   │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐ │   │
│  │  │SaveTemplate  │  │UseTemplate      │  │TemplateCard     │ │   │
│  │  │Modal         │  │Modal            │  │Component        │ │   │
│  │  └──────────────┘  └─────────────────┘  └─────────────────┘ │   │
│  │                                                                │   │
│  │  State:                                                        │   │
│  │  - templates: Template[]                                      │   │
│  │  - saveTemplateModalOpen: boolean                             │   │
│  │  - useTemplateModalOpen: boolean                              │   │
│  │  - selectedTodoForTemplate: Todo | null                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                               ↕ HTTP (fetch)
┌──────────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js Server)                     │
│                                                                       │
│  GET    /api/templates              → List user's templates          │
│  POST   /api/templates              → Create new template            │
│  GET    /api/templates/[id]         → Get single template            │
│  PUT    /api/templates/[id]         → Update template                │
│  DELETE /api/templates/[id]         → Delete template                │
│  POST   /api/templates/[id]/use     → Create todo from template      │
│                                                                       │
│  Authentication: getSession() from lib/auth.ts                       │
│  Timezone: getSingaporeNow() from lib/timezone.ts                    │
└──────────────────────────────────────────────────────────────────────┘
                               ↕ SQL (better-sqlite3)
┌──────────────────────────────────────────────────────────────────────┐
│                     Database Layer (lib/db.ts)                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ templateDB Object                                               │ │
│  │  - create(userId, data) → number                                │ │
│  │  - get(id, userId) → Template | null                            │ │
│  │  - list(userId) → Template[]                                    │ │
│  │  - update(id, userId, data) → boolean                           │ │
│  │  - delete(id, userId) → boolean                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ templateTagDB Object                                            │ │
│  │  - assign(templateId, tagId) → void                             │ │
│  │  - remove(templateId, tagId) → void                             │ │
│  │  - getTags(templateId) → Tag[]                                  │ │
│  │  - clearAll(templateId) → void                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               ↕ SQL
┌──────────────────────────────────────────────────────────────────────┐
│                   SQLite Database (todos.db)                         │
│                                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │  templates   │────╳│template_tags │╳────│     tags     │        │
│  │              │     │              │     │              │        │
│  │ id           │     │ template_id  │     │ id           │        │
│  │ user_id      │     │ tag_id       │     │ name         │        │
│  │ name         │     └──────────────┘     │ color        │        │
│  │ title        │                          └──────────────┘        │
│  │ priority     │                                                   │
│  │ subtasks_json│                          ┌──────────────┐        │
│  │ offset_days  │                          │    users     │        │
│  │ created_at   │                          │              │        │
│  └──────────────┘                          │ id           │        │
│        │                                    │ username     │        │
│        └────────────────────────────────────│              │        │
│                   (user_id FK)              └──────────────┘        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Save Template Flow

```
┌──────┐                                                    ┌─────────┐
│ User │                                                    │Database │
└───┬──┘                                                    └────┬────┘
    │                                                            │
    │ 1. Click "Save as Template" on Todo                       │
    │                                                            │
    ▼                                                            │
┌────────────────────┐                                          │
│SaveTemplateModal   │                                          │
│                    │                                          │
│ [Template Name]    │                                          │
│ [Due Date Offset]  │                                          │
│ [Preview]          │                                          │
│ [Save] [Cancel]    │                                          │
└────────────────────┘                                          │
    │                                                            │
    │ 2. User fills form and clicks "Save"                      │
    │                                                            │
    ▼                                                            │
┌────────────────────────────────────────────────────────────┐  │
│ handleSaveTemplate(name, offsetDays)                       │  │
│                                                             │  │
│ 1. Serialize subtasks to JSON                              │  │
│    subtasks = [{title, position}, ...]                     │  │
│                                                             │  │
│ 2. Collect tag IDs                                          │  │
│    tagIds = [1, 3, 5]                                       │  │
│                                                             │  │
│ 3. POST /api/templates                                      │  │
│    body: {                                                  │  │
│      name: "Weekly Report",                                 │  │
│      title: todo.title,                                     │  │
│      priority: todo.priority,                               │  │
│      subtasks: subtasks,                                    │  │
│      tag_ids: tagIds,                                       │  │
│      due_date_offset_days: 7                                │  │
│    }                                                         │  │
└─────────────────────────────────┬──────────────────────────┘  │
                                  │                              │
                                  ▼                              │
                        ┌──────────────────────┐                 │
                        │POST /api/templates   │                 │
                        │                      │                 │
                        │ 1. getSession()      │                 │
                        │ 2. Validate input    │                 │
                        │ 3. JSON.stringify()  │                 │
                        │ 4. Create template───┼────────────────►│
                        │ 5. Assign tags───────┼────────────────►│
                        │ 6. Return template   │                 │
                        └──────────┬───────────┘                 │
                                   │                              │
                                   │ Response: {template: {...}}  │
                                   │                              │
                                   ▼                              │
                        ┌──────────────────────┐                 │
                        │ Close modal          │                 │
                        │ Show success message │                 │
                        │ Refresh templates    │                 │
                        └──────────────────────┘                 │
```

---

## Use Template Flow

```
┌──────┐                                                    ┌─────────┐
│ User │                                                    │Database │
└───┬──┘                                                    └────┬────┘
    │                                                            │
    │ 1. Click "Use Template" button                            │
    │                                                            │
    ▼                                                            │
┌────────────────────┐                                          │
│ Fetch templates    │                                          │
│ GET /api/templates │──────────────────────────────────────────►
└─────────┬──────────┘                                          │
          │                                                      │
          │ Response: {templates: [...]}                        │
          ◄──────────────────────────────────────────────────────
          │                                                      │
          ▼                                                      │
┌────────────────────┐                                          │
│UseTemplateModal    │                                          │
│                    │                                          │
│ ┌────────────────┐ │                                          │
│ │ Template 1     │ │                                          │
│ │ [Use Template] │ │                                          │
│ └────────────────┘ │                                          │
│ ┌────────────────┐ │                                          │
│ │ Template 2     │ │                                          │
│ │ [Use Template] │ │                                          │
│ └────────────────┘ │                                          │
└────────────────────┘                                          │
          │                                                      │
          │ 2. User clicks "Use Template"                       │
          │                                                      │
          ▼                                                      │
┌──────────────────────────────────────────────────────┐        │
│ handleUseTemplate(templateId)                        │        │
│                                                       │        │
│ POST /api/templates/[id]/use                          │        │
└───────────────────────┬──────────────────────────────┘        │
                        │                                        │
                        ▼                                        │
              ┌─────────────────────────┐                       │
              │POST /api/templates/     │                       │
              │     [id]/use            │                       │
              │                         │                       │
              │ 1. Get session          │                       │
              │ 2. Get template─────────┼──────────────────────►│
              │                         │       Template        │
              │                         │◄──────────────────────┤
              │ 3. Calculate due date   │                       │
              │    now = getSingapore   │                       │
              │          Now()          │                       │
              │    now.setDate(         │                       │
              │      now.getDate() +    │                       │
              │      offset_days)       │                       │
              │                         │                       │
              │ 4. Create todo──────────┼──────────────────────►│
              │                         │                       │
              │ 5. Parse subtasks JSON  │                       │
              │    JSON.parse(          │                       │
              │      subtasks_json)     │                       │
              │                         │                       │
              │ 6. Create subtasks──────┼──────────────────────►│
              │    (loop)               │                       │
              │                         │                       │
              │ 7. Get template tags────┼──────────────────────►│
              │                         │       Tags            │
              │                         │◄──────────────────────┤
              │ 8. Assign tags to todo──┼──────────────────────►│
              │    (loop)               │                       │
              │                         │                       │
              │ 9. Return created todo  │                       │
              └─────────┬───────────────┘                       │
                        │                                        │
                        │ Response: {todo: {...}}                │
                        │                                        │
                        ▼                                        │
              ┌─────────────────────┐                           │
              │ Close modal         │                           │
              │ Refresh todos list  │                           │
              │ Show success message│                           │
              └─────────────────────┘                           │
```

---

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Database Schema                          │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │    users     │
  │──────────────│
  │ id (PK)      │
  │ username     │
  │ ...          │
  └──────┬───────┘
         │
         │ 1:N (user_id FK)
         │
         ▼
  ┌──────────────┐
  │  templates   │
  │──────────────│
  │ id (PK)      │───────────┐
  │ user_id (FK) │           │
  │ name         │           │ N:M (template_tags junction)
  │ title        │           │
  │ priority     │           │
  │ subtasks_json│           │
  │ offset_days  │           ▼
  │ created_at   │     ┌──────────────┐      ┌──────────────┐
  └──────────────┘     │template_tags │      │     tags     │
                       │──────────────│      │──────────────│
                       │ template_id  │◄─────│ id (PK)      │
         ┌─────────────│   (PK, FK)   │      │ user_id (FK) │
         │             │ tag_id       │──────┤ name         │
         │             │   (PK, FK)   │      │ color        │
         │             └──────────────┘      └──────────────┘
         │
         │ Subtasks stored as JSON:
         │ [{title: "...", position: 0}, ...]
         │
         │ When template is used:
         │
         ▼
  ┌──────────────┐
  │    todos     │
  │──────────────│
  │ id (PK)      │
  │ user_id (FK) │
  │ title        │ ← from template.title
  │ priority     │ ← from template.priority
  │ due_date     │ ← calculated from offset
  │ ...          │
  └──────┬───────┘
         │
         │ 1:N
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  subtasks    │  │  todo_tags   │  │     tags     │
  │──────────────│  │──────────────│  │──────────────│
  │ id (PK)      │  │ todo_id (FK) │  │ id (PK)      │
  │ todo_id (FK) │  │ tag_id (FK)  │  │ ...          │
  │ title        │  └──────────────┘  └──────────────┘
  │ position     │ ← from template subtasks_json
  │ completed    │
  └──────────────┘
```

---

## Data Transformation: Template → Todo

```
┌────────────────────────────────────────────────────────────────┐
│                      Template Object                            │
├────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   id: 5,                                                        │
│   user_id: 1,                                                   │
│   name: "Weekly Report",                                        │
│   title: "Prepare weekly report",                              │
│   priority: "high",                                             │
│   subtasks_json: '[                                             │
│     {"title":"Gather data","position":0},                       │
│     {"title":"Write summary","position":1},                     │
│     {"title":"Review","position":2}                             │
│   ]',                                                            │
│   due_date_offset_days: 7,                                      │
│   tags: [                                                        │
│     {id: 1, name: "Work", color: "#3b82f6"},                    │
│     {id: 3, name: "Important", color: "#ef4444"}                │
│   ]                                                              │
│ }                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/templates/5/use
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Transformation Process                      │
├────────────────────────────────────────────────────────────────┤
│ 1. Calculate Due Date:                                          │
│    now = getSingaporeNow()        // 2026-02-06 15:00:00       │
│    now.setDate(now.getDate() + 7) // 2026-02-13 15:00:00       │
│    dueDate = now.toISOString()    // "2026-02-13T15:00:00Z"    │
│                                                                  │
│ 2. Create Todo:                                                 │
│    todoId = todoDB.create(userId, {                             │
│      title: "Prepare weekly report",                            │
│      priority: "high",                                          │
│      due_date: "2026-02-13T15:00:00Z",                          │
│      completed: false,                                          │
│      recurrence_pattern: null                                   │
│    })                                                            │
│    → todoId = 42                                                │
│                                                                  │
│ 3. Parse & Create Subtasks:                                     │
│    subtasks = JSON.parse(subtasks_json)                         │
│    for (subtask of subtasks) {                                  │
│      subtaskDB.create(42, {                                     │
│        title: subtask.title,                                    │
│        position: subtask.position,                              │
│        completed: false                                         │
│      })                                                          │
│    }                                                             │
│    → Subtask IDs: 101, 102, 103                                 │
│                                                                  │
│ 4. Assign Tags:                                                 │
│    for (tag of tags) {                                          │
│      todoTagDB.assign(42, tag.id)                               │
│    }                                                             │
│    → Assigned tags: 1, 3                                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                       Created Todo Object                       │
├────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   id: 42,                                                       │
│   user_id: 1,                                                   │
│   title: "Prepare weekly report",                              │
│   priority: "high",                                             │
│   due_date: "2026-02-13T15:00:00Z",                             │
│   completed: false,                                             │
│   recurrence_pattern: null,                                     │
│   subtasks: [                                                    │
│     {id: 101, title: "Gather data", position: 0, completed: false}, │
│     {id: 102, title: "Write summary", position: 1, completed: false}, │
│     {id: 103, title: "Review", position: 2, completed: false}   │
│   ],                                                             │
│   tags: [                                                        │
│     {id: 1, name: "Work", color: "#3b82f6"},                    │
│     {id: 3, name: "Important", color: "#ef4444"}                │
│   ]                                                              │
│ }                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## State Flow in React Component

```
┌────────────────────────────────────────────────────────────────┐
│                  app/page.tsx Component State                   │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  useState Hooks:                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ saveTemplateModalOpen: boolean = false                  │   │
│  │ selectedTodoForTemplate: Todo | null = null             │   │
│  │ useTemplateModalOpen: boolean = false                   │   │
│  │ templates: Template[] = []                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Functions:                                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ fetchTemplates() → updates templates state              │   │
│  │ handleSaveAsTemplate(todo) → opens save modal           │   │
│  │ handleSaveTemplate(name, offset) → creates template     │   │
│  │ handleUseTemplate(id) → creates todo from template      │   │
│  │ handleDeleteTemplate(id) → deletes template             │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘

State Transitions:

1. SAVE TEMPLATE:
   Initial → Click "Save as Template"
   ├─► saveTemplateModalOpen = true
   ├─► selectedTodoForTemplate = todo
   │
   User fills form → Click "Save"
   ├─► POST /api/templates
   ├─► saveTemplateModalOpen = false
   ├─► selectedTodoForTemplate = null
   └─► fetchTemplates() (refresh list)

2. USE TEMPLATE:
   Initial → Click "Use Template"
   ├─► fetchTemplates()
   ├─► useTemplateModalOpen = true
   │
   Templates loaded → Click "Use This Template"
   ├─► POST /api/templates/[id]/use
   ├─► useTemplateModalOpen = false
   ├─► fetchTodos() (refresh main list)
   └─► Show success message

3. DELETE TEMPLATE:
   Template list visible → Click delete icon
   ├─► Confirm dialog
   ├─► DELETE /api/templates/[id]
   └─► fetchTemplates() (refresh list)
```

---

## API Request/Response Examples

### Create Template

**Request:**
```http
POST /api/templates
Content-Type: application/json
Cookie: session=...

{
  "name": "Weekly Report",
  "title": "Prepare weekly report",
  "priority": "high",
  "subtasks": [
    {"title": "Gather data", "position": 0},
    {"title": "Write summary", "position": 1},
    {"title": "Review with team", "position": 2}
  ],
  "tag_ids": [1, 3],
  "due_date_offset_days": 7
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "template": {
    "id": 5,
    "user_id": 1,
    "name": "Weekly Report",
    "title": "Prepare weekly report",
    "priority": "high",
    "subtasks_json": "[{\"title\":\"Gather data\",\"position\":0},{\"title\":\"Write summary\",\"position\":1},{\"title\":\"Review with team\",\"position\":2}]",
    "due_date_offset_days": 7,
    "created_at": "2026-02-06T07:00:00Z"
  }
}
```

### Use Template

**Request:**
```http
POST /api/templates/5/use
Cookie: session=...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "todo": {
    "id": 42,
    "user_id": 1,
    "title": "Prepare weekly report",
    "priority": "high",
    "due_date": "2026-02-13T07:00:00Z",
    "completed": false,
    "subtasks": [
      {"id": 101, "title": "Gather data", "position": 0, "completed": false},
      {"id": 102, "title": "Write summary", "position": 1, "completed": false},
      {"id": 103, "title": "Review with team", "position": 2, "completed": false}
    ],
    "tags": [
      {"id": 1, "name": "Work", "color": "#3b82f6"},
      {"id": 3, "name": "Important", "color": "#ef4444"}
    ]
  }
}
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                            │
└────────────────────────────────────────────────────────────────┘

1. DUPLICATE TEMPLATE NAME:
   POST /api/templates with existing name
   ├─► Database throws: "UNIQUE constraint failed: templates.user_id, templates.name"
   ├─► Caught in try-catch
   ├─► Return: 409 Conflict
   └─► Message: "A template with this name already exists"

2. TEMPLATE NOT FOUND:
   GET /api/templates/999 (doesn't exist or belongs to another user)
   ├─► templateDB.get(999, userId) returns null
   ├─► Return: 404 Not Found
   └─► Message: "Template not found"

3. UNAUTHORIZED ACCESS:
   Any request without valid session
   ├─► getSession() returns null
   ├─► Return: 401 Unauthorized
   └─► Message: "Not authenticated"

4. INVALID INPUT:
   POST /api/templates with invalid data
   ├─► Validation fails (e.g., name too long, invalid priority)
   ├─► Return: 400 Bad Request
   └─► Message: Specific validation error

5. JSON PARSING ERROR:
   Corrupted subtasks_json in database
   ├─► JSON.parse() throws error
   ├─► Caught in try-catch
   ├─► Default to empty array: []
   └─► Log error to console

6. DATABASE ERROR:
   Database operation fails
   ├─► Caught in try-catch
   ├─► Return: 500 Internal Server Error
   ├─► Message: "Failed to [operation]"
   └─► Log error to console
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Related Files**:
- [IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md)
- [TEMPLATE_SYSTEM_CHECKLIST.md](TEMPLATE_SYSTEM_CHECKLIST.md)
- [TEMPLATE_SYSTEM_GUIDE.md](TEMPLATE_SYSTEM_GUIDE.md)
- [PRPs/07-template-system.md](PRPs/07-template-system.md)
