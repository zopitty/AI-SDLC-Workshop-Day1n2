/**
 * Singapore Timezone Utilities
 * All date/time operations use Asia/Singapore timezone (UTC+8)
 */

/**
 * Get current date/time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
}

/**
 * Format date for Singapore timezone
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'datetime')
 */
export function formatSingaporeDate(date: Date | string, format: 'short' | 'long' | 'datetime' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', { 
      timeZone: 'Asia/Singapore',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  if (format === 'datetime') {
    return dateObj.toLocaleString('en-US', {
      timeZone: 'Asia/Singapore',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    timeZone: 'Asia/Singapore',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Convert date to ISO string in Singapore timezone
 */
export function toSingaporeISO(date: Date): string {
  const offset = 8 * 60; // Singapore is UTC+8
  const localDate = new Date(date.getTime() + offset * 60 * 1000);
  return localDate.toISOString().replace('Z', '+08:00');
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const now = getSingaporeNow();
  const due = new Date(dueDate);
  return due < now;
}
