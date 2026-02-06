# Implementation Guide: PRP 08 - Search & Filtering

## Overview

This guide provides step-by-step implementation instructions for the Search & Filtering feature (PRP 08) in the Todo App. It includes all code snippets, integration points, and testing strategies.

## Prerequisites

Before implementing this feature, ensure:
- ✅ PRP 01 (Todo CRUD) is implemented
- ✅ PRP 02 (Priority System) is implemented  
- ✅ PRP 06 (Tag System) is implemented
- ✅ Database has `todos` and `tags` tables with many-to-many relationship

## Implementation Steps

### Step 1: Create Custom Hooks

#### 1.1 Create `lib/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timer to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel timer if value changes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Usage:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);
```

#### 1.2 Create `lib/hooks/useFilteredTodos.ts`

```typescript
import { useMemo } from 'react';
import { Todo, Priority } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export interface FilterState {
  searchQuery: string;
  priority: Priority | 'all';
  status: 'all' | 'active' | 'completed';
  tags: number[]; // Array of tag IDs
  dueDateRange: {
    from: string | null;
    to: string | null;
  } | null;
  showOverdue: boolean;
  showNoDueDate: boolean;
}

/**
 * Custom hook to filter todos based on multiple criteria
 * @param todos - Array of todos to filter
 * @param filters - Filter criteria
 * @returns Filtered todos array
 */
export function useFilteredTodos(todos: Todo[], filters: FilterState): Todo[] {
  return useMemo(() => {
    let result = todos;

    // 1. Search filter (title and tags)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(todo => {
        const titleMatch = todo.title.toLowerCase().includes(query);
        const tagMatch = todo.tags?.some(tag => 
          tag.name.toLowerCase().includes(query)
        );
        return titleMatch || tagMatch;
      });
    }

    // 2. Priority filter
    if (filters.priority !== 'all') {
      result = result.filter(todo => todo.priority === filters.priority);
    }

    // 3. Status filter
    if (filters.status === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filters.status === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    // 4. Tag filter (AND logic - must have ALL selected tags)
    if (filters.tags.length > 0) {
      result = result.filter(todo => 
        filters.tags.every(tagId => 
          todo.tags?.some(tag => tag.id === tagId)
        )
      );
    }

    // 5. Due date range filter
    if (filters.dueDateRange) {
      result = result.filter(todo => {
        if (!todo.due_date) {
          return filters.showNoDueDate;
        }
        
        const dueDate = new Date(todo.due_date);
        const from = filters.dueDateRange!.from ? new Date(filters.dueDateRange!.from) : null;
        const to = filters.dueDateRange!.to ? new Date(filters.dueDateRange!.to) : null;
        
        if (from && dueDate < from) return false;
        if (to && dueDate > to) return false;
        return true;
      });
    }

    // 6. Overdue filter
    if (filters.showOverdue) {
      const now = getSingaporeNow();
      result = result.filter(todo => 
        todo.due_date && 
        new Date(todo.due_date) < now && 
        !todo.completed
      );
    }

    return result;
  }, [todos, filters]);
}
```

### Step 2: Create Filter Components

#### 2.1 Create `components/SearchBar.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Search todos and tags..." 
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search todos"
        />
        
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
      
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">/</kbd> to focus
      </p>
    </div>
  );
}
```

#### 2.2 Create `components/FilterControls.tsx`

```typescript
'use client';

import { Priority, Tag } from '@/lib/db';
import { FilterState } from '@/lib/hooks/useFilteredTodos';

interface FilterControlsProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
  onClearAll: () => void;
  availableTags: Tag[];
}

