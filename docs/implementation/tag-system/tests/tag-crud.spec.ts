/**
 * E2E Test: Tag CRUD Operations
 * 
 * Tests creating, reading, updating, and deleting tags
 * 
 * Location: tests/06-tag-crud.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Tag CRUD Operations', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set timezone to Singapore
    await context.addInitScript(() => {
      // Mock timezone if needed
    });

    // Register and login using virtual authenticator
    await page.goto('/');
    // ... authentication setup (use helpers from tests/helpers.ts)
  });

  test('should create a new tag', async ({ page }) => {
    // Open Tag Manager
    await page.click('button:has-text("Manage Tags")');
    await expect(page.locator('[aria-labelledby="tag-manager-title"]')).toBeVisible();

    // Click create new tag
    await page.click('button:has-text("Create New Tag")');

    // Fill tag form
    await page.fill('input#tag-name', 'work');
    
    // Select color from palette
    await page.click('button[aria-label="Blue (#3B82F6)"]');

    // Submit form
    await page.click('button:has-text("Create Tag")');

    // Verify tag appears in list
    await expect(page.locator('text=work')).toBeVisible();
    
    // Verify tag has correct color
    const tagPill = page.locator('span:has-text("work")').first();
    const backgroundColor = await tagPill.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(59, 130, 246)'); // #3B82F6
  });

  test('should show validation error for empty tag name', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');

    // Try to submit without name
    await page.click('button:has-text("Create Tag")');

    // Should prevent submission (required attribute)
    await expect(page.locator('text=Create New Tag')).toBeVisible();
  });

  test('should show error for duplicate tag name', async ({ page }) => {
    // Create first tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'urgent');
    await page.click('button[aria-label*="Red"]');
    await page.click('button:has-text("Create Tag")');
    await expect(page.locator('span:has-text("urgent")')).toBeVisible();

    // Try to create duplicate
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'urgent');
    await page.click('button[aria-label*="Blue"]');
    await page.click('button:has-text("Create Tag")');

    // Should show error
    await expect(page.locator('text=already exists')).toBeVisible();
  });

  test('should create tag with custom color', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'custom');

    // Click "Use custom color"
    await page.click('button:has-text("Use custom color")');
    
    // Enter custom hex color
    await page.fill('input#custom-color-input', '#FF5733');
    await page.click('button[aria-label="Apply custom color"]');

    // Submit form
    await page.click('button:has-text("Create Tag")');

    // Verify tag with custom color
    const tagPill = page.locator('span:has-text("custom")').first();
    const backgroundColor = await tagPill.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(255, 87, 51)'); // #FF5733
  });

  test('should show error for invalid hex color', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.click('button:has-text("Use custom color")');

    // Enter invalid color (missing #)
    await page.fill('input#custom-color-input', 'FF5733');
    
    // Should show error
    await expect(page.locator('text=Invalid hex color format')).toBeVisible();

    // Apply button should be disabled
    await expect(page.locator('button[aria-label="Apply custom color"]')).toBeDisabled();
  });

  test('should edit existing tag', async ({ page }) => {
    // Create a tag first
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'project');
    await page.click('button[aria-label*="Green"]');
    await page.click('button:has-text("Create Tag")');

    // Edit the tag
    await page.click('button[aria-label="Edit project tag"]');
    
    // Change name
    await page.fill('input#tag-name', 'work-project');
    
    // Change color
    await page.click('button[aria-label*="Purple"]');
    
    // Submit
    await page.click('button:has-text("Update Tag")');

    // Verify changes
    await expect(page.locator('span:has-text("work-project")')).toBeVisible();
    await expect(page.locator('span:has-text("project")')).not.toBeVisible();
    
    const tagPill = page.locator('span:has-text("work-project")').first();
    const backgroundColor = await tagPill.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(139, 92, 246)'); // #8B5CF6 (Purple)
  });

  test('should cancel tag edit', async ({ page }) => {
    // Create a tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'test');
    await page.click('button[aria-label*="Blue"]');
    await page.click('button:has-text("Create Tag")');

    // Start editing
    await page.click('button[aria-label="Edit test tag"]');
    await page.fill('input#tag-name', 'changed');
    
    // Cancel
    await page.click('button:has-text("Cancel")');

    // Should still show original name
    await expect(page.locator('span:has-text("test")')).toBeVisible();
    await expect(page.locator('span:has-text("changed")')).not.toBeVisible();
  });

  test('should delete tag with confirmation', async ({ page }) => {
    // Create a tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'to-delete');
    await page.click('button[aria-label*="Red"]');
    await page.click('button:has-text("Create Tag")');

    // Click delete
    await page.click('button[aria-label="Delete to-delete tag"]');
    
    // Should show confirmation
    await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Tag should be removed
    await expect(page.locator('span:has-text("to-delete")')).not.toBeVisible();
  });

  test('should cancel tag deletion', async ({ page }) => {
    // Create a tag
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'keep-me');
    await page.click('button[aria-label*="Blue"]');
    await page.click('button:has-text("Create Tag")');

    // Click delete
    await page.click('button[aria-label="Delete keep-me tag"]');
    
    // Cancel
    await page.click('button:has-text("Cancel")').nth(1); // Second Cancel button (in delete confirm)

    // Tag should still be visible
    await expect(page.locator('span:has-text("keep-me")')).toBeVisible();
  });

  test('should show tag count', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');

    // Initially no tags
    await expect(page.locator('text=0 tags total')).toBeVisible();

    // Create first tag
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'first');
    await page.click('button[aria-label*="Blue"]');
    await page.click('button:has-text("Create Tag")');

    await expect(page.locator('text=1 tag total')).toBeVisible();

    // Create second tag
    await page.click('button:has-text("Create New Tag")');
    await page.fill('input#tag-name', 'second');
    await page.click('button[aria-label*="Red"]');
    await page.click('button:has-text("Create Tag")');

    await expect(page.locator('text=2 tags total')).toBeVisible();
  });

  test('should enforce 30 character limit on tag name', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');

    // Try to enter more than 30 characters
    const longName = 'a'.repeat(35);
    await page.fill('input#tag-name', longName);

    // Input should truncate to 30 chars (due to maxLength attribute)
    const inputValue = await page.inputValue('input#tag-name');
    expect(inputValue.length).toBeLessThanOrEqual(30);

    // Character counter should show 30/30
    await expect(page.locator('text=30/30 characters')).toBeVisible();
  });

  test('should close Tag Manager on Escape key', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await expect(page.locator('[aria-labelledby="tag-manager-title"]')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(page.locator('[aria-labelledby="tag-manager-title"]')).not.toBeVisible();
  });

  test('should close Tag Manager on backdrop click', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await expect(page.locator('[aria-labelledby="tag-manager-title"]')).toBeVisible();

    // Click backdrop (outside modal)
    await page.locator('.bg-black.bg-opacity-50').click({ position: { x: 10, y: 10 } });

    // Modal should be closed
    await expect(page.locator('[aria-labelledby="tag-manager-title"]')).not.toBeVisible();
  });

  test('should show empty state when no tags', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    
    await expect(page.locator('text=No tags yet. Create your first tag above!')).toBeVisible();
  });

  test('should sort tags alphabetically', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');

    // Create tags in non-alphabetical order
    const tags = ['zebra', 'apple', 'monkey'];
    
    for (const tagName of tags) {
      await page.click('button:has-text("Create New Tag")');
      await page.fill('input#tag-name', tagName);
      await page.click('button[aria-label*="Blue"]');
      await page.click('button:has-text("Create Tag")');
    }

    // Get tag names in order they appear
    const tagElements = await page.locator('span[class*="rounded-full"]').allTextContents();
    
    // Should be sorted alphabetically
    expect(tagElements).toEqual(['apple', 'monkey', 'zebra']);
  });
});

/**
 * Accessibility Tests
 */
test.describe('Tag CRUD Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ... authentication setup
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    
    // Tab to close button
    await page.keyboard.press('Tab');
    await expect(page.locator('button[aria-label="Close tag manager"]')).toBeFocused();
    
    // Tab to create button
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Create New Tag")')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    
    // Check modal ARIA attributes
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'tag-manager-title');
  });

  test('should announce errors to screen readers', async ({ page }) => {
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Create New Tag")');
    await page.click('button:has-text("Use custom color")');
    await page.fill('input#custom-color-input', 'invalid');
    
    // Error should have role="alert"
    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible();
  });
});
