# Template System Implementation Plan (PRP 07)

## Overview
This document provides a step-by-step implementation plan for the Template System feature as defined in [PRPs/07-template-system.md](PRPs/07-template-system.md).

**Feature Goal**: Enable users to save recurring todo patterns as reusable templates with subtasks, tags, and metadata.

**Reference Application**: https://ai-sdlc-workshop-day1-production.up.railway.app/login

---

## Prerequisites

Before implementing this feature, ensure the following features are already implemented:
- ✅ PRP 01: Todo CRUD Operations
- ✅ PRP 05: Subtasks & Progress Tracking
- ✅ PRP 06: Tag System
- ✅ PRP 11: WebAuthn Authentication (for user isolation)

---

## Implementation Phases

### Phase 1: Database Schema Setup

#### 1.1 Add Templates Table
**File**: `lib/db.ts`

**Action**: Add the following schema to the database initialization:

```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(name) <= 50 AND length(name) > 0),
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  subtasks_json TEXT,
  due_date_offset_days INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
```

**Key Points**:
- Name is required and limited to 50 characters
- Unique constraint on (user_id, name) prevents duplicate template names per user
- Priority must be one of: 'high', 'medium', 'low'
- subtasks_json stores array of {title, position} objects as JSON string
- due_date_offset_days is optional (can be NULL)

#### 1.2 Add Template-Tags Junction Table
**File**: `lib/db.ts`

```sql
CREATE TABLE IF NOT EXISTS template_tags (
  template_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (template_id, tag_id),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_tags_template ON template_tags(template_id);
CREATE INDEX IF NOT EXISTS idx_template_tags_tag ON template_tags(tag_id);
```

**Key Points**:
- Many-to-many relationship between templates and tags
- Cascade delete ensures cleanup when template or tag is deleted

#### 1.3 Add TypeScript Interfaces
**File**: `lib/db.ts`

```typescript
export interface Template {
  id: number;
  user_id: number;
  name: string;                    // Max 50 chars, unique per user
  title: string;                   // The todo title to create
  priority: Priority;              // 'high' | 'medium' | 'low'
  subtasks_json: string;           // JSON array: [{title, position}, ...]
  due_date_offset_days: number | null;  // Days from now
  created_at: string;
}

export interface TemplateSubtask {
  title: string;
  position: number;
}
```

#### 1.4 Add Database CRUD Methods
**File**: `lib/db.ts`

Add the following methods to interact with templates:

