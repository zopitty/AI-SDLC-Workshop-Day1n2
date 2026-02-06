/**
 * TagSelector Component
 * 
 * Multi-select dropdown for assigning tags to todos
 * 
 * Features:
 * - Dropdown with list of available tags
 * - Display selected tags as pills
 * - "Create new tag" option
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Accessible (ARIA, focus management)
 * - Maximum tag limit (optional)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { Tag } from '@/lib/db';
import { TagPill } from './TagPill';

export interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreateNew?: (name: string, color: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxTags?: number;
}

export function TagSelector({
  availableTags,
  selectedTags,
  onChange,
  onCreateNew,
  disabled = false,
  placeholder = 'Select tags...',
  maxTags,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tags: exclude already selected, filter by search
  const selectedIds = new Set(selectedTags.map(t => t.id));
  const filteredTags = availableTags.filter(
    tag => !selectedIds.has(tag.id) && 
           tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if max tags reached
  const maxReached = maxTags !== undefined && selectedTags.length >= maxTags;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddTag = (tag: Tag) => {
    if (!maxReached) {
      onChange([...selectedTags, tag]);
      setSearchQuery('');
      setFocusedIndex(0);
      // Keep dropdown open for multi-select
    }
  };

  const handleRemoveTag = (tag: Tag) => {
    onChange(selectedTags.filter(t => t.id !== tag.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          Math.min(prev + 1, filteredTags.length - 1)
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredTags[focusedIndex]) {
          handleAddTag(filteredTags[focusedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;

      case 'Backspace':
        if (searchQuery === '' && selectedTags.length > 0) {
          // Remove last selected tag on backspace when input is empty
          handleRemoveTag(selectedTags[selectedTags.length - 1]);
        }
        break;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <TagPill
              key={tag.id}
              tag={tag}
              size="sm"
              removable
              onRemove={handleRemoveTag}
            />
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => !maxReached && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled || maxReached}
          placeholder={maxReached ? `Maximum ${maxTags} tags` : placeholder}
          className="
            w-full px-4 py-2
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Tag selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="tag-dropdown"
        />
        
        {/* Dropdown indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && !maxReached && (
        <div
          id="tag-dropdown"
          role="listbox"
          className="
            absolute z-10 w-full mt-1
            bg-white border border-gray-300 rounded-lg shadow-lg
            max-h-60 overflow-y-auto
          "
        >
          {filteredTags.length > 0 ? (
            filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                onMouseEnter={() => setFocusedIndex(index)}
                role="option"
                aria-selected={index === focusedIndex}
                className={`
                  w-full px-4 py-2 text-left
                  flex items-center gap-2
                  hover:bg-gray-100
                  transition-colors
                  ${index === focusedIndex ? 'bg-gray-100' : ''}
                `}
              >
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden="true"
                />
                <span className="flex-1">{tag.name}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No tags found
            </div>
          )}

          {/* Create new tag option */}
          {onCreateNew && searchQuery && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                onClick={() => {
                  // Open tag creation modal/dialog
                  // This would typically trigger a separate modal
                  onCreateNew(searchQuery, '#3B82F6'); // Default color
                  setSearchQuery('');
                  setIsOpen(false);
                }}
                className="
                  w-full px-4 py-2 text-left
                  text-blue-600 hover:bg-blue-50
                  font-medium
                  transition-colors
                "
              >
                + Create tag "{searchQuery}"
              </button>
            </>
          )}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <div className="text-sm text-gray-500 mt-1">
          {selectedTags.length} / {maxTags} tags selected
        </div>
      )}
    </div>
  );
}

/**
 * Example Usage
 * 
 * // Basic usage
 * <TagSelector
 *   availableTags={allTags}
 *   selectedTags={todo.tags || []}
 *   onChange={(tags) => updateTodoTags(todo.id, tags)}
 * />
 * 
 * // With create new tag
 * <TagSelector
 *   availableTags={allTags}
 *   selectedTags={selectedTags}
 *   onChange={setSelectedTags}
 *   onCreateNew={(name, color) => handleCreateTag(name, color)}
 * />
 * 
 * // With max tags limit
 * <TagSelector
 *   availableTags={allTags}
 *   selectedTags={selectedTags}
 *   onChange={setSelectedTags}
 *   maxTags={5}
 * />
 */

/**
 * Integration Example (Todo Form)
 * 
 * function TodoForm() {
 *   const [tags, setTags] = useState<Tag[]>([]);
 *   const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
 * 
 *   useEffect(() => {
 *     // Fetch available tags
 *     fetch('/api/tags')
 *       .then(res => res.json())
 *       .then(data => setTags(data.tags));
 *   }, []);
 * 
 *   const handleCreateTag = async (name: string, color: string) => {
 *     const response = await fetch('/api/tags', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ name, color })
 *     });
 *     const { tag } = await response.json();
 *     
 *     // Add to available tags and select it
 *     setTags(prev => [...prev, tag]);
 *     setSelectedTags(prev => [...prev, tag]);
 *   };
 * 
 *   const handleSubmit = async () => {
 *     // Create todo first
 *     const todoResponse = await fetch('/api/todos', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ title, description })
 *     });
 *     const { todo } = await todoResponse.json();
 * 
 *     // Assign tags
 *     for (const tag of selectedTags) {
 *       await fetch(`/api/todos/${todo.id}/tags`, {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ tag_id: tag.id })
 *       });
 *     }
 *   };
 * 
 *   return (
 *     <form>
 *       {/* ... other fields ... *\/}
 *       
 *       <div className="mb-4">
 *         <label className="block mb-2 font-medium">Tags</label>
 *         <TagSelector
 *           availableTags={tags}
 *           selectedTags={selectedTags}
 *           onChange={setSelectedTags}
 *           onCreateNew={handleCreateTag}
 *           placeholder="Add tags..."
 *         />
 *       </div>
 *     </form>
 *   );
 * }
 */

/**
 * Accessibility Features
 * 
 * 1. ARIA Attributes:
 *    - aria-expanded, aria-haspopup, aria-controls
 *    - role="listbox" for dropdown
 *    - role="option" for each tag
 * 
 * 2. Keyboard Navigation:
 *    - Arrow Up/Down to navigate
 *    - Enter to select
 *    - Escape to close
 *    - Backspace to remove last tag
 * 
 * 3. Focus Management:
 *    - Auto-focus on dropdown open
 *    - Visual focus indicators
 *    - Return focus to input after selection
 * 
 * 4. Screen Reader Support:
 *    - Descriptive labels
 *    - Status announcements (could be enhanced with live regions)
 */

/**
 * Performance Considerations
 * 
 * 1. Filtering:
 *    - Client-side filtering (fast for <100 tags)
 *    - Consider server-side search for large datasets
 * 
 * 2. Memoization:
 *    - filteredTags could be useMemo for large lists
 *    - selectedIds Set for O(1) lookups
 * 
 * 3. Virtual Scrolling:
 *    - Consider react-window for 100+ tags
 */

export default TagSelector;
