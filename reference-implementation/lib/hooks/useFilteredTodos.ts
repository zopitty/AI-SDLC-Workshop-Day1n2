import { useMemo } from 'react';

// Type definitions (these would normally come from lib/db.ts)
export type Priority = 'high' | 'medium' | 'low';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  due_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder_minutes?: number;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  searchQuery: string;
  priority: Priority | 'all';
  status: 'all' | 'active' | 'completed';
  tags: number[]; // Array of tag IDs (AND logic)
  dueDateRange: {
    from: string | null;
    to: string | null;
  } | null;
  showOverdue: boolean;
  showNoDueDate: boolean;
}

/**
 * Custom hook to filter todos based on multiple criteria
 * Uses memoization to prevent unnecessary recalculations
 * 
 * @param todos - Array of todos to filter
 * @param filters - Filter criteria
 * @returns Filtered todos array
 * 
 * @example
 * ```tsx
 * const filteredTodos = useFilteredTodos(todos, {
 *   searchQuery: 'meeting',
 *   priority: 'high',
 *   status: 'active',
 *   tags: [1, 3],
 *   dueDateRange: null,
 *   showOverdue: false,
 *   showNoDueDate: false
 * });
 * ```
 */
export function useFilteredTodos(todos: Todo[], filters: FilterState): Todo[] {
  return useMemo(() => {
    let result = todos;

    // 1. Search filter (title and tags)
    // Case-insensitive, partial match on both todo title and tag names
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
    // Show only todos with the selected priority level
    if (filters.priority !== 'all') {
      result = result.filter(todo => todo.priority === filters.priority);
    }

    // 3. Status filter
    // Active: not completed, Completed: completed, All: both
    if (filters.status === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filters.status === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    // 4. Tag filter (AND logic - must have ALL selected tags)
    // If multiple tags selected, todo must have ALL of them
    if (filters.tags.length > 0) {
      result = result.filter(todo => 
        filters.tags.every(tagId => 
          todo.tags?.some(tag => tag.id === tagId)
        )
      );
    }

    // 5. Due date range filter
    // Filter todos by due date range, optionally include those with no due date
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
    // Show only incomplete todos that are past their due date
    if (filters.showOverdue) {
      const now = new Date(); // In real app, use getSingaporeNow() from lib/timezone.ts
      result = result.filter(todo => 
        todo.due_date && 
        new Date(todo.due_date) < now && 
        !todo.completed
      );
    }

    return result;
  }, [todos, filters]); // Only recalculate when todos or filters change
}

/**
 * Helper function to get active filter descriptions for summary display
 * 
 * @param filters - Current filter state
 * @param tags - Available tags for name lookup
 * @returns Array of human-readable filter descriptions
 */
export function getActiveFilterDescriptions(
  filters: FilterState,
  tags: Tag[]
): string[] {
  const activeFilters: string[] = [];

  if (filters.searchQuery) {
    activeFilters.push(`search: "${filters.searchQuery}"`);
  }
  if (filters.priority !== 'all') {
    activeFilters.push(`priority: ${filters.priority}`);
  }
  if (filters.status !== 'all') {
    activeFilters.push(`status: ${filters.status}`);
  }
  if (filters.tags.length > 0) {
    const tagNames = tags
      .filter(t => filters.tags.includes(t.id))
      .map(t => t.name)
      .join(', ');
    activeFilters.push(`tags: ${tagNames}`);
  }
  if (filters.showOverdue) {
    activeFilters.push('overdue');
  }
  if (filters.showNoDueDate) {
    activeFilters.push('no due date');
  }

  return activeFilters;
}