```typescript
export const templateDB = {
  // Create a new template
  create: (userId: number, data: {
    name: string;
    title: string;
    priority: Priority;
    subtasks_json: string;
    due_date_offset_days: number | null;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO templates (user_id, name, title, priority, subtasks_json, due_date_offset_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      data.name,
      data.title,
      data.priority,
      data.subtasks_json,
      data.due_date_offset_days
    );
    return result.lastInsertRowid as number;
  },

  // Get template by ID (with user check)
  get: (id: number, userId: number): Template | null => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Template | null;
  },

  // List all templates for a user
  list: (userId: number): Template[] => {
    const stmt = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Template[];
  },

  // Update template
  update: (id: number, userId: number, data: {
    name: string;
    title: string;
    priority: Priority;
    subtasks_json: string;
    due_date_offset_days: number | null;
  }) => {
    const stmt = db.prepare(`
      UPDATE templates 
      SET name = ?, title = ?, priority = ?, subtasks_json = ?, due_date_offset_days = ?
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(
      data.name,
      data.title,
      data.priority,
      data.subtasks_json,
      data.due_date_offset_days,
      id,
      userId
    );
    return result.changes > 0;
  },

  // Delete template
  delete: (id: number, userId: number) => {
    const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export const templateTagDB = {
  // Assign tag to template
  assign: (templateId: number, tagId: number) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO template_tags (template_id, tag_id) VALUES (?, ?)');
    stmt.run(templateId, tagId);
  },

  // Remove tag from template
  remove: (templateId: number, tagId: number) => {
    const stmt = db.prepare('DELETE FROM template_tags WHERE template_id = ? AND tag_id = ?');
    stmt.run(templateId, tagId);
  },

  // Get all tags for a template
  getTags: (templateId: number) => {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN template_tags tt ON t.id = tt.tag_id
      WHERE tt.template_id = ?
    `);
    return stmt.all(templateId) as Tag[];
  },

  // Clear all tags from template
  clearAll: (templateId: number) => {
    const stmt = db.prepare('DELETE FROM template_tags WHERE template_id = ?');
    stmt.run(templateId);
  }
};
```

**Testing Checklist**:
- [ ] Template creation works with all fields
- [ ] Name uniqueness is enforced per user
- [ ] Template names are limited to 50 characters
- [ ] Priority validation works
- [ ] User isolation is enforced (users can't access other users' templates)
- [ ] Template-tag relationships work correctly
- [ ] Cascade delete works (deleting template removes tag associations)

---

### Phase 2: API Endpoints

#### 2.1 GET /api/templates - List Templates
**File**: `app/api/templates/route.ts` (create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, templateTagDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const templates = templateDB.list(session.userId);
    
    // Enhance each template with tag information
    const templatesWithTags = templates.map(template => ({
      ...template,
      tags: templateTagDB.getTags(template.id)
    }));

    return NextResponse.json({ templates: templatesWithTags });
  } catch (error) {
    console.error('Failed to list templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
```

**Response Example**:
```json
{
  "templates": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Weekly Report",
      "title": "Prepare weekly report",
      "priority": "high",
      "subtasks_json": "[{\"title\":\"Gather data\",\"position\":0},{\"title\":\"Write summary\",\"position\":1}]",
      "due_date_offset_days": 7,
      "created_at": "2026-02-06T07:00:00",
      "tags": [
        {"id": 1, "name": "Work", "color": "#3b82f6"}
      ]
    }
  ]
}
```

#### 2.2 POST /api/templates - Create Template
**File**: `app/api/templates/route.ts` (add to existing file)

```typescript
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, title, priority, subtasks, tag_ids, due_date_offset_days } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Template name must be 50 characters or less' }, { status: 400 });
    }
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Template title is required' }, { status: 400 });
    }
    if (!['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    // Serialize subtasks to JSON
    const subtasksJson = JSON.stringify(subtasks || []);

    // Create template
    const templateId = templateDB.create(session.userId, {
      name: name.trim(),
      title: title.trim(),
      priority,
      subtasks_json: subtasksJson,
      due_date_offset_days: due_date_offset_days || null
    });

    // Assign tags if provided
    if (tag_ids && Array.isArray(tag_ids)) {
      for (const tagId of tag_ids) {
        templateTagDB.assign(templateId, tagId);
      }
    }

    const template = templateDB.get(templateId, session.userId);
    return NextResponse.json({ template }, { status: 201 });

  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
```

**Request Example**:
```json
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

#### 2.3 GET /api/templates/[id] - Get Single Template
**File**: `app/api/templates/[id]/route.ts` (create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, templateTagDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
  }

  const template = templateDB.get(templateId, session.userId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const tags = templateTagDB.getTags(templateId);

  return NextResponse.json({
    template: {
      ...template,
      tags
    }
  });
}
```

#### 2.4 PUT /api/templates/[id] - Update Template
**File**: `app/api/templates/[id]/route.ts` (add to existing file)

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, title, priority, subtasks, tag_ids, due_date_offset_days } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Template name must be 50 characters or less' }, { status: 400 });
    }
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Template title is required' }, { status: 400 });
    }
    if (!['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    // Check template exists and belongs to user
    const existing = templateDB.get(templateId, session.userId);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Serialize subtasks to JSON
    const subtasksJson = JSON.stringify(subtasks || []);

    // Update template
    const updated = templateDB.update(templateId, session.userId, {
      name: name.trim(),
      title: title.trim(),
      priority,
      subtasks_json: subtasksJson,
      due_date_offset_days: due_date_offset_days || null
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    // Update tags
    templateTagDB.clearAll(templateId);
    if (tag_ids && Array.isArray(tag_ids)) {
      for (const tagId of tag_ids) {
        templateTagDB.assign(templateId, tagId);
      }
    }

    const template = templateDB.get(templateId, session.userId);
    return NextResponse.json({ template });

  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
```

#### 2.5 DELETE /api/templates/[id] - Delete Template
**File**: `app/api/templates/[id]/route.ts` (add to existing file)

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
  }

  const deleted = templateDB.delete(templateId, session.userId);
  if (!deleted) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
```

#### 2.6 POST /api/templates/[id]/use - Use Template to Create Todo
**File**: `app/api/templates/[id]/use/route.ts` (create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, templateTagDB, todoDB, subtaskDB, todoTagDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
  }

  try {
    // Get template
    const template = templateDB.get(templateId, session.userId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Calculate due date if offset is set
    let dueDate: string | null = null;
    if (template.due_date_offset_days !== null) {
      const now = getSingaporeNow();
      now.setDate(now.getDate() + template.due_date_offset_days);
      dueDate = now.toISOString();
    }

    // Create todo
    const todoId = todoDB.create(session.userId, {
      title: template.title,
      priority: template.priority,
      due_date: dueDate,
      completed: false,
      recurrence_pattern: null
    });

    // Parse and create subtasks
    try {
      const subtasks = JSON.parse(template.subtasks_json || '[]');
      for (const subtask of subtasks) {
        subtaskDB.create(todoId, {
          title: subtask.title,
          position: subtask.position,
          completed: false
        });
      }
    } catch (error) {
      console.error('Failed to parse subtasks JSON:', error);
    }

    // Assign tags
    const tags = templateTagDB.getTags(templateId);
    for (const tag of tags) {
      todoTagDB.assign(todoId, tag.id);
    }

    // Fetch the created todo with all relationships
    const todo = todoDB.get(todoId, session.userId);
    const todoSubtasks = subtaskDB.list(todoId);
    const todoTags = todoTagDB.getTags(todoId);

    return NextResponse.json({
      todo: {
        ...todo,
        subtasks: todoSubtasks,
        tags: todoTags
      }
    });

  } catch (error) {
    console.error('Failed to use template:', error);
    return NextResponse.json(
      { error: 'Failed to create todo from template' },
      { status: 500 }
    );
  }
}
```

**Testing Checklist**:
- [ ] GET /api/templates returns all user templates
- [ ] POST /api/templates creates template with validation
- [ ] POST /api/templates enforces name uniqueness per user
- [ ] GET /api/templates/[id] returns template with tags
- [ ] PUT /api/templates/[id] updates template correctly
- [ ] DELETE /api/templates/[id] removes template and tag associations
- [ ] POST /api/templates/[id]/use creates todo with all metadata
- [ ] Due date offset calculation works correctly with Singapore timezone
- [ ] Subtasks JSON parsing handles empty arrays and errors
- [ ] User isolation works (can't access other users' templates)

---

### Phase 3: UI Components

#### 3.1 Add "Save as Template" Button to Todo
**File**: `app/page.tsx`

**Location**: In the todo detail/expanded view

```typescript
// Add state for save template modal
const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
const [selectedTodoForTemplate, setSelectedTodoForTemplate] = useState<Todo | null>(null);

// Add handler
const handleSaveAsTemplate = (todo: Todo) => {
  setSelectedTodoForTemplate(todo);
  setSaveTemplateModalOpen(true);
};

// In the todo render (when expanded), add button:
<button
  onClick={() => handleSaveAsTemplate(todo)}
  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
>
  💾 Save as Template
</button>
```

#### 3.2 Create SaveTemplateModal Component
**File**: `app/page.tsx` (add inline component)

```typescript
function SaveTemplateModal({
  todo,
  onSave,
  onCancel
}: {
  todo: Todo;
  onSave: (name: string, offsetDays: number | null) => void;
  onCancel: () => void;
}) {
  const [templateName, setTemplateName] = useState('');
  const [offsetDays, setOffsetDays] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    if (templateName.length > 50) {
      setError('Template name must be 50 characters or less');
      return;
    }

    onSave(templateName.trim(), offsetDays);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Save as Template</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Weekly Report"
              maxLength={50}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {templateName.length}/50 characters
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Due Date Offset (optional)
            </label>
            <select
              value={offsetDays ?? ''}
              onChange={(e) => setOffsetDays(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">No due date</option>
              <option value="1">Due in 1 day</option>
              <option value="3">Due in 3 days</option>
              <option value="7">Due in 1 week</option>
              <option value="14">Due in 2 weeks</option>
              <option value="30">Due in 1 month</option>
            </select>
          </div>

          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <h3 className="text-sm font-medium mb-2">Will be saved:</h3>
            <ul className="text-sm space-y-1">
              <li>✓ Title: {todo.title}</li>
              <li>✓ Priority: {todo.priority}</li>
              <li>✓ {todo.subtasks?.length || 0} subtasks</li>
              <li>✓ {todo.tags?.length || 0} tags</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 3.3 Add Template Save Handler
**File**: `app/page.tsx`

```typescript
const handleSaveTemplate = async (name: string, offsetDays: number | null) => {
  if (!selectedTodoForTemplate) return;

  try {
    // Prepare subtasks for JSON serialization
    const subtasks = selectedTodoForTemplate.subtasks?.map(st => ({
      title: st.title,
      position: st.position
    })) || [];

    // Get tag IDs
    const tagIds = selectedTodoForTemplate.tags?.map(t => t.id) || [];

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        title: selectedTodoForTemplate.title,
        priority: selectedTodoForTemplate.priority,
        subtasks,
        tag_ids: tagIds,
        due_date_offset_days: offsetDays
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save template');
    }

    setSaveTemplateModalOpen(false);
    setSelectedTodoForTemplate(null);
    
    // Optionally show success message
    alert('Template saved successfully!');
    
    // Refresh templates list if visible
    fetchTemplates();

  } catch (error: any) {
    console.error('Failed to save template:', error);
    alert(error.message || 'Failed to save template');
  }
};
```

#### 3.4 Add "Use Template" Button in Header
**File**: `app/page.tsx`

```typescript
// Add state
const [useTemplateModalOpen, setUseTemplateModalOpen] = useState(false);
const [templates, setTemplates] = useState<Template[]>([]);

