# Template System Development Guide

## Quick Start

This directory contains comprehensive documentation for implementing the **Template System** feature (PRP 07) for the Todo App.

### 📚 Documentation Files

1. **[PRPs/07-template-system.md](PRPs/07-template-system.md)** - Architecture & System Design (PRP)
   - Complete feature specification
   - Data models and schemas
   - API specifications
   - Component designs
   - Non-functional requirements
   
2. **[IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md)** - Detailed Implementation Plan
   - Step-by-step implementation guide
   - Complete code examples for all components
   - Database schema and CRUD methods
   - API endpoint implementations
   - UI component specifications
   - Testing strategy
   
3. **[TEMPLATE_SYSTEM_CHECKLIST.md](TEMPLATE_SYSTEM_CHECKLIST.md)** - Implementation Checklist
   - Quick reference checklist
   - Phase-by-phase tasks
   - Testing checklist
   - Deployment checklist

### 🎯 What is the Template System?

The Template System allows users to:
- **Save** recurring todo patterns as reusable templates
- **Include** subtasks, tags, and priority in templates
- **Set** due date offsets (e.g., "Due in 1 week")
- **Use** templates to quickly create new todos
- **Manage** templates (create, edit, delete)

### 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Save Template  │  │  Use Template   │  │   Template   │ │
│  │     Modal      │  │      Modal      │  │     Card     │ │
│  └────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       API Routes                             │
│  GET    /api/templates           - List templates           │
│  POST   /api/templates           - Create template          │
│  GET    /api/templates/[id]      - Get template             │
│  PUT    /api/templates/[id]      - Update template          │
│  DELETE /api/templates/[id]      - Delete template          │
│  POST   /api/templates/[id]/use  - Create todo from template│
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (lib/db.ts)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  templates   │  │template_tags │  │  templateDB &    │  │
│  │    table     │  │    table     │  │ templateTagDB    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 📋 Key Features

1. **Template Creation**
   - Save any todo as a template
   - Preserves: title, priority, tags, subtasks
   - Optional: due date offset (1 day, 1 week, etc.)
   - Unique template names per user

2. **Template Usage**
   - One-click todo creation from template
   - Automatically calculates due date
   - Creates all subtasks (unchecked)
   - Assigns all tags
   - Preserves priority

3. **Template Management**
   - View all templates
   - Edit template metadata
   - Delete templates
   - Preview template contents

### 🚀 Getting Started

#### For Developers

**Step 1**: Read the requirements
```bash
# Read the PRP document to understand the feature
cat PRPs/07-template-system.md
```

**Step 2**: Review the implementation plan
```bash
# Detailed step-by-step guide with code examples
cat IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md
```

**Step 3**: Use the checklist
```bash
# Track your progress with the checklist
cat TEMPLATE_SYSTEM_CHECKLIST.md
```

**Step 4**: Start implementation
Follow the phases in order:
1. Database Schema Setup
2. API Endpoints
3. UI Components
4. Testing

#### For AI Coding Assistants (GitHub Copilot, etc.)

**Method 1**: Reference the full implementation plan
```
@workspace I want to implement the Template System feature.
Please follow the implementation plan in IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md
and use the specifications from PRPs/07-template-system.md.
Start with Phase 1: Database Schema Setup.
```

**Method 2**: Implement specific phases
```
Using IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md Phase 2,
implement the GET /api/templates endpoint.
Follow the code example provided and use the project patterns
from .github/copilot-instructions.md.
```

**Method 3**: Use for debugging
```
I'm getting an error when saving templates.
Check IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md section 2.2
and PRPs/07-template-system.md for the expected behavior.
```

### 📦 Implementation Phases

**Phase 1: Database Schema Setup** (2-3 hours)
- Create `templates` table
- Create `template_tags` junction table
- Add TypeScript interfaces
- Implement CRUD methods

**Phase 2: API Endpoints** (4-6 hours)
- GET /api/templates - List templates
- POST /api/templates - Create template
- GET /api/templates/[id] - Get single template
- PUT /api/templates/[id] - Update template
- DELETE /api/templates/[id] - Delete template
- POST /api/templates/[id]/use - Use template

**Phase 3: UI Components** (6-8 hours)
- "Save as Template" button
- SaveTemplateModal component
- "Use Template" button
- UseTemplateModal component
- TemplateCard component
- Event handlers and state management

**Phase 4: Testing** (3-4 hours)
- E2E tests with Playwright
- Manual testing
- Edge case testing

**Total Estimated Time**: 15-21 hours

### 🔑 Key Implementation Details

#### Database Schema

```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(name) <= 50),
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  subtasks_json TEXT,  -- JSON: [{title, position}, ...]
  due_date_offset_days INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);
```

#### Subtasks JSON Format

```json
[
  {"title": "Step 1: Research", "position": 0},
  {"title": "Step 2: Draft", "position": 1},
  {"title": "Step 3: Review", "position": 2}
]
```

#### Due Date Offset Calculation

```typescript
import { getSingaporeNow } from '@/lib/timezone';

// Calculate due date from offset
const now = getSingaporeNow();
now.setDate(now.getDate() + template.due_date_offset_days);
const dueDate = now.toISOString();
```

### ✅ Acceptance Criteria

From PRP 07:

