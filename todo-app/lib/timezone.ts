/**
 * Timezone utilities for Singapore (Asia/Singapore) timezone
 * All date/time operations must use these functions
 */

const SINGAPORE_TZ = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  const nowString = new Date().toLocaleString('en-US', {
    timeZone: SINGAPORE_TZ,
  });
  return new Date(nowString);
}

/**
 * Format date in Singapore timezone
 */
export function formatSingaporeDate(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: SINGAPORE_TZ,
  };

  if (format === 'date') {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit';
  } else if (format === 'time') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  } else {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit';
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-SG', options).format(date);
}

/**
 * Parse ISO string to Singapore timezone date
 */
export function parseSingaporeDate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Convert Date to ISO string for database storage
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
