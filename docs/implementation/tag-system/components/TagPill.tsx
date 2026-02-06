/**
 * TagPill Component
 * 
 * Displays a tag as a colored pill/badge
 * 
 * Features:
 * - Color-coded background with contrasting text
 * - Optional click handler (for filtering)
 * - Optional remove button (for unassigning)
 * - Responsive sizing (sm/md/lg)
 * - Accessible keyboard navigation
 */

'use client';

import type { Tag } from '@/lib/db';
import { getContrastColor } from '@/lib/db';

export interface TagPillProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
  className?: string;
  removable?: boolean;
}

export function TagPill({
  tag,
  size = 'md',
  onClick,
  onRemove,
  className = '',
  removable = false,
}: TagPillProps) {
  // Calculate contrasting text color based on background
  const textColor = getContrastColor(tag.color);

  // Size variants using Tailwind CSS
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  // Determine if pill is clickable
  const isClickable = !!onClick;
  const isRemovable = removable && !!onRemove;

  const handleClick = () => {
    if (onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onRemove) {
      onRemove(tag);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleRemoveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRemove(e as any);
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full font-medium
        transition-all duration-200
        ${sizeClasses[size]}
        ${isClickable ? 'cursor-pointer hover:opacity-80 hover:shadow-md' : ''}
        ${className}
      `}
      style={{
        backgroundColor: tag.color,
        color: textColor,
      }}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`Tag: ${tag.name}, color: ${tag.color}${isClickable ? ', click to filter' : ''}`}
    >
      <span>{tag.name}</span>
      
      {isRemovable && (
        <button
          type="button"
          onClick={handleRemove}
          onKeyDown={handleRemoveKeyDown}
          className="
            ml-1 -mr-1
            hover:bg-black hover:bg-opacity-20
            rounded-full
            w-4 h-4
            flex items-center justify-center
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          "
          aria-label={`Remove ${tag.name} tag`}
          tabIndex={0}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 3L3 9M3 3L9 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Example Usage
 * 
 * // Basic display (read-only)
 * <TagPill tag={{ id: 1, name: 'urgent', color: '#EF4444', ... }} />
 * 
 * // Clickable for filtering
 * <TagPill 
 *   tag={tag} 
 *   onClick={(tag) => setFilter({ tagId: tag.id })}
 * />
 * 
 * // With remove button
 * <TagPill 
 *   tag={tag}
 *   removable
 *   onRemove={(tag) => handleUnassignTag(tag.id)}
 * />
 * 
 * // Small size for compact display
 * <TagPill tag={tag} size="sm" />
 * 
 * // Custom className for positioning
 * <TagPill tag={tag} className="mr-2" />
 */

/**
 * Tag List Example
 * 
 * function TodoTagList({ todo, onRemoveTag, onFilterByTag }) {
 *   return (
 *     <div className="flex flex-wrap gap-2">
 *       {todo.tags?.map(tag => (
 *         <TagPill
 *           key={tag.id}
 *           tag={tag}
 *           size="sm"
 *           removable
 *           onClick={onFilterByTag}
 *           onRemove={onRemoveTag}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */

/**
 * Accessibility Features
 * 
 * 1. ARIA Labels:
 *    - Descriptive aria-label includes tag name and color
 *    - Separate aria-label for remove button
 * 
 * 2. Keyboard Navigation:
 *    - Tab to focus pill (if clickable)
 *    - Enter or Space to activate
 *    - Tab to remove button, Enter/Space to remove
 * 
 * 3. Visual Feedback:
 *    - Hover states for interactive elements
 *    - Focus ring on remove button
 *    - Color contrast automatically calculated
 * 
 * 4. Screen Reader Support:
 *    - role="button" for clickable pills
 *    - aria-hidden on decorative SVG icon
 */

/**
 * Styling Notes
 * 
 * 1. Tailwind CSS 4:
 *    - Uses modern utility classes
 *    - Inline styles for dynamic colors
 * 
 * 2. Responsive:
 *    - Three size variants (sm/md/lg)
 *    - Flexible gap spacing
 * 
 * 3. Dark Mode Compatible:
 *    - Text color automatically contrasts with background
 *    - No hardcoded light/dark colors
 * 
 * 4. Animations:
 *    - Smooth transitions for hover states
 *    - Shadow on hover for depth
 */

/**
 * Performance Considerations
 * 
 * 1. Memoization:
 *    - Consider wrapping in React.memo() if rendering many tags
 *    - getContrastColor() is lightweight, no memoization needed
 * 
 * 2. Event Handlers:
 *    - stopPropagation on remove to prevent bubbling
 *    - Conditional handlers only when needed
 */

export default TagPill;
