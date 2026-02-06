# Architecture Summary - Todo App

## Overview

This document summarizes the system architecture for the Todo App based on the detailed PRPs (Product Requirement Prompts).

## Quick Reference

All 11 feature PRPs have been created with complete architecture and system design:

### Foundation Features
- ✅ [PRP 01: Todo CRUD Operations](01-todo-crud-operations.md) - Core todo management
- ✅ [PRP 02: Priority System](02-priority-system.md) - High/Medium/Low priorities
- ✅ [PRP 11: WebAuthn Authentication](11-authentication-webauthn.md) - Passwordless auth

### Core Features
- ✅ [PRP 03: Recurring Todos](03-recurring-todos.md) - Daily/weekly/monthly/yearly patterns
- ✅ [PRP 04: Reminders & Notifications](04-reminders-notifications.md) - Browser notifications
- ✅ [PRP 05: Subtasks & Progress](05-subtasks-progress.md) - Checklists with progress bars

### Organization Features
- ✅ [PRP 06: Tag System](06-tag-system.md) - Color-coded labels
- ✅ [PRP 08: Search & Filtering](08-search-filtering.md) - Real-time search + filters

### Productivity Features
- ✅ [PRP 07: Template System](07-template-system.md) - Reusable todo patterns
- ✅ [PRP 09: Export & Import](09-export-import.md) - JSON backup/restore
- ✅ [PRP 10: Calendar View](10-calendar-view.md) - Monthly calendar visualization

## Technology Stack

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS 4
- **Backend**: Next.js API routes (no separate server)
- **Database**: SQLite via `better-sqlite3` (synchronous)
- **Auth**: WebAuthn/Passkeys (passwordless)
- **Testing**: Playwright E2E tests
- **Timezone**: Singapore (Asia/Singapore) throughout

## Database Schema Overview

```
users → authenticators (1:many)
users → todos → subtasks (1:many with CASCADE)
users → tags (1:many)
todos ↔ tags (many:many via todo_tags)
users → templates (1:many)
templates ↔ tags (many:many via template_tags)
holidays (standalone, Singapore public holidays)
```

## Implementation Roadmap

**Recommended order** (with dependencies):

1. **PRP 11** (Authentication) - Can be first or last
2. **PRP 01** (Todo CRUD) - Foundation ⭐
3. **PRP 02** (Priority) - Extends todos
4. **PRP 05** (Subtasks) - Enables templates
5. **PRP 06** (Tags) - Enables filtering
6. **PRP 03** (Recurring) - Uses priority + tags
7. **PRP 04** (Reminders) - Notification system
8. **PRP 08** (Search/Filter) - Uses tags + priority
9. **PRP 07** (Templates) - Uses subtasks + tags
10. **PRP 09** (Export/Import) - Requires all features
11. **PRP 10** (Calendar) - Visualization layer

## Each PRP Includes

Every PRP document contains:

1. **Feature Summary** - What, who, why, scope
2. **UI/UX Behavior** - User interactions and flows
3. **Data Model** - Interfaces, database schema, examples
4. **Component Impact Map** - Files created/modified
5. **State & Data Flow** - Diagrams (Mermaid)
6. **API Specification** - Endpoints with examples
7. **Component Specifications** - React components
8. **Non-Functional Requirements** - Accessibility, performance, security
9. **Implementation Steps** - Ordered, actionable tasks
10. **Acceptance Criteria** - Testable requirements
11. **Out of Scope** - Explicitly excluded features
12. **Dependencies & Integration** - How features connect

## System Architecture Patterns

### Client-Server Pattern
```
Browser (React UI) ←→ Next.js API Routes ←→ lib/db.ts ←→ SQLite
```

### Authentication Flow
```
User → WebAuthn Ceremony → Register/Login → JWT Cookie → Protected Routes
```

### Data Flow (Optimistic Updates)
```
User Action → Immediate UI Update → API Call → Confirm or Revert
```

### Recurring Todo Pattern
```
Complete Todo → Check if recurring → Calculate next date → Create new instance
```

## Key Architecture Decisions

1. **No async DB operations** - `better-sqlite3` is synchronous (simpler, faster for small scale)
2. **Client-side filtering** - Search/filter happens in browser (no extra API calls)
3. **Optimistic updates** - UI responds instantly, confirms with server
4. **Singapore timezone only** - All dates stored/displayed as Asia/Singapore
5. **JWT sessions** - Stateless auth (no session table)
6. **Cascade deletes** - Database handles cleanup (ON DELETE CASCADE)
7. **JSON for subtasks in templates** - Simple serialization, no separate template_subtasks table

## Usage for AI Coding Assistants

When implementing features:

1. **Read the PRP** for the feature you're implementing
2. **Reference `.github/copilot-instructions.md`** for project-wide patterns
3. **Follow the implementation steps** in order
4. **Use the acceptance criteria** to validate your work
5. **Write E2E tests** based on the testing requirements section

Example prompt:
```
I want to implement PRP 05 (Subtasks & Progress Tracking).
Please follow the implementation steps and acceptance criteria from PRPs/05-subtasks-progress.md.
Use the database schema and API specifications provided.
```

## Documentation Standards

Each PRP follows this structure to ensure consistency and completeness:

- **Mermaid diagrams** for data flow and state
- **Code examples** in TypeScript
- **SQL schema** with constraints and indexes
- **API examples** with request/response
- **Edge cases** explicitly documented
- **Clear out-of-scope** to prevent scope creep

---

**Created**: 2026-02-06  
**Version**: 1.0  
**Total PRPs**: 11 features  
**Status**: ✅ Complete and ready for implementation
