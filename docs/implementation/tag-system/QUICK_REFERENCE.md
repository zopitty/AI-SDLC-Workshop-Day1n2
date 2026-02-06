# Tag System - Quick Reference Card

## 🚀 5-Minute Integration Guide

### 1. Database (1 minute)
```typescript
// In lib/db.ts, add to initialization:
db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK(length(name) <= 30),
    color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f]{6}'),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
  CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
`);
```

### 2. Types (1 minute)
```typescript
// Copy from types.ts to lib/db.ts
export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Todo {
  // ... existing fields
  tags?: Tag[];
}

export const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  // ... 8 more colors
];

export function validateTagData(name: string, color: string) {
  // ... validation logic
}
```

### 3. Database Operations (1 minute)
```typescript
// Copy from database.md to lib/db.ts
export const tagDB = {
  list(userId: number): Tag[] { /* ... */ },
  create(userId: number, name: string, color: string): Tag { /* ... */ },
  update(tagId: number, userId: number, name: string, color: string): void { /* ... */ },
  delete(tagId: number, userId: number): void { /* ... */ },
};

export const todoTagDB = {
  assign(todoId: number, tagId: number): void { /* ... */ },
  unassign(todoId: number, tagId: number): void { /* ... */ },
  getTagsForTodo(todoId: number): Tag[] { /* ... */ },
  copyTags(fromTodoId: number, toTodoId: number): void { /* ... */ },
};
```

### 4. API Routes (30 seconds each)
```bash
# Copy 3 files to app/api/
cp docs/implementation/tag-system/api-routes/tags-route.ts app/api/tags/route.ts
cp docs/implementation/tag-system/api-routes/tags-id-route.ts app/api/tags/[id]/route.ts
cp docs/implementation/tag-system/api-routes/todos-id-tags-route.ts app/api/todos/[id]/tags/route.ts
```

### 5. Components (30 seconds each)
```bash
# Copy 4 components
cp docs/implementation/tag-system/components/*.tsx components/
```

### 6. Update Main Page (1 minute)
```typescript
// In app/page.tsx
import { TagPill, TagSelector, TagManager } from '@/components';

export default function TodoPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
  // Fetch tags on mount
  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTags(data.tags));
  }, []);

  return (
    <>
      <button onClick={() => setIsTagManagerOpen(true)}>
        Manage Tags
      </button>
      
      {/* Display tags on todos */}
      {todos.map(todo => (
        <div key={todo.id}>
          <h3>{todo.title}</h3>
          <div className="flex gap-2">
            {todo.tags?.map(tag => (
              <TagPill key={tag.id} tag={tag} />
            ))}
          </div>
          <TagSelector
            availableTags={tags}
            selectedTags={todo.tags || []}
            onChange={(newTags) => handleUpdateTodoTags(todo.id, newTags)}
          />
        </div>
      ))}

      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />
    </>
  );
}
```

## 📖 Component Quick Reference

### TagPill
```tsx
// Simple display
<TagPill tag={tag} />

// Clickable for filtering
<TagPill tag={tag} onClick={(t) => setFilter(t.id)} />

// Removable
<TagPill tag={tag} removable onRemove={(t) => removeTag(t.id)} />

// Small size
<TagPill tag={tag} size="sm" />
```

### TagSelector
```tsx
// Basic
<TagSelector
  availableTags={allTags}
  selectedTags={todo.tags || []}
  onChange={(tags) => updateTodoTags(tags)}
/>

// With create new tag
<TagSelector
  availableTags={allTags}
  selectedTags={selectedTags}
  onChange={setSelectedTags}
  onCreateNew={(name, color) => createTag(name, color)}
/>

// With max limit
<TagSelector
  availableTags={allTags}
  selectedTags={selectedTags}
  onChange={setSelectedTags}
  maxTags={5}
/>
```

### TagColorPicker
```tsx
// Default palette
<TagColorPicker
  selectedColor={color}
  onChange={setColor}
/>

// Custom palette only
<TagColorPicker
  selectedColor={color}
  onChange={setColor}
  allowCustom={false}
/>

// Custom colors
const BRAND_COLORS = [
  { name: 'Primary', value: '#FF0000' },
  { name: 'Secondary', value: '#00FF00' },
];
<TagColorPicker
  selectedColor={color}
  onChange={setColor}
  colors={BRAND_COLORS}
/>
```

### TagManager
```tsx
<TagManager
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  tags={tags}
  onCreateTag={(name, color) => createTag(name, color)}
  onUpdateTag={(id, name, color) => updateTag(id, name, color)}
  onDeleteTag={(id) => deleteTag(id)}
