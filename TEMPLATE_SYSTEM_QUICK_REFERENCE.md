# Template System - Quick Reference Card

One-page reference for implementing the Template System feature (PRP 07).

---

## 🎯 Core Concept

**Save todos as templates** → **Reuse them** to create new todos with:
- Same title, priority, tags, subtasks
- Calculated due date (offset from "now")

---

## 📊 Database Tables

### templates
```sql
id, user_id, name, title, priority, 
subtasks_json, due_date_offset_days, created_at
```

### template_tags
```sql
template_id, tag_id
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/[id]` | Get template |
| PUT | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete template |
| POST | `/api/templates/[id]/use` | Create todo from template |

---

## 💾 Data Structures

### Template Interface
```typescript
interface Template {
  id: number;
  user_id: number;
  name: string;              // Max 50 chars, unique per user
  title: string;
  priority: 'high' | 'medium' | 'low';
  subtasks_json: string;     // JSON: [{title, position}, ...]
  due_date_offset_days: number | null;
  created_at: string;
}
```

### Subtasks JSON Format
```json
[
  {"title": "Step 1", "position": 0},
  {"title": "Step 2", "position": 1}
]
```

---

## 🎨 UI Components

### SaveTemplateModal
- Input: Template name (max 50 chars)
- Dropdown: Due date offset (optional)
- Preview: What will be saved
- Actions: Save / Cancel

### UseTemplateModal
- List: All user templates
- Cards: Template preview (name, title, priority, counts)
- Actions: Use / Edit / Delete

### TemplateCard
- Display: Name, title, priority badge
- Badges: Tags count, subtasks count, offset
- Buttons: Use / Edit / Delete

---

## 🔄 Key Functions

### lib/db.ts
```typescript
templateDB.create(userId, {name, title, priority, subtasks_json, offset})
templateDB.get(id, userId)
templateDB.list(userId)
templateDB.update(id, userId, data)
templateDB.delete(id, userId)

templateTagDB.assign(templateId, tagId)
templateTagDB.getTags(templateId)
templateTagDB.clearAll(templateId)
```

### app/page.tsx
```typescript
handleSaveAsTemplate(todo)
handleSaveTemplate(name, offsetDays)
handleUseTemplate(templateId)
handleDeleteTemplate(templateId)
fetchTemplates()
```

---

## ⏰ Singapore Timezone Pattern

```typescript
import { getSingaporeNow } from '@/lib/timezone';

// Calculate due date from offset
const now = getSingaporeNow();
now.setDate(now.getDate() + template.due_date_offset_days);
const dueDate = now.toISOString();
```

---

## ✅ Validation Rules

### Template Name
- Required
- 1-50 characters
- Unique per user
- Trimmed whitespace

### Priority
- Must be: 'high', 'medium', or 'low'

### Subtasks JSON
- Valid JSON format
- Array of objects: `{title: string, position: number}`
- Graceful fallback to `[]` on parse error

### Due Date Offset
- Optional (can be null)
- Integer (days)
- Common values: 1, 3, 7, 14, 30

---

## 🔒 Security Checklist

- ✅ Session required for all endpoints
- ✅ Filter all queries by `user_id`
- ✅ Prepared statements (SQL injection prevention)
- ✅ Input validation (length, format, type)
- ✅ Sanitize JSON before parsing
- ✅ UNIQUE constraint on template names

---

## 🧪 Testing Scenarios

### Happy Path
1. Save todo as template
2. View templates list
3. Use template → todo created
4. Verify subtasks created
5. Verify tags assigned
6. Verify due date calculated
7. Delete template

### Edge Cases
- Duplicate template name → 409 error
- Missing required fields → 400 error
- Template not found → 404 error
- Invalid JSON in database → default to []
- Deleted tag → skip during assignment
- Null offset → no due date set
- Empty subtasks → creates todo with no subtasks

### Security
- Unauthenticated request → 401 error
- Access other user's template → 404 error
- SQL injection attempt → escaped by prepared statements

---

## 🐛 Common Mistakes to Avoid

❌ **DON'T:**
- Use `new Date()` → Use `getSingaporeNow()`
- Forget to `await params` in API routes
- Skip `session.userId` filter in queries
- Store subtasks as array → Store as JSON string
- Allow template name > 50 chars
- Allow duplicate names per user