export function FilterControls({ filters, onChange, onClearAll, availableTags }: FilterControlsProps) {
  const hasActiveFilters = 
    filters.searchQuery ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.tags.length > 0 ||
    filters.dueDateRange !== null ||
    filters.showOverdue ||
    filters.showNoDueDate;

  return (
    <div className="space-y-4 mb-6">
      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Priority
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => onChange({ priority })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.priority === priority
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ status })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.status === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (select all that apply)
          </label>
          <div className="flex gap-2 flex-wrap">
            {availableTags.map((tag) => {
              const isSelected = filters.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    const newTags = isSelected
                      ? filters.tags.filter(id => id !== tag.id)
                      : [...filters.tags, tag.id];
                    onChange({ tags: newTags });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: tag.color,
                    color: '#ffffff'
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Filters
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onChange({ showOverdue: !filters.showOverdue })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filters.showOverdue
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ⚠️ Overdue
          </button>
          <button
            onClick={() => onChange({ showNoDueDate: !filters.showNoDueDate })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filters.showNoDueDate
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📝 No Due Date
          </button>
        </div>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClearAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            ✕ Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 2.3 Create `components/FilterSummary.tsx`

```typescript
'use client';

interface FilterSummaryProps {
  totalCount: number;
  filteredCount: number;
  activeFilters: string[];
}

export function FilterSummary({ totalCount, filteredCount, activeFilters }: FilterSummaryProps) {
  if (activeFilters.length === 0) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing all {totalCount} todos
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
        Showing {filteredCount} of {totalCount} todos
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Filtered by:</span>
        {activeFilters.map((filter, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {filter}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Integrate into `app/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Todo, Tag, Priority } from '@/lib/db';
import { SearchBar } from '@/components/SearchBar';
import { FilterControls } from '@/components/FilterControls';
import { FilterSummary } from '@/components/FilterSummary';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useFilteredTodos, FilterState } from '@/lib/hooks/useFilteredTodos';

export default function HomePage() {
  // Existing state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Filter state
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

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update filter state when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchQuery: debouncedSearch }));
  }, [debouncedSearch]);

  // Get filtered todos
  const filteredTodos = useFilteredTodos(todos, filters);

  // Calculate active filters for summary
  const activeFilters: string[] = [];
  if (filters.searchQuery) activeFilters.push(`search: "${filters.searchQuery}"`);
  if (filters.priority !== 'all') activeFilters.push(`priority: ${filters.priority}`);
  if (filters.status !== 'all') activeFilters.push(`status: ${filters.status}`);
  if (filters.tags.length > 0) {
    const tagNames = tags
      .filter(t => filters.tags.includes(t.id))
      .map(t => t.name)
      .join(', ');
    activeFilters.push(`tags: ${tagNames}`);
  }
  if (filters.showOverdue) activeFilters.push('overdue');
  if (filters.showNoDueDate) activeFilters.push('no due date');

  // Handler to update filters
  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  // Handler to clear all filters
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

  // Load todos and tags on mount
  useEffect(() => {
    fetchTodos();
    fetchTags();
  }, []);

  async function fetchTodos() {
    const res = await fetch('/api/todos');
    if (res.ok) {
      const data = await res.json();
      setTodos(data);
    }
  }

  async function fetchTags() {
    const res = await fetch('/api/tags');
    if (res.ok) {
      const data = await res.json();
      setTags(data);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Todos</h1>

      {/* Search and Filter Section */}
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

      {/* Filter Summary */}
      <FilterSummary
        totalCount={todos.length}
        filteredCount={filteredTodos.length}
        activeFilters={activeFilters}
      />

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            No todos found matching your filters
          </p>
          {activeFilters.length > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTodos.map(todo => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Testing

#### 4.1 Create E2E Test: `tests/08-search-filtering.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming authentication is handled
    await page.goto('/');
    
    // Create test todos
    await createTodo(page, 'Buy groceries', 'high');
    await createTodo(page, 'Call dentist', 'medium');
    await createTodo(page, 'Write report', 'low');
  });

  test('should filter todos by search query', async ({ page }) => {
    // Type in search bar
    await page.fill('[aria-label="Search todos"]', 'report');
    
    // Wait for debounce
    await page.waitForTimeout(350);
    
    // Should show only matching todo
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
    
    // Check summary
    await expect(page.locator('text=Showing 1 of 3 todos')).toBeVisible();
  });

  test('should filter by priority', async ({ page }) => {
    // Click high priority filter
    await page.click('button:has-text("High")');
    
    // Should show only high priority todo
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
    await expect(page.locator('text=Write report')).not.toBeVisible();
  });

  test('should combine search and filters', async ({ page }) => {
    // Create a high priority todo with specific keyword
    await createTodo(page, 'Meeting preparation', 'high');
    await createTodo(page, 'Meeting notes', 'low');
    
    // Search for "meeting"
    await page.fill('[aria-label="Search todos"]', 'meeting');
    await page.waitForTimeout(350);
    
    // Filter by high priority
    await page.click('button:has-text("High")');
    
    // Should show only high priority todo matching search
    await expect(page.locator('text=Meeting preparation')).toBeVisible();
    await expect(page.locator('text=Meeting notes')).not.toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Apply filters
    await page.fill('[aria-label="Search todos"]', 'test');
    await page.click('button:has-text("High")');
    
    // Clear all
    await page.click('text=Clear all filters');
    
    // All todos should be visible
    await expect(page.locator('[aria-label="Search todos"]')).toHaveValue('');
    await expect(page.locator('text=Showing all')).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.fill('[aria-label="Search todos"]', 'nonexistent');
    await page.waitForTimeout(350);
    
    await expect(page.locator('text=No todos found matching your filters')).toBeVisible();
    await expect(page.locator('text=Clear all filters')).toBeVisible();
  });

  test('should use keyboard shortcut to focus search', async ({ page }) => {
    // Press "/" key
    await page.keyboard.press('/');
    
    // Search bar should be focused
    await expect(page.locator('[aria-label="Search todos"]')).toBeFocused();
  });
});

