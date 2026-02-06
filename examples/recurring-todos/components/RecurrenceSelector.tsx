/**
 * RecurrenceSelector Component
 * Checkbox to enable recurring + dropdown for pattern selection
 * Based on PRP 03 Component Specifications section
 */

'use client';

import React, { useState } from 'react';
import { RecurrencePattern } from '../lib/timezone';

interface RecurrenceSelectorProps {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void;
  disabled?: boolean;
  hasDueDate: boolean; // Show warning if false
}

/**
 * Allows users to set recurrence pattern for a todo
 * 
 * Features:
 * - Checkbox to enable/disable recurring
 * - Dropdown to select pattern (daily/weekly/monthly/yearly)
 * - Validation warning if due date not set
 * 
 * @example
 * const [pattern, setPattern] = useState<RecurrencePattern>(null);
 * <RecurrenceSelector 
 *   value={pattern} 
 *   onChange={setPattern}
 *   hasDueDate={!!dueDate}
 * />
 */
export function RecurrenceSelector({
  value,
  onChange,
  disabled = false,
  hasDueDate,
}: RecurrenceSelectorProps) {
  const isRecurring = value !== null;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Enable recurring with default pattern
      onChange('daily');
    } else {
      // Disable recurring
      onChange(null);
    }
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly');
  };

  return (
    <div className="space-y-2">
      {/* Enable/Disable Checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={handleCheckboxChange}
          disabled={disabled}
          aria-label="Enable recurring"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">Repeat</span>
      </label>

      {/* Pattern Selector (shown when recurring is enabled) */}
      {isRecurring && (
        <div className="ml-6 space-y-2">
          <select
            value={value || 'daily'}
            onChange={handlePatternChange}
            disabled={disabled}
            aria-label="Recurrence pattern"
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* Validation Warning */}
          {!hasDueDate && (
            <p className="text-sm text-red-600" role="alert">
              ⚠️ Due date is required for recurring todos
            </p>
          )}
        </div>
      )}
    </div>
  );
}