✅ **DO:**
- Import `getSingaporeNow` from `lib/timezone.ts`
- Always `const { id } = await params`
- Filter: `WHERE user_id = ?`
- `JSON.stringify(subtasks)` before storing
- Validate name length: `CHECK(length(name) <= 50)`
- Enforce uniqueness: `UNIQUE(user_id, name)`

---

## 📏 Code Snippet: Create Template

```typescript
// API Route: POST /api/templates
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: 'Not authenticated'}, {status: 401});

  const {name, title, priority, subtasks, tag_ids, due_date_offset_days} = await request.json();

  // Validate
  if (!name || name.length > 50) return NextResponse.json({error: 'Invalid name'}, {status: 400});

  // Create template
  const templateId = templateDB.create(session.userId, {
    name: name.trim(),
    title,
    priority,
    subtasks_json: JSON.stringify(subtasks || []),
    due_date_offset_days: due_date_offset_days || null
  });

  // Assign tags
  for (const tagId of tag_ids || []) {
    templateTagDB.assign(templateId, tagId);
  }

  return NextResponse.json({template: templateDB.get(templateId, session.userId)}, {status: 201});
}
```

---

## 📏 Code Snippet: Use Template

```typescript
// API Route: POST /api/templates/[id]/use
export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: 'Not authenticated'}, {status: 401});

  const {id} = await params;
  const template = templateDB.get(parseInt(id), session.userId);
  if (!template) return NextResponse.json({error: 'Not found'}, {status: 404});

  // Calculate due date
  let dueDate = null;
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

  // Create subtasks
  const subtasks = JSON.parse(template.subtasks_json || '[]');
  for (const st of subtasks) {
    subtaskDB.create(todoId, {title: st.title, position: st.position, completed: false});
  }

  // Assign tags
  const tags = templateTagDB.getTags(template.id);
  for (const tag of tags) {
    todoTagDB.assign(todoId, tag.id);
  }

  return NextResponse.json({todo: todoDB.get(todoId, session.userId)});
}
```

---

## 📏 Code Snippet: Save Template Button

```typescript
// In app/page.tsx (inside todo detail view)
<button
  onClick={() => {
    setSelectedTodoForTemplate(todo);
    setSaveTemplateModalOpen(true);
  }}
  className="text-sm text-blue-600 hover:text-blue-800"
>
  💾 Save as Template
</button>
```

---

## 📏 Code Snippet: Template Card

```typescript
function TemplateCard({template, onUse, onDelete}: {
  template: Template & {tags?: Tag[]};
  onUse: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const subtasks = JSON.parse(template.subtasks_json || '[]');
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{template.name}</h3>
      <p className="text-sm text-gray-600">{template.title}</p>
      
      <div className="flex gap-2 my-2">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100">
          {template.priority}
        </span>
        {template.tags && <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
          {template.tags.length} tags
        </span>}
        {subtasks.length > 0 && <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
          {subtasks.length} subtasks
        </span>}
      </div>
      
      <button
        onClick={() => onUse(template.id)}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Use Template
      </button>
    </div>
  );
}
```

---

## 🎯 Success Criteria

✅ **Functional**
- Can save todo as template
- Can list templates
- Can use template to create todo
- Can delete template
- Template names unique per user
- Due date offset works
- Subtasks preserved
- Tags preserved

✅ **Non-Functional**
- JSON parsing < 10ms
- Keyboard accessible
- Dark mode support
- Mobile responsive
- User data isolated

---

## 📚 Full Documentation

- **Full Plan**: [IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md)
- **Checklist**: [TEMPLATE_SYSTEM_CHECKLIST.md](TEMPLATE_SYSTEM_CHECKLIST.md)
- **Guide**: [TEMPLATE_SYSTEM_GUIDE.md](TEMPLATE_SYSTEM_GUIDE.md)
- **Data Flow**: [TEMPLATE_SYSTEM_DATA_FLOW.md](TEMPLATE_SYSTEM_DATA_FLOW.md)
- **PRP Spec**: [PRPs/07-template-system.md](PRPs/07-template-system.md)

---

## ⏱️ Estimated Time

- **Phase 1** (Database): 2-3 hours
- **Phase 2** (API): 4-6 hours
- **Phase 3** (UI): 6-8 hours
- **Phase 4** (Testing): 3-4 hours
- **Total**: 15-21 hours

---

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Print this and keep at your desk! 📌**
