<<<<<<< HEAD
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
=======
/**
 * Singapore Timezone Utilities
 * All date/time operations in the app must use Singapore timezone (Asia/Singapore)
 */
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771

const SINGAPORE_TZ = 'Asia/Singapore';

/**
<<<<<<< HEAD
 * Get current time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return toZonedTime(new Date(), SINGAPORE_TZ);
}

/**
 * Format a date in Singapore timezone
 */
export function formatSingaporeDate(date: Date | string, format: string = 'PPpp'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, SINGAPORE_TZ, format);
}

/**
 * Convert a date to Singapore timezone ISO string
 */
export function toSingaporeISO(date: Date): string {
  return formatInTimeZone(date, SINGAPORE_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
=======
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
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
}
