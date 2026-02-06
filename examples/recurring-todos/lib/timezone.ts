/**
 * Singapore Timezone Utilities for Recurring Todos
 * All date operations must use Singapore timezone (Asia/Singapore)
 */

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

/**
 * Get current time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Singapore',
    })
  );
}

/**
 * Format date in Singapore timezone
 */
export function formatSingaporeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Calculate next due date based on recurrence pattern
 * Handles edge cases: month-end dates, leap years
 * 
 * @param currentDueDate - ISO 8601 string of current due date
 * @param pattern - Recurrence pattern (daily/weekly/monthly/yearly)
 * @returns ISO 8601 string of next due date
 * 
 * @example
 * // Daily recurrence
 * calculateNextDueDate('2026-12-25T09:00:00+08:00', 'daily')
 * // Returns: '2026-12-26T09:00:00+08:00'
 * 
 * @example
 * // Monthly edge case: Jan 31 → Feb 28
 * calculateNextDueDate('2026-01-31T10:00:00+08:00', 'monthly')
 * // Returns: '2026-02-28T10:00:00+08:00' (last valid day)
 * 
 * @example
 * // Yearly edge case: Feb 29 (leap) → Feb 28 (non-leap)
 * calculateNextDueDate('2024-02-29T10:00:00+08:00', 'yearly')
 * // Returns: '2025-02-28T10:00:00+08:00'
 */
export function calculateNextDueDate(
  currentDueDate: string,
  pattern: RecurrencePattern
): string {
  if (!pattern) {
    throw new Error('Recurrence pattern is required');
  }

  // Parse as Date object (JavaScript automatically handles timezone)
  const date = new Date(currentDueDate);

  switch (pattern) {
    case 'daily':
      // Add 1 day
      date.setDate(date.getDate() + 1);
      break;

    case 'weekly':
      // Add 7 days
      date.setDate(date.getDate() + 7);
      break;

    case 'monthly':
      // Add 1 month
      // JavaScript automatically handles month-end edge cases:
      // Jan 31 + 1 month = Feb 28/29 (last valid day)
      // Aug 31 + 1 month = Sep 30
      date.setMonth(date.getMonth() + 1);
      break;

    case 'yearly':
      // Add 1 year
      // JavaScript automatically handles leap year edge cases:
      // Feb 29, 2024 + 1 year = Feb 28, 2025
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      throw new Error(`Invalid recurrence pattern: ${pattern}`);
  }

  return date.toISOString();
}

/**
 * Validate that a due date is required for recurring todos
 */
export function validateRecurringTodo(
  isRecurring: boolean,
  dueDate: string | null
): { valid: boolean; error?: string } {
  if (isRecurring && !dueDate) {
    return {
      valid: false,
      error: 'Due date is required for recurring todos',
    };
  }
  return { valid: true };
}
