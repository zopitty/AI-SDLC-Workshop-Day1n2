import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

test.describe('Priority System', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the page to load first (this ensures the database is created)
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Todo App');
    
    // Now clear the database
    const dbPath = path.join(process.cwd(), 'todos.db');
    
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      
      try {
        // Delete all todos
        db.prepare('DELETE FROM todos').run();
      } catch (e) {
        // Table might not exist yet, that's okay
      }
      
      db.close();
    }
    
    // Reload the page to get fresh state
    await page.reload();
    await expect(page.locator('h1')).toContainText('Todo App');
  });

  test('should create todo with high priority', async ({ page }) => {
    // Fill in the todo form
    await page.fill('input[placeholder="Enter todo title..."]', 'Urgent task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    // Wait for the todo to appear
    await expect(page.locator('text=Urgent task')).toBeVisible();

    // Check that the priority badge is red (high priority)
    const badge = page.locator('text=Urgent task').locator('..').locator('span:has-text("High")').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/bg-red-500/);
  });

  test('should create todo with medium priority (default)', async ({ page }) => {
    await page.fill('input[placeholder="Enter todo title..."]', 'Regular task');
    // Don't change priority (should default to medium)
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Regular task')).toBeVisible();

    const badge = page.locator('text=Regular task').locator('..').locator('span:has-text("Medium")').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/bg-yellow-500/);
  });

  test('should create todo with low priority', async ({ page }) => {
    await page.fill('input[placeholder="Enter todo title..."]', 'Low priority task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Low priority task')).toBeVisible();

    const badge = page.locator('text=Low priority task').locator('..').locator('span:has-text("Low")').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/bg-green-500/);
  });

  test('should change todo priority', async ({ page }) => {
    // Create a todo with medium priority
    await page.fill('input[placeholder="Enter todo title..."]', 'Task to change');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Task to change')).toBeVisible();

    // Find the priority selector dropdown for this todo (not the form one)
    const todoItem = page.locator('text=Task to change').locator('../..');
    const prioritySelect = todoItem.locator('select').first();
    
    // Change priority to high
    await prioritySelect.selectOption('high');

    // Wait a bit for the API call to complete
    await page.waitForTimeout(500);

    // Check that badge is now red
    const badge = todoItem.locator('span:has-text("High")').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/bg-red-500/);
  });

  test('should filter by high priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder="Enter todo title..."]', 'High priority task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=High priority task')).toBeVisible();

    await page.fill('input[placeholder="Enter todo title..."]', 'Medium priority task');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Medium priority task')).toBeVisible();

    await page.fill('input[placeholder="Enter todo title..."]', 'Low priority task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Low priority task')).toBeVisible();

    // All todos should be visible initially
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).toBeVisible();
    await expect(page.locator('text=Low priority task')).toBeVisible();

    // Click the High filter button
    await page.click('button:has-text("High")');

    // Only high priority task should be visible
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });

  test('should filter by medium priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder="Enter todo title..."]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Medium task');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    // Click the Medium filter button
    await page.click('button:has-text("Medium")');

    // Only medium priority task should be visible
    await expect(page.locator('text=Medium task')).toBeVisible();
    await expect(page.locator('text=High task')).not.toBeVisible();
  });

  test('should filter by low priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder="Enter todo title..."]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Low task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Click the Low filter button
    await page.click('button:has-text("Low")');

    // Only low priority task should be visible
    await expect(page.locator('text=Low task')).toBeVisible();
    await expect(page.locator('text=High task')).not.toBeVisible();
  });

  test('should show all todos when clicking All filter', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder="Enter todo title..."]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Low task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Filter by high
    await page.click('button:has-text("High")');
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Low task')).not.toBeVisible();

    // Click All to show everything
    await page.click('button:has-text("All")');
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Low task')).toBeVisible();
  });

  test('should sort by priority when enabled', async ({ page }) => {
    // Create todos in reverse priority order
    await page.fill('input[placeholder="Enter todo title..."]', 'Low task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Medium task');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    // Enable priority sorting
    await page.check('input[type="checkbox"]');

    // Wait for re-render
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todos = await page.locator('h3').allTextContents();

    // Should be in order: High, Medium, Low
    expect(todos[0]).toBe('High task');
    expect(todos[1]).toBe('Medium task');
    expect(todos[2]).toBe('Low task');
  });

  test('should place completed todos at bottom when sorting by priority', async ({ page }) => {
    // Create high priority todo
    await page.fill('input[placeholder="Enter todo title..."]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    // Create low priority todo
    await page.fill('input[placeholder="Enter todo title..."]', 'Low task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Enable priority sorting
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Complete the high priority todo
    const highTodoCheckbox = page.locator('text=High task').locator('../..').locator('input[type="checkbox"]');
    await highTodoCheckbox.check();

    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todos = await page.locator('h3').allTextContents();

    // Low (incomplete) should come before High (completed)
    expect(todos[0]).toBe('Low task');
    expect(todos[1]).toBe('High task');
  });

  test('should persist sort preference in localStorage', async ({ page, context }) => {
    // Enable priority sorting
    await page.check('input[type="checkbox"]');

    // Create a new page (simulates page reload)
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Wait for page to load
    await expect(newPage.locator('h1')).toContainText('Todo App');

    // Check that sorting checkbox is still checked
    const checkbox = newPage.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();

    await newPage.close();
  });

  test('should show correct todo counts in filter buttons', async ({ page }) => {
    // Create 2 high, 1 medium, 1 low priority todos
    await page.fill('input[placeholder="Enter todo title..."]', 'High 1');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'High 2');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Medium 1');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    await page.fill('input[placeholder="Enter todo title..."]', 'Low 1');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Check the counts in filter buttons
    await expect(page.locator('button:has-text("All (4)")')).toBeVisible();
    await expect(page.locator('button:has-text("High (2)")')).toBeVisible();
    await expect(page.locator('button:has-text("Medium (1)")')).toBeVisible();
    await expect(page.locator('button:has-text("Low (1)")')).toBeVisible();
  });

  test('should show empty state when no todos match filter', async ({ page }) => {
    // Don't create any todos, just filter by high
    await page.click('button:has-text("High")');

    // Should show empty state
    await expect(page.locator('text=No high priority tasks')).toBeVisible();
  });
});
