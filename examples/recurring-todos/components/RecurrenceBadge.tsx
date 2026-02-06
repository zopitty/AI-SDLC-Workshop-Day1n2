/**
 * RecurrenceBadge Component
 * Displays 🔁 icon with recurrence pattern label
 * Based on PRP 03 Component Specifications section
 */

import React from 'react';
import { RecurrencePattern } from '../lib/timezone';

interface RecurrenceBadgeProps {
  pattern: RecurrencePattern;
}

/**
 * Renders a visual indicator for recurring todos
 * 
 * @example
 * <RecurrenceBadge pattern="daily" />
 * // Renders: 🔁 <span className="text-gray-500 text-sm">(Daily)</span>
 */
export function RecurrenceBadge({ pattern }: RecurrenceBadgeProps) {
  if (!pattern) {
    return null;
  }

  // Capitalize first letter for display
  const patternLabel = pattern.charAt(0).toUpperCase() + pattern.slice(1);

  return (
    <span className="inline-flex items-center gap-1 ml-2" aria-label={`Recurring ${patternLabel}`}>
      <span className="text-lg" role="img" aria-label="Recurring">
        🔁
      </span>
      <span className="text-gray-500 text-sm">({patternLabel})</span>
    </span>
  );
}
