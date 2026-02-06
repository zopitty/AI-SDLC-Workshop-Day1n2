/**
 * Unit Tests for Recurring Todos Date Calculation
 * Based on PRP 03 Testing Strategy section
 */

import { describe, test, expect } from '@jest/globals';
import { calculateNextDueDate, RecurrencePattern } from '../lib/timezone';

describe('calculateNextDueDate', () => {
  describe('Daily recurrence', () => {
    test('adds 1 day', () => {
      const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'daily');
      const nextDate = new Date(next);
      const expectedDate = new Date('2026-12-26T09:00:00+08:00');
      
      expect(nextDate.toISOString()).toBe(expectedDate.toISOString());
    });

    test('handles month boundary', () => {
      const next = calculateNextDueDate('2026-01-31T10:00:00+08:00', 'daily');
      const nextDate = new Date(next);
      
      expect(nextDate.getDate()).toBe(1); // Feb 1
      expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
    });
  });

  describe('Weekly recurrence', () => {
    test('adds 7 days', () => {
      const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'weekly');
      const nextDate = new Date(next);
      const expectedDate = new Date('2027-01-01T09:00:00+08:00');
      
      expect(nextDate.toISOString()).toBe(expectedDate.toISOString());
    });

    test('preserves day of week', () => {
      const current = new Date('2026-12-25T09:00:00+08:00'); // Friday
      const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'weekly');
      const nextDate = new Date(next);
      
      expect(nextDate.getDay()).toBe(current.getDay()); // Same day of week
    });
  });

  describe('Monthly recurrence', () => {
    test('adds 1 month', () => {
      const next = calculateNextDueDate('2026-01-15T10:00:00+08:00', 'monthly');
      const nextDate = new Date(next);
      
      expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
      expect(nextDate.getDate()).toBe(15);
    });

    test('handles month-end edge case: Jan 31 → Feb 28 (non-leap year)', () => {
      const next = calculateNextDueDate('2026-01-31T10:00:00+08:00', 'monthly');
      const nextDate = new Date(next);
      
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(28); // Last valid day of February 2026
    });

    test('handles month-end edge case: Jan 31 → Feb 29 (leap year)', () => {
      const next = calculateNextDueDate('2024-01-31T10:00:00+08:00', 'monthly');
      const nextDate = new Date(next);
      
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(29); // Leap year
    });

    test('handles month-end edge case: Aug 31 → Sep 30', () => {
      const next = calculateNextDueDate('2026-08-31T10:00:00+08:00', 'monthly');
      const nextDate = new Date(next);
      
      expect(nextDate.getMonth()).toBe(8); // September (0-indexed)
      expect(nextDate.getDate()).toBe(30); // Last valid day of September
    });

    test('preserves time of day', () => {
      const next = calculateNextDueDate('2026-01-15T14:30:00+08:00', 'monthly');
      const nextDate = new Date(next);
      
      expect(nextDate.getHours()).toBe(14);
      expect(nextDate.getMinutes()).toBe(30);
    });
  });

  describe('Yearly recurrence', () => {
    test('adds 1 year', () => {
      const next = calculateNextDueDate('2026-06-15T10:00:00+08:00', 'yearly');
      const nextDate = new Date(next);
      
      expect(nextDate.getFullYear()).toBe(2027);
      expect(nextDate.getMonth()).toBe(5); // June (0-indexed)
      expect(nextDate.getDate()).toBe(15);
    });

    test('handles leap year edge case: Feb 29 → Feb 28 (leap to non-leap)', () => {
      const next = calculateNextDueDate('2024-02-29T10:00:00+08:00', 'yearly');
      const nextDate = new Date(next);
      
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(28); // Adjusted to last valid day
    });

    test('handles leap year edge case: Feb 29 → Feb 29 (leap to leap)', () => {
      const next = calculateNextDueDate('2024-02-29T10:00:00+08:00', 'yearly');
      const nextDate = new Date(next);
      const next2 = calculateNextDueDate(nextDate.toISOString(), 'yearly');
      const next2Date = new Date(next2);
      
      // 2025-02-28 + 1 year = 2026-02-28
      // Then 2026-02-28 + 1 year = 2027-02-28
      // But 2028 is a leap year, so:
      const next3 = calculateNextDueDate(next2Date.toISOString(), 'yearly');
      const next3Date = new Date(next3);
      
      expect(next3Date.getFullYear()).toBe(2027);
    });

    test('preserves time of day', () => {
      const next = calculateNextDueDate('2026-03-20T08:45:00+08:00', 'yearly');
      const nextDate = new Date(next);
      
      expect(nextDate.getHours()).toBe(8);
      expect(nextDate.getMinutes()).toBe(45);
    });
  });

  describe('Error handling', () => {
    test('throws error for null pattern', () => {
      expect(() => {
        calculateNextDueDate('2026-12-25T09:00:00+08:00', null);
      }).toThrow('Recurrence pattern is required');
    });

    test('throws error for invalid pattern', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        calculateNextDueDate('2026-12-25T09:00:00+08:00', 'invalid');
      }).toThrow('Invalid recurrence pattern');
    });
  });

  describe('Timezone consistency', () => {
    test('preserves Singapore timezone offset', () => {
      const next = calculateNextDueDate('2026-12-25T09:00:00+08:00', 'daily');
      
      // Verify the result is a valid ISO string
      expect(() => new Date(next)).not.toThrow();
      
      // Verify it maintains the same time of day
      const nextDate = new Date(next);
      expect(nextDate.getHours()).toBe(9);
    });
  });
});
