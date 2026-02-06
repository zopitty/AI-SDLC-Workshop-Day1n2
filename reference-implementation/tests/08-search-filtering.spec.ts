import { test, expect } from '@playwright/test';

/**
 * E2E tests for Search & Filtering functionality
 * Tests all aspects of PRP 08 implementation
 */

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assumes authentication is handled)
    await page.goto('/');
    
    // Wait for todos to load
    await page.waitForSelector('[aria-label="Search todos"]');
    
    // Create test todos with various properties
    await createTodo(page, 'Buy groceries', 'high', ['shopping']);
    await createTodo(page, 'Call dentist', 'medium', ['health']);
    await createTodo(page, 'Write report', 'low', ['work']);
    await createTodo(page, 'Team meeting preparation', 'high', ['work', 'meetings']);
  });

  test('should filter todos by search query (title match)', async ({ page }) => {
    // Type in search bar
    await page.fill('[aria-label="Search todos"]', 'report');
    
    // Wait for debounce (300ms + buffer)
    await page.waitForTimeout(350);
    
    // Should show only matching todo
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
    
    // Check summary shows filtered count
    await expect(page.locator('text=/Showing 1 of \\d+ todos/')).toBeVisible();
  });

  test('should filter todos by search query (tag match)', async ({ page }) => {
    // Search for a tag name
    await page.fill('[aria-label="Search todos"]', 'work');
    await page.waitForTimeout(350);
    
    // Should show todos with "work" tag
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
  });

  test('should be case-insensitive', async ({ page }) => {
    // Search with different cases
    await page.fill('[aria-label="Search todos"]', 'MEETING');
    await page.waitForTimeout(350);
    
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
  });

  test('should filter by priority', async ({ page }) => {
    // Click high priority filter
    await page.click('button:has-text("High")');
    
    // Should show only high priority todos
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
    await expect(page.locator('text=Write report')).not.toBeVisible();
  });

  test('should filter by status (active/completed)', async ({ page }) => {
    // Mark one todo as completed
    await page.click('[aria-label="Mark Buy groceries as completed"]');
    await page.waitForTimeout(100);
    
    // Filter by active
    await page.click('button[aria-pressed="false"]:has-text("Active")');
    
    // Should hide completed todo
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
    await expect(page.locator('text=Call dentist')).toBeVisible();
    
    // Filter by completed
    await page.click('button[aria-pressed="false"]:has-text("Completed")');
    
    // Should show only completed todo
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
  });

  test('should filter by multiple tags (AND logic)', async ({ page }) => {
    // Select both "work" and "meetings" tags
    await page.click('button[aria-label="Filter by work tag"]');
    await page.click('button[aria-label="Filter by meetings tag"]');
    
    // Should show only todo with BOTH tags
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
    await expect(page.locator('text=Write report')).not.toBeVisible(); // has "work" but not "meetings"
  });

  test('should combine search and filters (AND logic)', async ({ page }) => {
    // Search for "meeting"
    await page.fill('[aria-label="Search todos"]', 'meeting');
    await page.waitForTimeout(350);
    
    // Filter by high priority
    await page.click('button:has-text("High")');
    
    // Should show only high priority todo matching search
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
    
    // Change to low priority
    await page.click('button:has-text("Low")');
    
    // Should show nothing (no low priority todos match "meeting")
    await expect(page.locator('text=No todos found matching your filters')).toBeVisible();
  });

  test('should clear search with clear button', async ({ page }) => {
    // Enter search
    await page.fill('[aria-label="Search todos"]', 'test');
    await page.waitForTimeout(350);
    
    // Click clear button
    await page.click('[aria-label="Clear search"]');
    
    // Search bar should be empty
    await expect(page.locator('[aria-label="Search todos"]')).toHaveValue('');
    
    // All todos should be visible
    await expect(page.locator('text=/Showing all \\d+ todos/')).toBeVisible();
  });

  test('should clear all filters with clear all button', async ({ page }) => {
    // Apply multiple filters
    await page.fill('[aria-label="Search todos"]', 'meeting');
    await page.waitForTimeout(350);
    await page.click('button:has-text("High")');
    await page.click('button[aria-label="Filter by work tag"]');
    
    // Verify filters are active
    await expect(page.locator('text=Clear all filters')).toBeVisible();
    
    // Click clear all
    await page.click('text=Clear all filters');
    
    // All filters should be reset
    await expect(page.locator('[aria-label="Search todos"]')).toHaveValue('');
    await expect(page.locator('button[aria-pressed="true"]:has-text("All")')).toHaveCount(2); // Priority and Status both on "All"
    await expect(page.locator('text=/Showing all \\d+ todos/')).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    // Search for non-existent todo
    await page.fill('[aria-label="Search todos"]', 'nonexistent-todo-xyz');
    await page.waitForTimeout(350);
    
    // Should show empty state
    await expect(page.locator('text=No todos found matching your filters')).toBeVisible();
    await expect(page.locator('text=Clear all filters')).toBeVisible();
  });

  test('should focus search with "/" keyboard shortcut', async ({ page }) => {
    // Click somewhere else to remove focus
    await page.click('h1');
    
    // Press "/" key
    await page.keyboard.press('/');
    
    // Search bar should be focused
    await expect(page.locator('[aria-label="Search todos"]')).toBeFocused();
  });

  test('should clear search with ESC keyboard shortcut', async ({ page }) => {
    // Enter search and focus input
    await page.fill('[aria-label="Search todos"]', 'test');
    await page.locator('[aria-label="Search todos"]').focus();
    
    // Press ESC
    await page.keyboard.press('Escape');
    
    // Search should be cleared
    await expect(page.locator('[aria-label="Search todos"]')).toHaveValue('');
  });

  test('should show filter summary with active filters', async ({ page }) => {
    // Apply search
    await page.fill('[aria-label="Search todos"]', 'meeting');
    await page.waitForTimeout(350);
    
    // Should show search in summary
    await expect(page.locator('text=/Filtered by:/')).toBeVisible();
    await expect(page.locator('text=search: "meeting"')).toBeVisible();
    
    // Add priority filter
    await page.click('button:has-text("High")');
    
    // Should show both filters
    await expect(page.locator('text=priority: high')).toBeVisible();
  });

  test('should debounce search input', async ({ page }) => {
    // Type quickly
    await page.fill('[aria-label="Search todos"]', 'm');
    await page.fill('[aria-label="Search todos"]', 'me');
    await page.fill('[aria-label="Search todos"]', 'mee');
    await page.fill('[aria-label="Search todos"]', 'meet');
    
    // Should not filter yet (within 300ms)
    await page.waitForTimeout(100);
    // All todos might still be visible
    
    // Wait for debounce to complete
    await page.waitForTimeout(250);
    
    // Now should be filtered
    await expect(page.locator('text=Team meeting preparation')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
  });

  test('should announce filter results to screen readers', async ({ page }) => {
    // Apply filter
    await page.click('button:has-text("High")');
    
    // Should have aria-live region with status
    const statusRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(statusRegion).toBeVisible();
    await expect(statusRegion).toContainText(/Showing \d+ of \d+ todos/);
  });
});

// Helper functions

async function createTodo(
  page: any,
  title: string,
  priority: string,
  tags: string[] = []
) {
  // Fill title
  await page.fill('[placeholder*="What needs to be done"]', title);
  
  // Select priority
  await page.selectOption('select[name="priority"]', priority);
  
  // Add tags if specified
  for (const tag of tags) {
    // Assuming tag selection UI exists
    await page.click(`button[aria-label="Add ${tag} tag"]`);
  }
  
  // Submit
  await page.click('button:has-text("Add")');
  
  // Wait for todo to be created
  await page.waitForResponse(response => 
    response.url().includes('/api/todos') && response.status() === 200
  );
  
  // Wait a bit for UI to update
  await page.waitForTimeout(100);
}