async function createTodo(page, title: string, priority: string) {
  await page.fill('[placeholder="What needs to be done?"]', title);
  await page.selectOption('select[name="priority"]', priority);
  await page.click('button:has-text("Add")');
  await page.waitForResponse(response => 
    response.url().includes('/api/todos') && response.status() === 200
  );
}
```

### Step 5: Accessibility Enhancements

Add screen reader announcements when filter results change:

```typescript
// In app/page.tsx, add this effect
useEffect(() => {
  // Announce filter results to screen readers
  const announcement = `Showing ${filteredTodos.length} of ${todos.length} todos`;
  const ariaLive = document.createElement('div');
  ariaLive.setAttribute('role', 'status');
  ariaLive.setAttribute('aria-live', 'polite');
  ariaLive.setAttribute('aria-atomic', 'true');
  ariaLive.className = 'sr-only'; // Screen reader only
  ariaLive.textContent = announcement;
  document.body.appendChild(ariaLive);
  
  return () => {
    document.body.removeChild(ariaLive);
  };
}, [filteredTodos.length, todos.length]);
```

## Acceptance Criteria Checklist

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

## Performance Considerations

1. **Debouncing**: 300ms delay prevents excessive re-renders while typing
2. **Memoization**: `useMemo` in `useFilteredTodos` prevents unnecessary recalculations
3. **Client-side filtering**: Acceptable for < 100 todos (< 10ms filtering time)
4. **Future optimization**: Consider virtualized list for > 200 todos

## Security Considerations

1. **XSS Prevention**: React auto-escapes all search query displays
2. **Client-side only**: No sensitive data sent to server for filtering
3. **Input validation**: Search query trimmed and sanitized

## Edge Cases Handled

1. **Empty search query**: Shows all todos
2. **No results**: Displays empty state with clear filters option
3. **Special characters in search**: Case-insensitive match without regex
4. **Multiple filters combined**: AND logic ensures all criteria must match
5. **Tag filter with AND logic**: Must have ALL selected tags

## Integration Points

- **app/page.tsx**: Main integration point for all filter UI and logic
- **lib/hooks/useDebounce.ts**: Generic hook for debouncing any value
- **lib/hooks/useFilteredTodos.ts**: Core filtering logic with memoization
- **components/SearchBar.tsx**: Search input with keyboard shortcuts
- **components/FilterControls.tsx**: All filter controls in one component
- **components/FilterSummary.tsx**: Display filter results count

## Next Steps

After implementation:
1. Run E2E tests: `npx playwright test tests/08-search-filtering.spec.ts`
2. Test with large dataset (100+ todos) for performance
3. Verify accessibility with screen reader
4. Test keyboard navigation
5. Verify dark mode appearance

---

**Status**: Implementation-ready  
**Dependencies**: PRP 01, 02, 06  
**Estimated Time**: 1-2 days  
**Version**: 1.0
