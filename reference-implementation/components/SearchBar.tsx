'use client';

import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar component with debounced input, clear button, and keyboard shortcut
 * 
 * Features:
 * - Search icon on the left
 * - Clear button (×) on the right when text is entered
 * - Keyboard shortcut: Press "/" to focus the search bar
 * - Accessible with proper ARIA labels
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onClear={() => setSearchQuery('')}
 *   placeholder="Search todos and tags..."
 * />
 * ```
 */
export function SearchBar({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Search todos and tags...",
  className = ""
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" to focus search
  // Prevents default browser behavior and focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not already in an input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // ESC to clear search when focused
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        e.preventDefault();
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClear]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        {/* Search Icon */}
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
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="Search todos"
          aria-describedby="search-hint"
        />
        
        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
            tabIndex={0}
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
      
      {/* Keyboard Hint */}
      <p 
        id="search-hint" 
        className="mt-1 text-xs text-gray-500 dark:text-gray-400"
      >
        Press{' '}
        <kbd className="px-1 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
          /
        </kbd>{' '}
        to focus • Press{' '}
        <kbd className="px-1 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
          ESC
        </kbd>{' '}
        to clear
      </p>
    </div>
  );
}
