# Tag System Implementation Plan
**Based on**: PRPs/06-tag-system.md  
**Status**: Planning  
**Date**: 2026-02-06

## Overview
Implementing a color-coded tag system for the Todo App with many-to-many relationships, tag management UI, and filtering capabilities.

## Implementation Approach

Since this repository contains only PRP documentation and no existing application code, this implementation will create:

1. **Database Schema Documentation** - SQL table definitions
2. **TypeScript Interfaces** - Type definitions for Tag system
3. **API Route Templates** - Pseudo-code/templates for Next.js API routes
4. **Component Specifications** - React component interfaces and behavior
5. **Test Specifications** - E2E test scenarios for Playwright

## Deliverables

### 1. Database Layer (`docs/implementation/tag-system/database.md`)
- SQL schema for `tags` and `todo_tags` tables
- Index definitions
- Migration script template
- Example CRUD operations in better-sqlite3

### 2. Type Definitions (`docs/implementation/tag-system/types.ts`)
- `Tag` interface
- `TodoTag` junction interface
- Extended `Todo` interface with tags
- API request/response types

### 3. API Route Templates (`docs/implementation/tag-system/api-routes/`)
- `GET/POST /api/tags` - List and create tags
- `PUT/DELETE /api/tags/[id]` - Update and delete tags
- `POST /api/todos/[id]/tags` - Assign tag to todo
- `DELETE /api/todos/[id]/tags/[tag_id]` - Unassign tag

### 4. React Components (`docs/implementation/tag-system/components/`)
- `TagPill.tsx` - Colored tag badge component
- `TagSelector.tsx` - Multi-select dropdown for tags
- `TagManager.tsx` - Tag CRUD modal/sidebar
- `TagColorPicker.tsx` - Color selection UI

### 5. Integration Guide (`docs/implementation/tag-system/integration.md`)
- How to integrate with existing Todo CRUD
- Updating todo list to display tags
- Filter implementation
- Recurring todos tag inheritance
- Template system tag support

### 6. Test Specifications (`docs/implementation/tag-system/tests/`)
- E2E test scenarios (Playwright)
- API endpoint tests
- Component interaction tests
- Edge cases and validation tests

## File Structure
```
docs/
└── implementation/
    └── tag-system/
        ├── README.md (this file)
        ├── database.md
        ├── types.ts
        ├── api-routes/
        │   ├── tags-route.ts
        │   ├── tags-id-route.ts
        │   └── todos-id-tags-route.ts
        ├── components/
        │   ├── TagPill.tsx
        │   ├── TagSelector.tsx
        │   ├── TagManager.tsx
        │   └── TagColorPicker.tsx
        ├── integration.md
        └── tests/
            ├── tag-crud.spec.ts
            ├── tag-assignment.spec.ts
            └── tag-filtering.spec.ts
```

## Implementation Order

1. ✅ Create implementation directory structure
2. ⏳ Database schema and migration
3. ⏳ TypeScript type definitions
4. ⏳ API route templates
5. ⏳ React component templates
6. ⏳ Integration documentation
7. ⏳ Test specifications

## Acceptance Criteria (from PRP 06)

- [ ] User can create tags with name and color
- [ ] User can edit/delete tags
- [ ] User can assign multiple tags to a todo
- [ ] User can remove tags from a todo
- [ ] User can filter todos by tag (click tag pill)
- [ ] Tag names unique per user (validation error if duplicate)
- [ ] Deleting tag removes from all todos (cascade)
- [ ] Recurring todos: Next instance inherits tags

## Technical Constraints

- Uses better-sqlite3 (synchronous API)
- Next.js 16 App Router
- React 19 features (ref as prop, no forwardRef)
- Singapore timezone (`Asia/Singapore`)
- WebAuthn authentication (session-based)
- Tailwind CSS 4 for styling

## Dependencies

- Requires PRP 01 (Todo CRUD) to be implemented
- Integrates with PRP 03 (Recurring Todos) for tag inheritance
- Integrates with PRP 07 (Templates) for tag serialization
- Integrates with PRP 08 (Search/Filter) for tag filtering

## Notes

This implementation creates **template code and documentation** that can be used to implement the tag system in an actual Next.js Todo App following the architecture described in the custom instructions.
