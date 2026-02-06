# Reference Implementation: Search & Filtering (PRP 08)

This directory contains a complete reference implementation for the Search & Filtering feature as specified in PRP 08.

## 📁 Directory Structure

```
reference-implementation/
├── lib/
│   └── hooks/
│       ├── useDebounce.ts          # Debounce hook for search input
│       └── useFilteredTodos.ts     # Main filtering logic with memoization
├── components/
│   ├── SearchBar.tsx               # Search input with keyboard shortcuts
│   ├── FilterControls.tsx          # All filter controls (priority, status, tags)
│   └── FilterSummary.tsx           # Display active filters and result count
├── tests/
│   └── 08-search-filtering.spec.ts # Complete E2E test suite
├── example-integration.tsx         # Example of integrating all components
└── README.md                       # This file
```

## 🚀 Quick Start

### 1. Copy Files to Your Project

```bash
# Copy hooks
cp -r reference-implementation/lib/hooks/* your-project/lib/hooks/

# Copy components
cp -r reference-implementation/components/* your-project/components/

# Copy tests
cp reference-implementation/tests/08-search-filtering.spec.ts your-project/tests/
```

### 2. Install Dependencies

The implementation uses standard React hooks (no external dependencies needed beyond React itself).

### 3. Integrate into Your App

See `example-integration.tsx` for a complete integration example.

## 📚 Component Documentation

### useDebounce Hook

Debounces any value with a configurable delay (default 300ms).

```typescript
import { useDebounce } from '@/lib/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);
```

**Parameters:**
- `value: T` - The value to debounce
- `delay: number` - Delay in milliseconds (default: 300)

**Returns:** Debounced value

### useFilteredTodos Hook

Filters todos based on multiple criteria using memoization for performance.

```typescript
import { useFilteredTodos } from '@/lib/hooks/useFilteredTodos';

const filteredTodos = useFilteredTodos(todos, filters);
```

**Parameters:**
- `todos: Todo[]` - Array of todos to filter
- `filters: FilterState` - Filter criteria object

**Returns:** Filtered todos array

**Filter Logic:**
1. Search filter (title + tags, case-insensitive, partial match)
2. Priority filter (high/medium/low)
3. Status filter (all/active/completed)
4. Tag filter (AND logic - must have ALL selected tags)
5. Due date range filter
6. Overdue filter
7. No due date filter

### SearchBar Component

Search input with debouncing, clear button, and keyboard shortcuts.

```typescript
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
  placeholder="Search todos and tags..."
/>
```

**Props:**
- `value: string` - Current search value
- `onChange: (value: string) => void` - Handler for value changes
- `onClear: () => void` - Handler for clear button
- `placeholder?: string` - Optional placeholder text
- `className?: string` - Optional CSS class names

**Features:**
- Press `/` to focus search bar
- Press `ESC` to clear search (when focused)
- Visual clear button (×) appears when text is entered
- Fully accessible with ARIA labels

### FilterControls Component

All filter UI controls in one component.

```typescript
<FilterControls
  filters={filters}
  onChange={handleFilterChange}
  onClearAll={handleClearFilters}
  availableTags={tags}
/>
```

**Props:**
- `filters: FilterState` - Current filter state
- `onChange: (updates: Partial<FilterState>) => void` - Handler for filter changes
- `onClearAll: () => void` - Handler for clear all button
- `availableTags: Tag[]` - Available tags for filtering

**Includes:**
- Priority filter (All/High/Medium/Low pills)
- Status filter (All/Active/Completed pills)
- Tag multi-select (color-coded tag buttons)
- Quick filters (Overdue, No Due Date)
- Clear all filters button (shown when filters active)

### FilterSummary Component

Displays filtered result count and active filter badges.

```typescript
<FilterSummary
  totalCount={todos.length}
  filteredCount={filteredTodos.length}
  activeFilters={activeFilterDescriptions}
/>
```

**Props:**
- `totalCount: number` - Total number of todos
- `filteredCount: number` - Number of filtered todos
- `activeFilters: string[]` - Array of active filter descriptions

**Features:**
- Shows "Showing X of Y todos" count
- Lists active filters as blue badges
- Accessible with `aria-live="polite"` for screen readers

## 🧪 Testing

The reference implementation includes a comprehensive E2E test suite covering all acceptance criteria from PRP 08.

### Running Tests

```bash
# Run all search and filtering tests
npx playwright test tests/08-search-filtering.spec.ts

# Run in UI mode for debugging
npx playwright test tests/08-search-filtering.spec.ts --ui

# Run specific test
npx playwright test tests/08-search-filtering.spec.ts -g "should filter by search query"
```

### Test Coverage

