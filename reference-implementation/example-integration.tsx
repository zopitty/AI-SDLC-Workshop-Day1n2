'use client';

/**
 * EXAMPLE INTEGRATION: Search & Filtering Feature
 * 
 * This file demonstrates how to integrate all search and filtering components
 * into your main Todo app page (app/page.tsx).
 * 
 * Copy the relevant parts into your existing page.tsx file.
 */

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterControls } from './components/FilterControls';
import { FilterSummary } from './components/FilterSummary';
import { useDebounce } from './lib/hooks/useDebounce';
import { useFilteredTodos, getActiveFilterDescriptions } from './lib/hooks/useFilteredTodos';
import type { FilterState, Todo, Tag, Priority } from './lib/hooks/useFilteredTodos';

export default function HomePage() {
  // ===== EXISTING STATE (from your current implementation) =====
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ===== NEW STATE FOR FILTERING =====
  
  // Raw search query (updated on every keystroke)
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter state object containing all filter criteria
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',           // Will be updated from debouncedSearch
    priority: 'all',
    status: 'all',
    tags: [],
    dueDateRange: null,
    showOverdue: false,
    showNoDueDate: false,
  });

  // ===== DEBOUNCING =====
  
  // Debounce search query to reduce re-renders while typing (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update filter state when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchQuery: debouncedSearch }));
  }, [debouncedSearch]);

  // ===== FILTERING =====
  
  // Get filtered todos using the custom hook (memoized for performance)
  const filteredTodos = useFilteredTodos(todos, filters);

  // Get active filter descriptions for the summary component
  const activeFilters = getActiveFilterDescriptions(filters, tags);

  // ===== HANDLERS =====
  
  /**
   * Update one or more filter values
   * Uses partial update to preserve other filter state
   */
  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  /**
   * Clear all filters and return to showing all todos
   */
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

  // ===== DATA FETCHING (existing from your app) =====
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTodos(),
        fetchTags(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }

  // ===== RENDER =====
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Todos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Organize your tasks efficiently
        </p>
      </div>

      {/* ===== SEARCH AND FILTER SECTION ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearFilters}
          placeholder="Search todos and tags..."
        />
        
        {/* Filter Controls */}
        <div className="mt-6">
          <FilterControls
            filters={filters}
            onChange={handleFilterChange}
            onClearAll={handleClearFilters}
            availableTags={tags}
          />
        </div>
      </div>

      {/* ===== FILTER SUMMARY ===== */}
      <FilterSummary
        totalCount={todos.length}
        filteredCount={filteredTodos.length}
        activeFilters={activeFilters}
      />

      {/* ===== TODO LIST ===== */}
      {filteredTodos.length === 0 ? (
        // Empty State
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg 
              className="mx-auto h-12 w-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            No todos found matching your filters
          </p>
          {activeFilters.length > 0 && (
            <>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      ) : (
        // Todo List (using filtered todos)
        <div className="space-y-4">
          {filteredTodos.map(todo => (
            <TodoCard 
              key={todo.id} 
              todo={todo}
              onUpdate={fetchTodos}
              onDelete={fetchTodos}
            />
          ))}
        </div>
      )}

      {/* Add Todo Form (existing component) */}
      <div className="mt-8">
        {/* Your existing AddTodoForm component */}
      </div>
    </div>
  );
}

/**
 * Example TodoCard component (simplified)
 * Replace with your actual TodoCard implementation
 */
function TodoCard({ 
  todo, 
  onUpdate, 
  onDelete 
}: { 
  todo: Todo; 
  onUpdate: () => void; 
  onDelete: () => void;
}) {
  const priorityColors = {
    high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    low: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => {/* handle toggle */}}
          className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
            {todo.title}
          </h3>
          
          {/* Metadata */}
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {/* Priority Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>
            
            {/* Tags */}
            {todo.tags?.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            
            {/* Due Date */}
            {todo.due_date && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                📅 {new Date(todo.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {/* handle edit */}}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit todo"
          >
            ✏️
          </button>
          <button
            onClick={() => {/* handle delete */}}
            className="text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Delete todo"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
