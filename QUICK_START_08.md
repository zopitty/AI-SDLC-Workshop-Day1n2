# Quick Start: Implementing Search & Filtering

This guide will help you quickly implement the Search & Filtering feature (PRP 08) in your Todo app.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Todo CRUD operations (PRP 01) implemented
- ✅ Priority system (PRP 02) implemented
- ✅ Tag system (PRP 06) implemented
- ✅ React 19+ with TypeScript
- ✅ Tailwind CSS configured

## ⚡ Implementation Steps

### Step 1: Copy Reference Files (5 minutes)

```bash
# From the repository root, copy the reference implementation
cp -r reference-implementation/lib/hooks/* your-app/lib/hooks/
cp -r reference-implementation/components/* your-app/components/
```

### Step 2: Update Your Main Page (10 minutes)

Open `app/page.tsx` and add the filter functionality. See `reference-implementation/example-integration.tsx` for a complete example.

Key changes:
1. Import the new hooks and components
2. Add filter state management
3. Use debounced search
4. Replace `todos` with `filteredTodos` in your render

```typescript
// Add these imports
import { SearchBar } from '@/components/SearchBar';
import { FilterControls } from '@/components/FilterControls';
import { FilterSummary } from '@/components/FilterSummary';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useFilteredTodos, getActiveFilterDescriptions } from '@/lib/hooks/useFilteredTodos';
import type { FilterState } from '@/lib/hooks/useFilteredTodos';

// Add filter state
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState<FilterState>({
  searchQuery: '',
  priority: 'all',
  status: 'all',
  tags: [],
  dueDateRange: null,
  showOverdue: false,
  showNoDueDate: false,
});

// Add debouncing
const debouncedSearch = useDebounce(searchQuery, 300);

// Update filter state when debounced search changes
useEffect(() => {
  setFilters(prev => ({ ...prev, searchQuery: debouncedSearch }));
}, [debouncedSearch]);

// Get filtered todos
const filteredTodos = useFilteredTodos(todos, filters);

// Add handlers
const handleFilterChange = (updates: Partial<FilterState>) => {
  setFilters(prev => ({ ...prev, ...updates }));
};

const handleClearFilters = () => {
  setSearchQuery('');
  setFilters({
    searchQuery: '',
    priority: 'all',
    status: 'all',
    tags: [],
    dueDateRange: null,
    showOverdue: false,
    showNoDueDate: false,
  });
};
```

### Step 3: Add UI Components (5 minutes)

Add the filter UI to your page:

```tsx
return (
  <div className="container mx-auto px-4 py-8">
    <h1>My Todos</h1>

    {/* Add Search & Filter Section */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={handleClearFilters}
      />
      
      <div className="mt-6">
        <FilterControls
          filters={filters}
          onChange={handleFilterChange}
          onClearAll={handleClearFilters}
          availableTags={tags}
        />
      </div>
    </div>

    {/* Add Filter Summary */}
    <FilterSummary
      totalCount={todos.length}
      filteredCount={filteredTodos.length}
      activeFilters={getActiveFilterDescriptions(filters, tags)}
    />

    {/* Update Todo List to use filteredTodos */}
    {filteredTodos.length === 0 ? (
      <EmptyState onClearFilters={handleClearFilters} />
    ) : (
      <TodoList todos={filteredTodos} />
    )}
  </div>
);
```

### Step 4: Add Tests (Optional, 10 minutes)

Copy the test file and adapt it to your project:

```bash
cp reference-implementation/tests/08-search-filtering.spec.ts your-app/tests/
```

Update the test helpers to match your app's structure.

### Step 5: Verify Implementation (5 minutes)

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Test these scenarios**:
   - [ ] Type in search bar → results update after 300ms
   - [ ] Click priority filter → shows only that priority
   - [ ] Click multiple tag filters → shows todos with ALL tags
   - [ ] Combine search + filters → results match all criteria
   - [ ] Click "Clear all filters" → resets everything
   - [ ] Press "/" key → search bar gets focus
   - [ ] Search shows results in title and tags
   - [ ] Empty state shows when no results

3. **Check accessibility**:
   - [ ] Tab through all filter buttons
   - [ ] Screen reader announces result count changes
   - [ ] All buttons have proper labels
   - [ ] Keyboard shortcuts work

## 🎯 Acceptance Criteria

Verify all these work before considering the feature complete:

- ✅ User can search by todo title (case-insensitive, partial match)
- ✅ User can search by tag name
- ✅ Search is debounced (300ms delay)
- ✅ User can filter by priority (High/Medium/Low)
- ✅ User can filter by status (All/Active/Completed)
- ✅ User can filter by multiple tags (AND logic)
- ✅ User can filter by "Overdue" preset
- ✅ Filters combine with AND logic (all must match)
- ✅ User can clear all filters with one click
- ✅ Filter summary shows result count and active filters
- ✅ Empty state displayed when no results
- ✅ Keyboard shortcut "/" focuses search bar
- ✅ Screen reader announces result count changes

## 🐛 Troubleshooting

### Issue: Search doesn't work

**Check:**
1. Are you using `debouncedSearch` in the filter state?
2. Is the search query being passed to `useFilteredTodos`?
3. Do your todos have the `title` field populated?

```typescript
// ✅ Correct
const debouncedSearch = useDebounce(searchQuery, 300);
useEffect(() => {
  setFilters(prev => ({ ...prev, searchQuery: debouncedSearch }));
}, [debouncedSearch]);

// ❌ Wrong
setFilters({ ...filters, searchQuery }); // Not debounced!
```

### Issue: Tag filter doesn't work

**Check:**
1. Are todos fetched with tags included?
2. Is the tag relationship properly populated?

```typescript
// API should return todos with tags
{
  id: 1,
  title: "Buy groceries",
  tags: [{ id: 1, name: "shopping", color: "#3b82f6" }]
}
```

### Issue: Filters don't combine

**Check:**
1. Each filter should narrow results (AND logic)
2. Filters should run sequentially in `useFilteredTodos`

```typescript
// ✅ Correct (AND logic)
result = result.filter(...); // Each filter narrows results

// ❌ Wrong (OR logic)
result = result.concat(...); // Don't use concat!
```

### Issue: Performance is slow

**Check:**
1. Is `useMemo` being used in `useFilteredTodos`?
2. Are you passing stable filter object references?
3. How many todos do you have? (> 200 may need optimization)

```typescript
// ✅ Correct - memoized
const filteredTodos = useFilteredTodos(todos, filters);

// ❌ Wrong - creates new object each render
const filteredTodos = useFilteredTodos(todos, { searchQuery, priority, ... });
```

## 📚 Additional Resources

- **Full PRP**: [PRPs/08-search-filtering.md](./PRPs/08-search-filtering.md)
- **Implementation Guide**: [PRPs/IMPLEMENTATION-08-search-filtering.md](./PRPs/IMPLEMENTATION-08-search-filtering.md)
- **Reference Implementation**: [reference-implementation/](./reference-implementation/)
- **Example Integration**: [reference-implementation/example-integration.tsx](./reference-implementation/example-integration.tsx)

## 💡 Pro Tips

1. **Debouncing**: Adjust the debounce delay based on your needs:
   - 150ms: Very responsive, more re-renders
   - 300ms: Good balance (recommended)
   - 500ms: Less responsive, fewer re-renders

2. **Filter Persistence**: Save filters to localStorage:
   ```typescript
   useEffect(() => {
     localStorage.setItem('todoFilters', JSON.stringify(filters));
   }, [filters]);
   ```

3. **URL State**: Add filters to URL for sharing:
   ```typescript
   const searchParams = new URLSearchParams(window.location.search);
   searchParams.set('search', searchQuery);
   window.history.pushState({}, '', `?${searchParams}`);
   ```

4. **Performance**: For > 200 todos, consider:
   - Virtual scrolling (react-window)
   - Server-side filtering
   - Pagination

## ✅ Final Checklist

Before marking this feature as complete:

- [ ] All acceptance criteria met
- [ ] Tests passing (if added)
- [ ] Keyboard shortcuts work
- [ ] Screen reader tested
- [ ] Dark mode looks good
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Debouncing works correctly
- [ ] Empty state displays properly
- [ ] Filter summary accurate
- [ ] Documentation updated (if needed)

## 🎉 You're Done!

Congratulations! You've successfully implemented the Search & Filtering feature. Users can now easily find and organize their todos.

**Next suggested features**:
- PRP 07: Template System
- PRP 09: Export & Import
- PRP 10: Calendar View

---

**Estimated Time**: 30-45 minutes  
**Difficulty**: Low-Medium  
**Status**: Ready to implement  
**Version**: 1.0