// Add fetch templates function
const fetchTemplates = async () => {
  try {
    const response = await fetch('/api/templates');
    if (response.ok) {
      const data = await response.json();
      setTemplates(data.templates);
    }
  } catch (error) {
    console.error('Failed to fetch templates:', error);
  }
};

// In the header/toolbar area, add:
<button
  onClick={() => {
    fetchTemplates();
    setUseTemplateModalOpen(true);
  }}
  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
>
  📋 Use Template
</button>
```

#### 3.5 Create UseTemplateModal Component
**File**: `app/page.tsx`

```typescript
function UseTemplateModal({
  templates,
  onUse,
  onEdit,
  onDelete,
  onCancel
}: {
  templates: Template[];
  onUse: (templateId: number) => void;
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Use Template</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No templates yet.</p>
            <p className="text-sm mt-2">Save a todo as template to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={onUse}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 3.6 Create TemplateCard Component
**File**: `app/page.tsx`

```typescript
function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete
}: {
  template: Template & { tags?: Tag[] };
  onUse: (templateId: number) => void;
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
}) {
  const subtasks = JSON.parse(template.subtasks_json || '[]');
  
  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-bold">{template.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{template.title}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(template)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400"
            title="Edit template"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete template "${template.name}"?`)) {
                onDelete(template.id);
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
            title="Delete template"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[template.priority]}`}>
          {template.priority}
        </span>
        {template.tags && template.tags.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600">
            {template.tags.length} tags
          </span>
        )}
        {subtasks.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600">
            {subtasks.length} subtasks
          </span>
        )}
        {template.due_date_offset_days !== null && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
            Due in {template.due_date_offset_days} days
          </span>
        )}
      </div>

      <button
        onClick={() => onUse(template.id)}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
      >
        Use This Template
      </button>
    </div>
  );
}
```

