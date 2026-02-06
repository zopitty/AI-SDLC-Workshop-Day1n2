/**
 * E2E Test: Tag Assignment to Todos
 * 
 * Tests assigning and unassigning tags to/from todos
 * 
 * Location: tests/07-tag-assignment.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Tag Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ... authentication setup

    // Create some tags for testing
    await page.click('button:has-text("Manage Tags")');
    
    const tags = [
      { name: 'work', color: '#3B82F6' },
      { name: 'urgent', color: '#EF4444' },
      { name: 'personal', color: '#10B981' },
    ];

    for (const tag of tags) {
      await page.click('button:has-text("Create New Tag")');
      await page.fill('input#tag-name', tag.name);
      await page.click(`button[aria-label*="${tag.color}"]`);
      await page.click('button:has-text("Create Tag")');
    }

    await page.click('button[aria-label="Close tag manager"]');
  });

  test('should assign tag to todo using TagSelector', async ({ page }) => {
    // Create a todo first
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Complete project');
    await page.click('button:has-text("Create")');

    // Open tag selector on the todo
    const todoCard = page.locator('text=Complete project').locator('..');
    await todoCard.locator('input[placeholder*="Add tags"]').click();

    // Select a tag from dropdown
    await page.click('button:has-text("work")');

    // Tag should appear on todo
    await expect(todoCard.locator('span:has-text("work")')).toBeVisible();
  });

  test('should assign multiple tags to todo', async ({ page }) => {
    // Create a todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Important meeting');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Important meeting').locator('..');
    
    // Assign first tag
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // Assign second tag
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("urgent")');

    // Both tags should be visible
    await expect(todoCard.locator('span:has-text("work")')).toBeVisible();
    await expect(todoCard.locator('span:has-text("urgent")')).toBeVisible();
  });

  test('should remove tag from todo', async ({ page }) => {
    // Create todo with tag
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Task with tag');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Task with tag').locator('..');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // Remove tag
    await todoCard.locator('span:has-text("work")').locator('button[aria-label*="Remove"]').click();

    // Tag should be removed
    await expect(todoCard.locator('span:has-text("work")')).not.toBeVisible();
  });

  test('should prevent assigning same tag twice', async ({ page }) => {
    // Create todo with tag
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Tagged task');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Tagged task').locator('..');
    
    // Assign tag
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // Open selector again
    await todoCard.locator('input[placeholder*="Add tags"]').click();

    // "work" tag should not appear in dropdown (already selected)
    await expect(page.locator('button:has-text("work")').last()).not.toBeVisible();
  });

  test('should show selected tags in tag selector', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Multi-tag task');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Multi-tag task').locator('..');
    
    // Assign tags
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("urgent")');

    // Selected tags should appear above input
    const selector = todoCard.locator('[class*="tag-selector"]');
    await expect(selector.locator('span:has-text("work")')).toBeVisible();
    await expect(selector.locator('span:has-text("urgent")')).toBeVisible();
  });

  test('should create new tag from TagSelector', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Task needing new tag');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Task needing new tag').locator('..');
    
    // Open tag selector and search for non-existent tag
    await todoCard.locator('input[placeholder*="Add tags"]').fill('newcat');
    
    // "Create tag" option should appear
    await expect(page.locator('text=Create tag "newcat"')).toBeVisible();
    
    // Click to create
    await page.click('button:has-text("Create tag")');

    // New tag should be assigned to todo
    await expect(todoCard.locator('span:has-text("newcat")')).toBeVisible();
  });

  test('should filter tag dropdown by search', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Searchable tags');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Searchable tags').locator('..');
    
    // Open selector and search
    await todoCard.locator('input[placeholder*="Add tags"]').fill('urg');
    
    // Should show only "urgent"
    await expect(page.locator('button:has-text("urgent")')).toBeVisible();
    await expect(page.locator('button:has-text("work")')).not.toBeVisible();
    await expect(page.locator('button:has-text("personal")')).not.toBeVisible();
  });

  test('should navigate tag dropdown with keyboard', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Keyboard nav');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Keyboard nav').locator('..');
    const input = todoCard.locator('input[placeholder*="Add tags"]');
    
    // Focus input
    await input.click();
    
    // Press down arrow to open and navigate
    await page.keyboard.press('ArrowDown');
    
    // First option should be focused (visual indicator)
    const firstOption = page.locator('button:has-text("personal")'); // Alphabetically first
    await expect(firstOption).toHaveClass(/bg-gray-100/);
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    
    // Tag should be assigned
    await expect(todoCard.locator('span:has-text("personal")')).toBeVisible();
  });

  test('should close dropdown on Escape', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Escape test');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Escape test').locator('..');
    
    // Open dropdown
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should remove last tag with Backspace on empty input', async ({ page }) => {
    // Create todo with tags
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Backspace test');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Backspace test').locator('..');
    
    // Assign tags
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("urgent")');

    // Focus input (should be empty) and press Backspace
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.keyboard.press('Backspace');
    
    // Last tag (urgent) should be removed
    await expect(todoCard.locator('span:has-text("urgent")')).not.toBeVisible();
    await expect(todoCard.locator('span:has-text("work")')).toBeVisible();
  });

  test('should enforce max tags limit if specified', async ({ page }) => {
    // This test assumes maxTags prop is set to 3
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Max tags test');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Max tags test').locator('..');
    const input = todoCard.locator('input[placeholder*="Add tags"]');
    
    // Assign 3 tags
    await input.click();
    await page.click('button:has-text("personal")');
    await input.click();
    await page.click('button:has-text("urgent")');
    await input.click();
    await page.click('button:has-text("work")');

    // Input should be disabled
    await expect(input).toBeDisabled();
    
    // Should show max reached message
    await expect(todoCard.locator('text=Maximum 3 tags')).toBeVisible();
  });

  test('should persist tags after page reload', async ({ page }) => {
    // Create todo with tags
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Persistent tags');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Persistent tags').locator('..');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("urgent")');

    // Reload page
    await page.reload();

    // Tags should still be visible
    const reloadedCard = page.locator('text=Persistent tags').locator('..');
    await expect(reloadedCard.locator('span:has-text("work")')).toBeVisible();
    await expect(reloadedCard.locator('span:has-text("urgent")')).toBeVisible();
  });

  test('should show tag count indicator', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Tag counter');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Tag counter').locator('..');
    
    // Assign tags
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("urgent")');

    // Should show "2 / 5 tags selected" or similar
    await expect(todoCard.locator('text=2 /')).toBeVisible();
  });

  test('should handle rapid tag assignment', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Rapid assignment');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Rapid assignment').locator('..');
    
    // Rapidly assign multiple tags
    const input = todoCard.locator('input[placeholder*="Add tags"]');
    await input.click();
    await page.click('button:has-text("work")');
    await page.click('button:has-text("urgent")');
    await page.click('button:has-text("personal")');

    // Wait for API calls to complete
    await page.waitForTimeout(500);

    // All tags should be assigned
    await expect(todoCard.locator('span:has-text("work")')).toBeVisible();
    await expect(todoCard.locator('span:has-text("urgent")')).toBeVisible();
    await expect(todoCard.locator('span:has-text("personal")')).toBeVisible();
  });

  test('should show empty state in dropdown when no tags available', async ({ page }) => {
    // Delete all tags first
    await page.click('button:has-text("Manage Tags")');
    
    // Delete each tag
    await page.click('button[aria-label="Delete work tag"]');
    await page.click('button:has-text("Confirm")');
    await page.click('button[aria-label="Delete urgent tag"]');
    await page.click('button:has-text("Confirm")');
    await page.click('button[aria-label="Delete personal tag"]');
    await page.click('button:has-text("Confirm")');
    
    await page.click('button[aria-label="Close tag manager"]');

    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'No tags available');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=No tags available').locator('..');
    await todoCard.locator('input[placeholder*="Add tags"]').click();

    // Should show "No tags found"
    await expect(page.locator('text=No tags found')).toBeVisible();
  });
});

/**
 * Accessibility Tests
 */
test.describe('Tag Assignment Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ... setup tags
  });

  test('should have proper ARIA attributes on dropdown', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'ARIA test');
    await page.click('button:has-text("Create")');

    const input = page.locator('text=ARIA test')
      .locator('..')
      .locator('input[placeholder*="Add tags"]');
    
    // Check ARIA attributes
    await expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    
    // Open dropdown
    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    
    // Dropdown should have role="listbox"
    await expect(page.locator('[role="listbox"]')).toBeVisible();
  });

  test('should announce tag removal to screen readers', async ({ page }) => {
    // Create todo with tag
    await page.click('button:has-text("Add Todo")');
    await page.fill('input[placeholder*="title"]', 'Remove announce');
    await page.click('button:has-text("Create")');

    const todoCard = page.locator('text=Remove announce').locator('..');
    await todoCard.locator('input[placeholder*="Add tags"]').click();
    await page.click('button:has-text("work")');

    // Remove button should have aria-label
    const removeBtn = todoCard.locator('button[aria-label*="Remove work"]');
    await expect(removeBtn).toHaveAttribute('aria-label', 'Remove work tag');
  });
});
