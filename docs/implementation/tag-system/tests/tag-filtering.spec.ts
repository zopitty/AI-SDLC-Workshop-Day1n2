/**
 * E2E Test: Tag Filtering
 * 
 * Tests filtering todos by tags
 * 
 * Location: tests/08-tag-filtering.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Tag Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ... authentication setup

    // Create tags
    await page.click('button:has-text("Manage Tags")');
    const tags = [
      { name: 'work', color: '#3B82F6' },
      { name: 'personal', color: '#10B981' },
      { name: 'urgent', color: '#EF4444' },
    ];

    for (const tag of tags) {
      await page.click('button:has-text("Create New Tag")');
      await page.fill('input#tag-name', tag.name);
      await page.click(`button[aria-label*="${tag.color}"]`);
      await page.click('button:has-text("Create Tag")');
    }
    await page.click('button[aria-label="Close tag manager"]');

    // Create todos with different tags
    const todos = [
      { title: 'Work task 1', tags: ['work'] },
      { title: 'Work task 2', tags: ['work', 'urgent'] },
      { title: 'Personal task', tags: ['personal'] },
      { title: 'Urgent personal task', tags: ['personal', 'urgent'] },
      { title: 'No tags task', tags: [] },
    ];

    for (const todo of todos) {
      await page.click('button:has-text("Add Todo")');
      await page.fill('input[placeholder*="title"]', todo.title);
      await page.click('button:has-text("Create")');

      if (todo.tags.length > 0) {
        const todoCard = page.locator(`text=${todo.title}`).locator('..');
        for (const tagName of todo.tags) {
          await todoCard.locator('input[placeholder*="Add tags"]').click();
          await page.click(`button:has-text("${tagName}")`);
        }
      }
    }
  });

  test('should filter todos by clicking tag pill', async ({ page }) => {
    // Click "work" tag on any todo
    await page.locator('span:has-text("work")').first().click();

    // Should show only todos with "work" tag
    await expect(page.locator('text=Work task 1')).toBeVisible();
    await expect(page.locator('text=Work task 2')).toBeVisible();
    
    // Should hide todos without "work" tag
    await expect(page.locator('text=Personal task')).not.toBeVisible();
    await expect(page.locator('text=No tags task')).not.toBeVisible();
  });

  test('should show filter indicator when filtering by tag', async ({ page }) => {
    // Click tag to filter
    await page.locator('span:has-text("work")').first().click();

    // Should show "Filtered by: work" indicator
    await expect(page.locator('text=Filtered by:')).toBeVisible();
    
    // Should show the tag pill in filter area
    const filterArea = page.locator('text=Filtered by:').locator('..');
    await expect(filterArea.locator('span:has-text("work")')).toBeVisible();
  });

  test('should clear filter by removing filter tag', async ({ page }) => {
    // Apply filter
    await page.locator('span:has-text("work")').first().click();
    
    // Click remove on filter tag
    await page.locator('text=Filtered by:')
      .locator('..')
      .locator('span:has-text("work")')
      .locator('button[aria-label*="Remove"]')
      .click();

    // Should show all todos again
    await expect(page.locator('text=Work task 1')).toBeVisible();
    await expect(page.locator('text=Personal task')).toBeVisible();
    await expect(page.locator('text=No tags task')).toBeVisible();
    
    // Filter indicator should be hidden
    await expect(page.locator('text=Filtered by:')).not.toBeVisible();
  });

  test('should filter by different tags sequentially', async ({ page }) => {
    // Filter by "work"
    await page.locator('span:has-text("work")').first().click();
    await expect(page.locator('text=Work task 1')).toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();

    // Clear filter
    await page.locator('text=Filtered by:')
      .locator('..')
      .locator('button[aria-label*="Remove"]')
      .click();

    // Filter by "personal"
    await page.locator('span:has-text("personal")').first().click();
    await expect(page.locator('text=Personal task')).toBeVisible();
    await expect(page.locator('text=Work task 1')).not.toBeVisible();
  });

  test('should show todos with multiple tags when filtering by one', async ({ page }) => {
    // Filter by "urgent"
    await page.locator('span:has-text("urgent")').first().click();

    // Should show both todos that have "urgent" tag
    await expect(page.locator('text=Work task 2')).toBeVisible(); // has work + urgent
    await expect(page.locator('text=Urgent personal task')).toBeVisible(); // has personal + urgent
    
    // Should hide todos without "urgent"
    await expect(page.locator('text=Work task 1')).not.toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();
  });

  test('should maintain filter when adding new todo', async ({ page }) => {
    // Apply filter
    await page.locator('span:has-text("work")').first().click();

    // Add new todo with different tag
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'New personal task');
    await page.click('button:has-text("Create")');
    
    const newTodo = page.locator('text=New personal task').locator('..');
    await newTodo.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("personal")');

    // New todo should not be visible (doesn't have "work" tag)
    await expect(page.locator('text=New personal task')).not.toBeVisible();

    // Filter should still be active
    await expect(page.locator('text=Filtered by:')).toBeVisible();
  });

  test('should show newly created todo if it has the filter tag', async ({ page }) => {
    // Apply filter
    await page.locator('span:has-text("work")').first().click();

    // Add new todo with matching tag
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'New work task');
    await page.click('button:has-text("Create")');
    
    const newTodo = page.locator('text=New work task').locator('..');
    await newTodo.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // New todo should be visible (has "work" tag)
    await expect(page.locator('text=New work task')).toBeVisible();
  });

  test('should hide todo when removing filtered tag from it', async ({ page }) => {
    // Filter by "work"
    await page.locator('span:has-text("work")').first().click();
    
    // Remove "work" tag from one of the visible todos
    const todo = page.locator('text=Work task 1').locator('..');
    await todo.locator('span:has-text("work")')
      .locator('button[aria-label*="Remove"]')
      .click();

    // Todo should disappear from view
    await expect(page.locator('text=Work task 1')).not.toBeVisible();
    
    // Other work todos should still be visible
    await expect(page.locator('text=Work task 2')).toBeVisible();
  });

  test('should show todo when adding filtered tag to it', async ({ page }) => {
    // Filter by "work"
    await page.locator('span:has-text("work")').first().click();
    
    // "Personal task" should not be visible
    await expect(page.locator('text=Personal task')).not.toBeVisible();

    // Clear filter temporarily to access the todo
    await page.locator('text=Filtered by:')
      .locator('..')
      .locator('button[aria-label*="Remove"]')
      .click();
    
    // Add "work" tag to "Personal task"
    const todo = page.locator('text=Personal task').locator('..');
    await todo.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // Re-apply filter by clicking tag
    await page.locator('span:has-text("work")').first().click();

    // "Personal task" should now be visible
    await expect(page.locator('text=Personal task')).toBeVisible();
  });

  test('should update URL when filtering by tag', async ({ page }) => {
    // Filter by tag
    await page.locator('span:has-text("work")').first().click();

    // URL should include tag filter parameter
    await expect(page).toHaveURL(/tagId=\d+/);
  });

  test('should restore filter from URL on page load', async ({ page }) => {
    // Get tag ID first
    await page.locator('span:has-text("work")').first().click();
    const url = page.url();
    
    // Reload page
    await page.goto(url);

    // Filter should be active
    await expect(page.locator('text=Filtered by:')).toBeVisible();
    await expect(page.locator('text=Work task 1')).toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();
  });

  test('should clear filter when deleting the filtered tag', async ({ page }) => {
    // Filter by "work"
    await page.locator('span:has-text("work")').first().click();
    await expect(page.locator('text=Filtered by:')).toBeVisible();

    // Open Tag Manager and delete "work" tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button[aria-label="Delete work tag"]');
    await page.click('button:has-text("Confirm")');
    await page.click('button[aria-label="Close tag manager"]');

    // Filter should be cleared
    await expect(page.locator('text=Filtered by:')).not.toBeVisible();
    
    // All todos should be visible (except those that had only "work" tag)
    await expect(page.locator('text=Personal task')).toBeVisible();
    await expect(page.locator('text=No tags task')).toBeVisible();
  });

  test('should show empty state when no todos match filter', async ({ page }) => {
    // Create a tag with no todos
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'unused');
    await page.click('button[aria-label*="Blue"]');
    await page.click('button:has-text("Create Tag")');
    await page.click('button[aria-label="Close tag manager"]');

    // Filter by the unused tag
    // (Need to click from Tag Manager or add a filter UI)
    // For now, assume we can navigate to /?tagId=X
    
    // Alternative: Use the tag manager to show tag list and click from there
    await page.click('button:has-text("Manage Tags")');
    await page.locator('span:has-text("unused")').click();

    // Should show empty state
    await expect(page.locator('text=No todos found')).toBeVisible();
    // or similar empty state message
  });

  test('should combine tag filter with other filters', async ({ page }) => {
    // This test assumes other filters exist (priority, completion status)
    
    // Filter by tag
    await page.locator('span:has-text("work")').first().click();

    // Apply priority filter (if exists)
    await page.selectOption('select[name="priority"]', 'high');

    // Should show only high priority work todos
    // Exact assertions depend on todo priorities set up
  });

  test('should display tag count in Tag Manager for filtered tag', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');

    // Should show how many todos each tag has
    // (This requires the UI to display todo counts)
    // Example: "work (2)" meaning 2 todos have this tag
  });

  test('should persist filter across page navigation', async ({ page }) => {
    // Filter by tag
    await page.locator('span:has-text("work")').first().click();

    // Navigate to calendar view (if exists)
    await page.click('a[href="/calendar"]');
    
    // Go back to todos
    await page.click('a[href="/"]');

    // Filter should still be active
    await expect(page.locator('text=Filtered by:')).toBeVisible();
  });

  test('should show all tags on filtered todos', async ({ page }) => {
    // Filter by "urgent"
    await page.locator('span:has-text("urgent")').first().click();

    // "Work task 2" has both "work" and "urgent" tags
    const todo = page.locator('text=Work task 2').locator('..');
    
    // Both tags should be visible even though filtering by one
    await expect(todo.locator('span:has-text("work")')).toBeVisible();
    await expect(todo.locator('span:has-text("urgent")')).toBeVisible();
  });

  test('should handle clicking same tag to filter that is already filtered', async ({ page }) => {
    // Filter by "work"
    await page.locator('span:has-text("work")').first().click();
    await expect(page.locator('text=Filtered by:')).toBeVisible();

    // Click "work" tag again
    await page.locator('span:has-text("work")').first().click();

    // Should either:
    // A) Clear the filter (toggle behavior)
    // B) Do nothing (already filtered)
    // Exact behavior depends on UX design
  });
});

/**
 * Performance Tests
 */
test.describe('Tag Filtering Performance', () => {
  test('should filter large todo list efficiently', async ({ page }) => {
    // Create many todos with tags
    for (let i = 0; i < 50; i++) {
      await page.click('button:has-text("Add Todo")');
      await page.fill('input[placeholder*="title"]', `Todo ${i}`);
      await page.click('button:has-text("Create")');
      
      const todo = page.locator(`text=Todo ${i}`).locator('..');
      await todo.locator('input[placeholder*="Add tags"]').click();
      await page.click(`button:has-text("${i % 2 === 0 ? 'work' : 'personal'}")`);
    }

    // Measure filter performance
    const startTime = Date.now();
    await page.locator('span:has-text("work")').first().click();
    const endTime = Date.now();

    // Should filter within reasonable time (< 1 second)
    expect(endTime - startTime).toBeLessThan(1000);

    // Should show correct count
    const visibleTodos = await page.locator('[class*="todo-card"]').count();
    expect(visibleTodos).toBe(25); // Half of 50
  });
});