#### 3.7 Add Template Usage Handler
**File**: `app/page.tsx`

```typescript
const handleUseTemplate = async (templateId: number) => {
  try {
    const response = await fetch(`/api/templates/${templateId}/use`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to use template');
    }

    const data = await response.json();
    
    // Close modal
    setUseTemplateModalOpen(false);
    
    // Refresh todos list
    await fetchTodos();
    
    // Optionally show success message
    alert('Todo created from template!');

  } catch (error) {
    console.error('Failed to use template:', error);
    alert('Failed to create todo from template');
  }
};

const handleDeleteTemplate = async (templateId: number) => {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    // Refresh templates list
    fetchTemplates();

  } catch (error) {
    console.error('Failed to delete template:', error);
    alert('Failed to delete template');
  }
};
```

#### 3.8 Render Modals
**File**: `app/page.tsx`

Add at the end of the component return statement:

```typescript
{saveTemplateModalOpen && selectedTodoForTemplate && (
  <SaveTemplateModal
    todo={selectedTodoForTemplate}
    onSave={handleSaveTemplate}
    onCancel={() => {
      setSaveTemplateModalOpen(false);
      setSelectedTodoForTemplate(null);
    }}
  />
)}

{useTemplateModalOpen && (
  <UseTemplateModal
    templates={templates}
    onUse={handleUseTemplate}
    onEdit={(template) => {
      // TODO: Implement edit functionality
      console.log('Edit template:', template);
    }}
    onDelete={handleDeleteTemplate}
    onCancel={() => setUseTemplateModalOpen(false)}
  />
)}
```

