'use client';

interface FilterSummaryProps {
  totalCount: number;
  filteredCount: number;
  activeFilters: string[];
}

/**
 * FilterSummary component - Shows how many todos are visible and which filters are active
 * 
 * Features:
 * - Displays "X of Y todos" count
 * - Lists active filters as badges
 * - Hidden when no filters are active and showing all todos
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * ```tsx
 * <FilterSummary
 *   totalCount={25}
 *   filteredCount={5}
 *   activeFilters={['search: "meeting"', 'priority: high', 'tags: work']}
 * />
 * ```
 */
export function FilterSummary({ 
  totalCount, 
  filteredCount, 
  activeFilters 
}: FilterSummaryProps) {
  // If no filters are active, show simple "all todos" message
  if (activeFilters.length === 0) {
    return (
      <div 
        className="text-sm text-gray-600 dark:text-gray-400 mb-4"
        role="status"
        aria-live="polite"
      >
        Showing all {totalCount} {totalCount === 1 ? 'todo' : 'todos'}
      </div>
    );
  }

  // Show filtered count and active filters
  return (
    <div className="mb-4" role="status" aria-live="polite">
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
        Showing {filteredCount} of {totalCount} {totalCount === 1 ? 'todo' : 'todos'}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Filtered by:
        </span>
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