- ✅ Search by title (case-insensitive, partial match)
- ✅ Search by tag name
- ✅ Filter by priority (High/Medium/Low)
- ✅ Filter by status (Active/Completed)
- ✅ Filter by multiple tags (AND logic)
- ✅ Combine search and filters (AND logic)
- ✅ Clear search with button
- ✅ Clear all filters
- ✅ Empty state display
- ✅ Keyboard shortcuts (`/` to focus, `ESC` to clear)
- ✅ Filter summary display
- ✅ Debouncing behavior
- ✅ Screen reader announcements

## ♿ Accessibility Features

### Keyboard Support
- **`/`** - Focus search bar (from anywhere)
- **`ESC`** - Clear search (when search is focused)
- **`Tab`** - Navigate through filter buttons
- **`Space/Enter`** - Activate filter buttons

### Screen Reader Support
- All inputs have proper `aria-label` attributes
- Filter buttons use `aria-pressed` for toggle state
- Results announced via `aria-live="polite"` region
- Filter groups have `role="group"` and labels

### Visual Accessibility
- Color contrast meets WCAG AA standards
- Focus indicators on all interactive elements
- Dark mode support
- Responsive design

## 🎨 Styling

The components use Tailwind CSS classes with dark mode support. Key features:

- **Light/Dark Mode**: Automatic with `dark:` prefixes
- **Responsive**: Mobile-first design
- **Focus States**: Ring indicators on focus
- **Hover States**: Smooth transitions
- **Color-Coded Tags**: Custom background colors

### Customization

To customize styles, modify the className attributes in each component:

```typescript
// Example: Change filter button styles
<button
  className="px-4 py-2 rounded-lg bg-purple-600 text-white" // Your custom styles
  onClick={() => onChange({ priority })}
>
  {priority}
</button>
```

## 🔧 Configuration

### Debounce Delay

Default debounce delay is 300ms. To change:

```typescript
const debouncedSearch = useDebounce(searchQuery, 500); // 500ms delay
```

### Filter Default State

```typescript
const [filters, setFilters] = useState<FilterState>({
  searchQuery: '',
  priority: 'all',
  status: 'all',
  tags: [],
  dueDateRange: null,
  showOverdue: false,
  showNoDueDate: false,
});
```

## 📊 Performance

### Optimization Strategies

1. **Memoization**: `useMemo` in `useFilteredTodos` prevents unnecessary recalculations
2. **Debouncing**: 300ms delay reduces re-renders while typing
3. **Client-side filtering**: O(n) complexity, acceptable for < 100 todos

### Performance Targets

- ✅ Filtering < 100 todos: < 10ms
- ✅ Debounce delay: 300ms
- ✅ Re-renders: Only when necessary (memoized)

### Future Optimizations

For > 200 todos, consider:
- Virtual scrolling (react-window)
- Server-side filtering
- IndexedDB caching
- Web Workers for filtering

## 🔒 Security

### XSS Prevention
- React auto-escapes all user input
- No `dangerouslySetInnerHTML` used
- Search queries sanitized with `.trim()`

### Privacy
- All filtering client-side
- No search queries sent to server
- No PII exposed in URLs

## 🐛 Common Issues

### Issue: Debouncing not working
**Solution**: Check that you're using the debounced value, not the raw value:
```typescript
// ❌ Wrong
const filteredTodos = useFilteredTodos(todos, { ...filters, searchQuery });

// ✅ Correct
const debouncedSearch = useDebounce(searchQuery, 300);
const filteredTodos = useFilteredTodos(todos, { ...filters, searchQuery: debouncedSearch });
```

### Issue: Filters not combining correctly
**Solution**: Ensure all filters use AND logic in `useFilteredTodos`:
```typescript
// Each filter should narrow results, not broaden them
result = result.filter(...); // NOT result.concat(...)
```

### Issue: Tags filter not working
**Solution**: Verify todos have tags populated:
```typescript
// Ensure todos have tags array
const todosWithTags = await fetch('/api/todos?include=tags');
```

## 📖 Related Documentation

- **PRP 08**: [../PRPs/08-search-filtering.md](../PRPs/08-search-filtering.md) - Full requirements
- **Implementation Guide**: [../PRPs/IMPLEMENTATION-08-search-filtering.md](../PRPs/IMPLEMENTATION-08-search-filtering.md) - Step-by-step guide
- **User Guide**: [../USER_GUIDE.md](../USER_GUIDE.md) - End-user documentation

## 🤝 Contributing

To improve this reference implementation:

1. Follow the coding style in existing files
2. Add tests for new features
3. Update this README
4. Ensure accessibility compliance
5. Test in both light and dark modes

## 📝 License

This reference implementation is part of the Todo App workshop materials.

---

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Complete and tested  
**Dependencies**: React 19+, TypeScript 5+, Tailwind CSS 4+