**Testing Checklist**:
- [ ] "Save as Template" button appears on expanded todos
- [ ] SaveTemplateModal opens with pre-filled todo data
- [ ] Template name validation works (required, max 50 chars)
- [ ] Due date offset dropdown works correctly
- [ ] "Use Template" button in header opens modal
- [ ] Template list displays all templates with correct metadata
- [ ] Template cards show priority, tags, and subtasks count
- [ ] Using a template creates a new todo with all metadata
- [ ] Deleting a template works with confirmation
- [ ] Modal accessibility (keyboard navigation, escape to close)

---

### Phase 4: Testing

#### 4.1 Create E2E Test File
**File**: `tests/07-template-system.spec.ts` (create new file)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Template System', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Register and login
    await page.goto('http://localhost:3000');
    // ... authentication setup
  });

  test('should save todo as template', async ({ page }) => {
    // Create a todo with subtasks and tags
    await page.fill('[placeholder="What needs to be done?"]', 'Weekly Report');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Add")');
    
    // Add subtasks
    await page.click('[data-testid="todo-1"]');
    await page.fill('[placeholder="Add subtask"]', 'Gather data');
    await page.click('button:has-text("Add Subtask")');
    
    // Click "Save as Template"
    await page.click('button:has-text("Save as Template")');
    
    // Fill template modal
    await page.fill('[placeholder="e.g., Weekly Report"]', 'My Weekly Report Template');
    await page.selectOption('select', '7'); // Due in 1 week
    await page.click('button:has-text("Save Template")');
    
    // Verify success
    await expect(page.locator('text=Template saved successfully')).toBeVisible();
  });

  test('should use template to create todo', async ({ page }) => {
    // Open use template modal
    await page.click('button:has-text("Use Template")');
    
    // Verify templates list
    await expect(page.locator('text=My Weekly Report Template')).toBeVisible();
    
    // Use template
    await page.click('button:has-text("Use This Template")');
    
    // Verify todo created
    await expect(page.locator('text=Weekly Report')).toBeVisible();
    await expect(page.locator('text=high')).toBeVisible();
  });

  test('should enforce template name uniqueness', async ({ page }) => {
    // Try to create duplicate template name
    // ... test implementation
  });

  test('should delete template', async ({ page }) => {
    // Open use template modal
    await page.click('button:has-text("Use Template")');
    
    // Delete template
    await page.click('[title="Delete template"]');
    await page.click('button:has-text("OK")'); // Confirm dialog
    
    // Verify template removed
    await expect(page.locator('text=My Weekly Report Template')).not.toBeVisible();
  });

  test('should calculate due date from offset', async ({ page }) => {
    // Use template with 7-day offset
    // Verify due date is 7 days from now
    // ... test implementation
  });

  test('should preserve subtasks and tags when using template', async ({ page }) => {
    // Use template
    // Verify subtasks are created
    // Verify tags are assigned
    // ... test implementation
  });
});
```

#### 4.2 Manual Testing Checklist

**Template Creation**:
- [ ] Can save todo as template from expanded view
- [ ] Template name is required
- [ ] Template name max 50 characters
- [ ] Cannot create duplicate template names
- [ ] Due date offset is optional
- [ ] Subtasks are serialized correctly
- [ ] Tags are preserved
- [ ] Priority is preserved

**Template Usage**:
- [ ] "Use Template" button opens modal
- [ ] Templates list shows all user templates
- [ ] Template preview shows correct metadata
- [ ] Using template creates todo with correct title
- [ ] Using template creates todo with correct priority
- [ ] Using template creates all subtasks
- [ ] Using template assigns all tags
- [ ] Due date is calculated correctly from offset
- [ ] Creating todo from template doesn't modify template

**Template Management**:
- [ ] Can view list of templates
- [ ] Can delete template
- [ ] Deleting template removes tag associations
- [ ] Can edit template (if implemented)
- [ ] Templates are user-isolated (can't see other users' templates)

**Edge Cases**:
- [ ] Empty subtasks array handled correctly
- [ ] Invalid JSON in subtasks_json handled gracefully
- [ ] Missing tags handled correctly
- [ ] Null offset handled correctly
- [ ] Very long template names truncated/rejected
- [ ] Using template with deleted tags handled correctly

---

## Integration Points

### With Existing Features

1. **Todo CRUD (PRP 01)**
   - Templates create new todos using todoDB.create()
   - All todo validation rules apply to template-created todos

2. **Subtasks (PRP 05)**
   - Subtasks stored as JSON in template
   - Subtasks recreated when using template
   - Position ordering preserved

3. **Tags (PRP 06)**
   - Template-tag many-to-many relationship
   - Tags assigned to todos created from templates
   - Deleted tags don't break templates (just not assigned)

4. **Priority System (PRP 02)**
   - Priority stored in template
   - Applied to todos created from template

5. **Authentication (PRP 11)**
   - Templates scoped to user_id
   - Session required for all template operations

### Database Migration Path

If templates table already exists (per copilot-instructions.md):
- Verify schema matches specification
- Add any missing indexes
- No data migration needed (new feature)

If templates table doesn't exist:
- Run schema creation SQL
- Create indexes
- No seed data needed

---

## Success Criteria

### Functional
- ✅ Users can save todos as templates
- ✅ Templates include title, priority, subtasks, tags
- ✅ Templates have optional due date offset
- ✅ Users can view list of their templates
- ✅ Users can use templates to create new todos
- ✅ Using template calculates correct due date
- ✅ Users can delete templates
- ✅ Template names are unique per user

### Non-Functional
- ✅ JSON parsing < 10ms for typical templates
- ✅ Keyboard accessible (Tab, Enter, Escape)
- ✅ Screen reader friendly
- ✅ Works in dark mode
- ✅ User data isolation enforced
- ✅ No SQL injection vulnerabilities

### User Experience
- ✅ Clear visual feedback on template save
- ✅ Template preview shows all metadata
- ✅ Confirmation required for deletion
- ✅ Error messages are user-friendly
- ✅ Responsive design (mobile friendly)

---

## Out of Scope (Future Enhancements)

- ❌ Template categories/folders
- ❌ Public template library
- ❌ Template sharing between users
- ❌ Template versioning
- ❌ Template variables/placeholders
- ❌ Template usage analytics
- ❌ Template recommendations
- ❌ Bulk template operations

---

## Estimated Timeline

- **Phase 1 (Database)**: 2-3 hours
- **Phase 2 (API)**: 4-6 hours
- **Phase 3 (UI)**: 6-8 hours
- **Phase 4 (Testing)**: 3-4 hours

**Total**: 15-21 hours for complete implementation

---

## References

- **PRP Document**: [PRPs/07-template-system.md](PRPs/07-template-system.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md) - Section 9: Todo Templates
- **Architecture**: [PRPs/ARCHITECTURE.md](PRPs/ARCHITECTURE.md)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Ready for Implementation  
**Next Steps**: Begin Phase 1 - Database Schema Setup
