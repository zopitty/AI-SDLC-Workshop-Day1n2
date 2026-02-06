import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const SINGAPORE_TZ = 'Asia/Singapore';

/**
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
}