- ✅ User can save existing todo as template (with name and optional offset)
- ✅ Template includes: title, priority, tags, subtasks (as JSON)
- ✅ User can view list of templates
- ✅ User can use template to create new todo
- ✅ Using template creates todo with all metadata
- ✅ Using template calculates due date from offset (if set)
- ✅ User can edit/delete templates
- ✅ Template names unique per user

### 🧪 Testing Strategy

**Unit Tests**: Database layer (if test infrastructure exists)
- Template CRUD operations
- Template-tag relationships
- Validation rules

**E2E Tests**: User flows with Playwright
- Save todo as template
- Use template to create todo
- Delete template
- Template name uniqueness
- Due date offset calculation
- Subtasks and tags preservation

**Manual Tests**: UI/UX verification
- Modal interactions
- Form validation
- Dark mode styling
- Mobile responsiveness
- Accessibility

### 🔒 Security Considerations

1. **User Isolation**: Templates scoped to user_id
2. **Input Validation**: Name length, priority values
3. **SQL Injection**: Use prepared statements
4. **JSON Validation**: Validate subtasks_json format
5. **Authentication**: Session required for all operations

### 📱 User Experience

**Creating Template**:
1. Expand a todo
2. Click "💾 Save as Template"
3. Enter template name
4. Optionally select due date offset
5. Click "Save Template"
6. See confirmation message

**Using Template**:
1. Click "📋 Use Template" in header
2. Browse template list
3. Click "Use This Template" on desired template
4. New todo created instantly with all metadata

### 🎨 UI/UX Highlights

- **Color-coded priority badges** (red/yellow/blue)
- **Tag count indicators** in template cards
- **Subtask count indicators** in template cards
- **Due date offset badges** (purple)
- **Dark mode support** throughout
- **Responsive design** for mobile
- **Keyboard accessible** (Tab, Enter, Escape)

### 📖 Related Features

This feature integrates with:
- **PRP 01**: Todo CRUD Operations - Creates new todos
- **PRP 02**: Priority System - Preserves priority
- **PRP 05**: Subtasks & Progress - Serializes/deserializes subtasks
- **PRP 06**: Tag System - Template-tag many-to-many relationship
- **PRP 11**: Authentication - User isolation and session management

### ❌ Out of Scope

The following features are explicitly NOT included:
- Template categories/folders
- Public template library (shared templates)
- Template versioning (track changes)
- Template variables (placeholders like {project_name})
- Template suggestions based on usage
- Template import/export separate from todos

### 🐛 Common Pitfalls

1. **Don't use `new Date()`** - Always use `getSingaporeNow()` from `lib/timezone.ts`
2. **params is async in Next.js 16** - Always `await params` in API routes
3. **Database fields can be null** - Use `?? null` or `|| null` when needed
4. **JSON serialization** - Use `JSON.stringify()` for subtasks before storing
5. **User isolation** - Always filter by `session.userId`

### 📊 Success Metrics

**Functional**:
- All acceptance criteria met ✅
- All tests passing ✅
- No console errors ✅

**Performance**:
- JSON parsing < 10ms ✅
- Template list loads < 100ms ✅
- Todo creation from template < 200ms ✅

**Accessibility**:
- Keyboard navigation works ✅
- Screen reader friendly ✅
- WCAG 2.1 AA compliant ✅

### 🔗 Additional Resources

- **Reference App**: https://ai-sdlc-workshop-day1-production.up.railway.app/login
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md) - Section 9: Todo Templates
- **Architecture Overview**: [PRPs/ARCHITECTURE.md](PRPs/ARCHITECTURE.md)
- **Setup Guide**: [README.md](README.md)

### 💡 Tips for Success

1. **Follow the phases in order** - Database → API → UI → Testing
2. **Test as you go** - Don't wait until the end to test
3. **Use Singapore timezone** - Always use `lib/timezone.ts` functions
4. **Check existing patterns** - Look at how tags and subtasks work
5. **Reference copilot-instructions.md** - Follow project conventions
6. **Ask for help** - Use GitHub Copilot Chat with PRP context

### 🎓 Learning Objectives

By implementing this feature, you will learn:
- JSON serialization/deserialization in SQL databases
- Many-to-many relationships (templates ↔ tags)
- Date offset calculations with timezone awareness
- Modal-based UI patterns in React
- RESTful API design
- User data isolation and security
- E2E testing with Playwright

---

## Next Steps

1. ✅ **Read** [PRPs/07-template-system.md](PRPs/07-template-system.md) for complete specifications
2. ✅ **Review** [IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md) for detailed implementation guide
3. ✅ **Use** [TEMPLATE_SYSTEM_CHECKLIST.md](TEMPLATE_SYSTEM_CHECKLIST.md) to track progress
4. 🚀 **Start** with Phase 1: Database Schema Setup
5. 🧪 **Test** each phase before moving to the next
6. 🎉 **Celebrate** when all acceptance criteria are met!

---

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Ready for Implementation  
**Estimated Time**: 15-21 hours  
**Difficulty**: Medium  
**Prerequisites**: PRPs 01, 05, 06, 11 implemented

---

**Need Help?**
- Refer to [.github/copilot-instructions.md](.github/copilot-instructions.md) for project patterns
- Use GitHub Copilot Chat with context from the PRP document
- Check [USER_GUIDE.md](USER_GUIDE.md) for user-facing behavior examples
- Review existing feature implementations (tags, subtasks) for similar patterns
