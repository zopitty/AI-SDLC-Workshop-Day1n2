# How to Use the Architecture Documentation

## Overview

The `PRPs/` directory contains **11 comprehensive architecture documents** for the Todo App. These are **design specifications, not implementation code** - they describe what to build and how it should work.

## For Developers

### Getting Started

1. **Read** [PRPs/ARCHITECTURE.md](PRPs/ARCHITECTURE.md) for system overview
2. **Choose a feature** from the implementation roadmap
3. **Open the PRP** for that feature (e.g., `PRPs/01-todo-crud-operations.md`)
4. **Follow implementation steps** in order
5. **Test against acceptance criteria**

### Example Workflow

```bash
# 1. Read the architecture for Todo CRUD
cat PRPs/01-todo-crud-operations.md

# 2. Implement database layer first
# - Create tables as specified in "Database Schema" section
# - Implement CRUD methods as specified in "Database Layer" section

# 3. Implement API routes
# - Follow "API Specification" section
# - Use provided request/response examples

# 4. Implement UI components
# - Follow "Component Specifications" section
# - Use "State & Data Flow" diagrams as guide

# 5. Test
# - Write E2E tests from "Testing Strategy" section
# - Verify "Acceptance Criteria" are met
```

## For AI Coding Assistants (GitHub Copilot, etc.)

### Using PRPs with Copilot

**Option 1: Reference entire PRP**
```
@workspace I want to implement PRP 05 (Subtasks & Progress Tracking).
Please follow the implementation steps and acceptance criteria from PRPs/05-subtasks-progress.md.
Use the database schema and API specifications provided in that document.
```

**Option 2: Reference specific sections**
```
Using the API specification from PRPs/06-tag-system.md,
implement the POST /api/tags endpoint with validation.
```

**Option 3: Use for debugging**
```
I'm getting an error with recurring todos.
Check PRPs/03-recurring-todos.md for the expected behavior
and help me fix the next instance creation logic.
```

### Best Practices with AI

1. **Always reference the PRP** for the feature you're working on
2. **Include context** from `.github/copilot-instructions.md` (project patterns)
3. **Ask for specific sections** if you only need part of a feature
4. **Use acceptance criteria** to validate AI-generated code
5. **Check "Edge Cases"** section for scenarios to test

## Document Structure Guide

Each PRP follows this structure:

```
1. Feature Summary
   ├─ What: Brief description
   ├─ Who: User personas
   ├─ Why: Business value
   └─ Scope: Boundaries

2. UI/UX Behavior
   ├─ User interactions
   ├─ Visual design
   └─ Error states

3. Data Model
   ├─ TypeScript interfaces
   ├─ Database schema (SQL)
   └─ Example records (JSON)

4. Component Impact Map
   ├─ New files to create
   └─ Existing files to modify

5. State & Data Flow
   ├─ Sequence diagrams (Mermaid)
   ├─ State machines (Mermaid)
   └─ Data flow patterns

6. API Specification
   ├─ Endpoint URLs
   ├─ Request/response examples
   └─ Error codes

7. Component Specifications
   ├─ React component interfaces
   ├─ Props and state
   └─ Behavior descriptions

8. Non-Functional Requirements
   ├─ Accessibility (WCAG, keyboard, screen reader)
   ├─ Performance (targets, optimizations)
   ├─ Security (validation, authorization)
   └─ Maintainability (patterns, types)

9. Implementation Steps
   └─ Ordered, actionable tasks (1-10)

10. Acceptance Criteria
    └─ Testable requirements (✅ checklist)

11. Edge Cases & Error Handling
    └─ Unusual scenarios and solutions

12. Out of Scope
    └─ Features explicitly NOT included

13. Dependencies & Integration
    └─ Relationships with other PRPs
```

## Feature Dependencies

Implement in this order to satisfy dependencies:

```
Foundation (any order):
  PRP 11 (Auth) ────────────────┐
  PRP 01 (Todo CRUD) ──┐        │
  PRP 02 (Priority) ───┘        │
                                │
Core Features:                  │
  PRP 05 (Subtasks) ──┐         │
  PRP 06 (Tags) ──────┼──┐      │
  PRP 03 (Recurring) ─┘  │      │
  PRP 04 (Reminders) ────┘      │
                                │
Organization:                   │
  PRP 08 (Search/Filter) ───────┤
                                │
Productivity:                   │
  PRP 07 (Templates) ───────────┤
  PRP 09 (Export/Import) ───────┤
  PRP 10 (Calendar) ────────────┘
```

## Quick Reference

| PRP | Feature | File Size | Complexity | Est. Time |
|-----|---------|-----------|------------|-----------|
| 01 | Todo CRUD | 16KB | Medium | 2-3 days |
| 02 | Priority | 19KB | Low | 1 day |
| 03 | Recurring | 24KB | High | 3-4 days |
| 04 | Reminders | 9KB | Medium | 2 days |
| 05 | Subtasks | 11KB | Medium | 2-3 days |
| 06 | Tags | 7KB | Medium | 2 days |
| 07 | Templates | 8KB | Medium | 2-3 days |
| 08 | Search/Filter | 11KB | Low | 1-2 days |
| 09 | Export/Import | 10KB | Medium | 2 days |
| 10 | Calendar | 12KB | Medium | 2-3 days |
| 11 | Auth | 30KB | High | 3-4 days |

**Total estimated effort**: 3-4 weeks for solo developer, 1-2 weeks for team

## Viewing Diagrams

All diagrams are in Mermaid format. To view:

**Option 1: GitHub** (renders automatically)
- View files directly on GitHub

**Option 2: VS Code**
- Install "Markdown Preview Mermaid Support" extension
- Open PRP file and use Markdown preview (Ctrl+Shift+V)

**Option 3: Online**
- Copy Mermaid code blocks
- Paste into https://mermaid.live/

## Common Questions

**Q: Why are there no code files?**
A: These are architecture documents. They describe WHAT to build, not the actual implementation code. Use them as blueprints.

**Q: Can I implement features in a different order?**
A: Yes, but check "Dependencies & Integration" section in each PRP. Some features depend on others being implemented first.

**Q: What if I find errors or want to improve a PRP?**
A: PRPs are versioned. You can propose updates following the "Contributing" section in PRPs/README.md.

**Q: Are these production-ready specifications?**
A: Yes, they include security, accessibility, and performance requirements. However, always review for your specific production environment needs.

**Q: How do I handle features not in the PRPs?**
A: Check the "Out of Scope" section of related PRPs. If a feature isn't documented, create a new PRP following the established structure.

## Support

- **PRD Reference**: [PRPs/README.md](PRPs/README.md)
- **Architecture Overview**: [PRPs/ARCHITECTURE.md](PRPs/ARCHITECTURE.md)
- **Implementation Patterns**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **User Documentation**: [USER_GUIDE.md](USER_GUIDE.md)

---

**Created**: 2026-02-06  
**Version**: 1.0  
**For**: Developers and AI Coding Assistants
