/**
 * Singapore Timezone Utilities
 * All date/time operations in the app must use Singapore timezone (Asia/Singapore)
 */

const SINGAPORE_TZ = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SINGAPORE_TZ }));
}

/**
 * Format a date to Singapore timezone string
 */
export function formatSingaporeDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString('en-US', { 
    timeZone: SINGAPORE_TZ,
    ...options 
  });
}

/**
 * Convert a date to ISO string in Singapore timezone
 */
export function toSingaporeISO(date: Date): string {
  return new Date(date.toLocaleString('en-US', { timeZone: SINGAPORE_TZ })).toISOString();
}

/**
 * Parse a date string as Singapore timezone
 */
export function parseSingaporeDate(dateString: string): Date {
  const date = new Date(dateString);
  return new Date(date.toLocaleString('en-US', { timeZone: SINGAPORE_TZ }));
}
