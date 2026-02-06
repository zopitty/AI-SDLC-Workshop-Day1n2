import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getSingaporeNow, formatSingaporeDate, toSingaporeISO } from './timezone';

describe('timezone', () => {
  describe('getSingaporeNow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return current date in Singapore timezone', () => {
      const testDate = new Date('2026-02-06T12:00:00Z');
      vi.setSystemTime(testDate);

      const result = getSingaporeNow();
      
      expect(result).toBeInstanceOf(Date);
      // Singapore is UTC+8, so 12:00 UTC = 20:00 SGT
      expect(result.getHours()).toBe(20);
    });

    it('should return different times for different UTC times', () => {
      vi.setSystemTime(new Date('2026-02-06T00:00:00Z'));
      const result1 = getSingaporeNow();
      
      vi.setSystemTime(new Date('2026-02-06T16:00:00Z'));
      const result2 = getSingaporeNow();
      
      expect(result1.getHours()).toBe(8); // 00:00 UTC = 08:00 SGT
      expect(result2.getHours()).toBe(0); // 16:00 UTC = 00:00 SGT next day
    });

    it('should handle timezone correctly across date boundaries', () => {
      // Set to 23:00 UTC which should be next day in Singapore
      vi.setSystemTime(new Date('2026-02-05T23:00:00Z'));
      const result = getSingaporeNow();
      
      expect(result.getDate()).toBe(6); // Should be Feb 6 in Singapore
      expect(result.getHours()).toBe(7); // 23:00 UTC = 07:00 SGT next day
    });
  });

  describe('formatSingaporeDate', () => {
    it('should format a Date object with default format', () => {
      const date = new Date('2026-02-06T12:00:00Z');
      const result = formatSingaporeDate(date);
      
      expect(result).toContain('Feb');
      expect(result).toContain('6');
      expect(result).toContain('2026');
    });

    it('should format a Date object with custom format', () => {
      const date = new Date('2026-02-06T12:00:00Z');
      const result = formatSingaporeDate(date, 'yyyy-MM-dd');
      
      expect(result).toBe('2026-02-06');
    });

    it('should format a string date with default format', () => {
      const dateString = '2026-02-06T12:00:00Z';
      const result = formatSingaporeDate(dateString);
      
      expect(result).toContain('Feb');
      expect(result).toContain('6');
      expect(result).toContain('2026');
    });

    it('should format a string date with custom format', () => {
      const dateString = '2026-02-06T12:00:00Z';
      const result = formatSingaporeDate(dateString, 'HH:mm');
      
      // 12:00 UTC = 20:00 SGT
      expect(result).toBe('20:00');
    });

    it('should handle different time formats', () => {
      const date = new Date('2026-02-06T12:30:45Z');
      const result = formatSingaporeDate(date, 'HH:mm:ss');
      
      expect(result).toBe('20:30:45');
    });

    it('should handle full datetime format', () => {
      const date = new Date('2026-02-06T12:00:00Z');
      const result = formatSingaporeDate(date, "yyyy-MM-dd'T'HH:mm:ss");
      
      expect(result).toBe('2026-02-06T20:00:00');
    });

    it('should correctly format dates at midnight UTC', () => {
      const date = new Date('2026-02-06T00:00:00Z');
      const result = formatSingaporeDate(date, 'yyyy-MM-dd HH:mm');
      
      // 00:00 UTC = 08:00 SGT same day
      expect(result).toBe('2026-02-06 08:00');
    });

    it('should correctly format dates near midnight Singapore time', () => {
      const date = new Date('2026-02-05T16:00:00Z');
      const result = formatSingaporeDate(date, 'yyyy-MM-dd HH:mm');
      
      // 16:00 UTC on Feb 5 = 00:00 SGT on Feb 6
      expect(result).toBe('2026-02-06 00:00');
    });
  });

  describe('toSingaporeISO', () => {
    it('should convert Date to Singapore ISO string with timezone offset', () => {
      const date = new Date('2026-02-06T12:00:00Z');
      const result = toSingaporeISO(date);
      
      // Should be in format: 2026-02-06T20:00:00+08:00
      expect(result).toMatch(/2026-02-06T20:00:00\+08:00/);
    });

    it('should include +08:00 timezone offset', () => {
      const date = new Date('2026-02-06T00:00:00Z');
      const result = toSingaporeISO(date);
      
      expect(result).toContain('+08:00');
    });

    it('should handle different times correctly', () => {
      const date = new Date('2026-02-06T14:30:45Z');
      const result = toSingaporeISO(date);
      
      // 14:30:45 UTC = 22:30:45 SGT
      expect(result).toMatch(/2026-02-06T22:30:45\+08:00/);
    });

    it('should handle dates crossing midnight', () => {
      const date = new Date('2026-02-05T23:00:00Z');
      const result = toSingaporeISO(date);
      
      // 23:00 UTC on Feb 5 = 07:00 SGT on Feb 6
      expect(result).toMatch(/2026-02-06T07:00:00\+08:00/);
    });

    it('should produce parseable ISO string', () => {
      const date = new Date('2026-02-06T12:00:00Z');
      const result = toSingaporeISO(date);
      
      const parsed = new Date(result);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe('2026-02-06T12:00:00.000Z');
    });

    it('should handle edge case: start of year', () => {
      const date = new Date('2025-12-31T23:00:00Z');
      const result = toSingaporeISO(date);
      
      // 23:00 UTC on Dec 31 = 07:00 SGT on Jan 1
      expect(result).toMatch(/2026-01-01T07:00:00\+08:00/);
    });

    it('should handle edge case: end of year', () => {
      const date = new Date('2026-12-31T12:00:00Z');
      const result = toSingaporeISO(date);
      
      expect(result).toMatch(/2026-12-31T20:00:00\+08:00/);
    });
  });

  describe('Edge cases and error handling', () => {
    it('formatSingaporeDate should handle invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date';
      expect(() => formatSingaporeDate(invalidDate)).toThrow();
    });
  });
});