/>
```

## 🔌 API Quick Reference

### GET /api/tags
```typescript
// Fetch all tags
const res = await fetch('/api/tags');
const { tags } = await res.json();
// Returns: { tags: Tag[] }
```

### POST /api/tags
```typescript
// Create tag
const res = await fetch('/api/tags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'work', color: '#3B82F6' })
});
const { tag } = await res.json();
// Returns: { tag: Tag }
```

### PUT /api/tags/[id]
```typescript
// Update tag
const res = await fetch(`/api/tags/${tagId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Work Tasks', color: '#1E40AF' })
});
const { tag } = await res.json();
```

### DELETE /api/tags/[id]
```typescript
// Delete tag (cascade removes from todos)
await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
// Returns: 204 No Content
```

### POST /api/todos/[id]/tags
```typescript
// Assign tag to todo
const res = await fetch(`/api/todos/${todoId}/tags`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tag_id: tagId })
});
const { todo } = await res.json();
// Returns: { todo: Todo } (with updated tags array)
```

### DELETE /api/todos/[id]/tags/[tagId]
```typescript
// Unassign tag from todo
await fetch(`/api/todos/${todoId}/tags/${tagId}`, { method: 'DELETE' });
// Returns: 204 No Content
```

## 🧪 Testing Quick Reference

### Run E2E Tests
```bash
# All tag tests
npx playwright test tests/*-tag-*.spec.ts

# Specific test file
npx playwright test tests/06-tag-crud.spec.ts
npx playwright test tests/07-tag-assignment.spec.ts
npx playwright test tests/08-tag-filtering.spec.ts

# UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Manual Testing Checklist
- [ ] Create tag via Tag Manager
- [ ] Edit tag name and color
- [ ] Delete tag (confirm cascade)
- [ ] Assign tag to todo
- [ ] Remove tag from todo
- [ ] Filter by clicking tag
- [ ] Clear filter
- [ ] Create tag from TagSelector
- [ ] Test keyboard navigation
- [ ] Test on mobile

## ⚡ Performance Tips

```typescript
// Debounce search input
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebouncedValue(searchQuery, 300);

// Memoize filtered tags
const filteredTags = useMemo(() => 
  tags.filter(t => t.name.includes(debouncedSearch)),
  [tags, debouncedSearch]
);

// Batch tag assignments
const assignMultipleTags = db.transaction((todoId, tagIds) => {
  for (const tagId of tagIds) {
    todoTagDB.assign(todoId, tagId);
  }
});

// Cache tags list (refresh every 5 minutes)
const { data: tags } = useSWR('/api/tags', fetcher, {
  refreshInterval: 300000
});
```

## 🔒 Security Checklist

- ✅ Session validation on all routes
- ✅ Ownership check (user can only access own tags/todos)
- ✅ Input validation (name length, color format)
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS prevention (text rendering, validated colors)

## ♿ Accessibility Checklist

- ✅ Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- ✅ ARIA labels on all interactive elements
- ✅ Focus indicators visible
- ✅ Color contrast > 4.5:1
- ✅ Error messages with role="alert"
- ✅ Screen reader friendly

## 📊 File Structure
```
docs/implementation/tag-system/
├── README.md                      # Full documentation (14KB)
├── QUICK_REFERENCE.md             # This file
├── database.md                    # DB schema + operations (9.6KB)
├── types.ts                       # TypeScript definitions (10.9KB)
├── integration.md                 # Step-by-step guide (19KB)
├── api-routes/
│   ├── tags-route.ts             # GET/POST /api/tags (4.3KB)
│   ├── tags-id-route.ts          # PUT/DELETE /api/tags/[id] (6.3KB)
│   └── todos-id-tags-route.ts    # Assign/unassign (8.6KB)
├── components/
│   ├── TagPill.tsx               # Tag badge (5.7KB)
│   ├── TagSelector.tsx           # Multi-select dropdown (11.2KB)
│   ├── TagColorPicker.tsx        # Color picker (11.2KB)
│   └── TagManager.tsx            # CRUD modal (16.7KB)
└── tests/
    ├── tag-crud.spec.ts          # Tag CRUD tests (12.2KB)
    ├── tag-assignment.spec.ts    # Assignment tests (15.2KB)
    └── tag-filtering.spec.ts     # Filtering tests (13.8KB)

Total: 14 files, 3,373 LOC, ~145 KB
```

## 🆘 Common Issues

**Q: Tags not showing on todos?**  
A: Check `todoDB.list()` includes `todoTagDB.getTagsForTodo()` call.

**Q: Duplicate tag error not showing?**  
A: Catch `SQLITE_CONSTRAINT` error and return 409 status.

**Q: Dropdown won't close?**  
A: Check `useEffect` cleanup for click-outside listener.

**Q: Filter not working?**  
A: Verify API includes `tagId` in WHERE clause with JOIN.

**Q: Can't type in custom color input?**  
A: Check input is not `disabled` and has proper `onChange` handler.

## 📞 Need Help?

1. Read full docs: `docs/implementation/tag-system/README.md`
2. Check integration guide: `docs/implementation/tag-system/integration.md`
3. Review PRP: `PRPs/06-tag-system.md`
4. Open GitHub issue with error details

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Estimated Integration Time**: 4-6 hours
