'use client';

import { Priority, Tag } from '../lib/hooks/useFilteredTodos';
import type { FilterState } from '../lib/hooks/useFilteredTodos';

interface FilterControlsProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
  onClearAll: () => void;
  availableTags: Tag[];
}

/**
 * FilterControls component - All filter UI in one place
 * 
 * Features:
 * - Priority filter (All/High/Medium/Low)
 * - Status filter (All/Active/Completed)
 * - Tag filter with multi-select (AND logic)
 * - Quick filters (Overdue, No Due Date)
 * - Clear all filters button
 * 
 * @example
 * ```tsx
 * <FilterControls
 *   filters={filters}
 *   onChange={handleFilterChange}
 *   onClearAll={handleClearFilters}
 *   availableTags={tags}
 * />
 * ```
 */
export function FilterControls({ 
  filters, 
  onChange, 
  onClearAll, 
  availableTags 
}: FilterControlsProps) {
  // Check if any filters are active
  const hasActiveFilters = 
    filters.searchQuery ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.tags.length > 0 ||
    filters.dueDateRange !== null ||
    filters.showOverdue ||
    filters.showNoDueDate;

  return (
    <div className="space-y-4">
      {/* Priority Filter */}
      <div>
        <label 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          id="priority-filter-label"
        >
          Priority
        </label>
        <div 
          className="flex gap-2 flex-wrap"
          role="group"
          aria-labelledby="priority-filter-label"
        >
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => onChange({ priority })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.priority === priority
                  ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={filters.priority === priority}
            >
              {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          id="status-filter-label"
        >
          Status
        </label>
        <div 
          className="flex gap-2 flex-wrap"
          role="group"
          aria-labelledby="status-filter-label"
        >
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ status })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.status === status
                  ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={filters.status === status}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div>
          <label 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            id="tag-filter-label"
          >
            Tags {filters.tags.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (must have all selected)
              </span>
            )}
          </label>
          <div 
            className="flex gap-2 flex-wrap"
            role="group"
            aria-labelledby="tag-filter-label"
          >
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
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-105'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: tag.color,
                    color: '#ffffff'
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${tag.name} tag`}
                >
                  {isSelected && '✓ '}{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div>
        <label 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          id="quick-filter-label"
        >
          Quick Filters
        </label>
        <div 
          className="flex gap-2 flex-wrap"
          role="group"
          aria-labelledby="quick-filter-label"
        >
          <button
            onClick={() => onChange({ showOverdue: !filters.showOverdue })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filters.showOverdue
                ? 'bg-red-600 text-white ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-pressed={filters.showOverdue}
            aria-label="Show only overdue todos"
          >
            ⚠️ Overdue
          </button>
          <button
            onClick={() => onChange({ showNoDueDate: !filters.showNoDueDate })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filters.showNoDueDate
                ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-pressed={filters.showNoDueDate}
            aria-label="Include todos with no due date"
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
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors hover:underline"
            aria-label="Clear all active filters"
          >
            ✕ Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
