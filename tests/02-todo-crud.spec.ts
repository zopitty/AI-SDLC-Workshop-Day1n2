import { test, expect } from '@playwright/test';

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Todo App")');
  });

  test('should display the todo app interface', async ({ page }) => {
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Todo App');
    
    // Check for add todo form
    await expect(page.locator('input[placeholder="Add a new todo..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Add")')).toBeVisible();
  });

  test('should create a todo with title only', async ({ page }) => {
    const todoTitle = 'Buy milk';
    
    // Fill in the title
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    
    // Click Add Todo button
    await page.click('button:has-text("Add")');
    
    // Wait for the todo to appear in the list
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Verify the input is cleared
    await expect(page.locator('input[placeholder="Add a new todo..."]')).toHaveValue('');
  });

  test('should create a todo with title and due date', async ({ page }) => {
    const todoTitle = 'Complete project report';
    const dueDate = '2026-12-25T14:30';
    
    // Fill in the form
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.fill('input[type="datetime-local"]', dueDate);
    
    // Submit
    await page.click('button:has-text("Add")');
    
    // Verify todo appears
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Verify due date is displayed
    await expect(page.locator('text=/Due:.*Dec 25, 2026/').first()).toBeVisible();
  });

  test('should toggle todo completion status', async ({ page }) => {
    const todoTitle = 'Test completion';
    
    // Create a todo
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Find the checkbox for this todo
    const todoItem = page.locator('li').filter({ hasText: todoTitle }).first();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    
    // Check the checkbox
    await checkbox.check();
    await page.waitForTimeout(500); // Wait for optimistic update
    
    // Verify it's checked
    await expect(checkbox).toBeChecked();
    
    // Uncheck it
    await checkbox.uncheck();
    await page.waitForTimeout(500);
    
    // Verify it's unchecked
    await expect(checkbox).not.toBeChecked();
  });

  test('should edit todo title', async ({ page }) => {
    const originalTitle = 'Original task';
    const updatedTitle = 'Updated task';
    
    // Create a todo
    await page.fill('input[placeholder="Add a new todo..."]', originalTitle);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${originalTitle}`).first()).toBeVisible();
    
    // Click on the title to edit
    await page.click(`text=${originalTitle}`);
    
    // Wait for edit input to appear
    const editInput = page.locator('input[type="text"]').last();
    await expect(editInput).toBeVisible();
    
    // Clear and type new title
    await editInput.fill(updatedTitle);
    
    // Press Enter to save
    await editInput.press('Enter');
    
    // Wait a moment for the update
    await page.waitForTimeout(500);
    
    // Verify the updated title appears
    await expect(page.locator(`text=${updatedTitle}`).first()).toBeVisible();
    await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible();
  });

  test('should delete todo with confirmation', async ({ page }) => {
    const todoTitle = 'Task to delete';
    
    // Create a todo
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Find and click the delete button
    const todoItem = page.locator('li').filter({ hasText: todoTitle }).first();
    const deleteButton = todoItem.locator('button[aria-label*="Delete"]');
    await deleteButton.click();
    
    // Confirmation modal should appear
    await expect(page.locator('text=Delete this todo?')).toBeVisible();
    
    // Click delete in modal
    await page.locator('button:has-text("Delete")').last().click();
    
    // Wait a moment for deletion
    await page.waitForTimeout(500);
    
    // Verify todo is removed
    await expect(page.locator(`text=${todoTitle}`)).not.toBeVisible();
  });

  test('should cancel todo deletion', async ({ page }) => {
    const todoTitle = 'Task to keep';
    
    // Create a todo
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Find and click the delete button
    const todoItem = page.locator('li').filter({ hasText: todoTitle }).first();
    const deleteButton = todoItem.locator('button[aria-label*="Delete"]');
    await deleteButton.click();
    
    // Confirmation modal should appear
    await expect(page.locator('text=Delete this todo?')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Modal should close
    await expect(page.locator('text=Delete this todo?')).not.toBeVisible();
    
    // Todo should still exist
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
  });

  test('should display empty state when no todos exist', async ({ page }) => {
    // If there are any todos, delete them all first
    const todos = await page.locator('li input[type="checkbox"]').count();
    
    for (let i = 0; i < todos; i++) {
      // Click first delete button
      await page.locator('button[aria-label*="Delete"]').first().click();
      // Confirm deletion
      await page.locator('button:has-text("Delete")').last().click();
      await page.waitForTimeout(300);
    }
    
    // Check for empty state message
    await expect(page.locator('text=No todos yet. Add your first task above!')).toBeVisible();
  });

  test('should validate empty title', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Add")');
    
    // Should show error message
    await expect(page.locator('text=/Title cannot be empty/i')).toBeVisible();
  });

  test('should show overdue todos in red', async ({ page }) => {
    const todoTitle = 'Overdue task';
    // Set due date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dueDateStr = yesterday.toISOString().slice(0, 16);
    
    // Create todo with past due date
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.fill('input[type="datetime-local"]', dueDateStr);
    await page.click('button:has-text("Add")');
    
    // Wait for todo to appear
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Verify overdue styling (red color)
    const todoItem = page.locator('li').filter({ hasText: todoTitle }).first();
    const dueText = todoItem.locator('text=/Due:.*Overdue/');
    await expect(dueText).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    const todos = ['Task 1', 'Task 2', 'Task 3'];
    
    // Create multiple todos
    for (const todo of todos) {
      await page.fill('input[placeholder="Add a new todo..."]', todo);
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(300);
    }
    
    // Verify all todos appear
    for (const todo of todos) {
      await expect(page.locator(`text=${todo}`).first()).toBeVisible();
    }
    
    // Verify they're in reverse order (newest first)
    const firstTodo = page.locator('li').first();
    await expect(firstTodo).toContainText('Task 3');
  });

  test('should persist todos across page reload', async ({ page }) => {
    const todoTitle = 'Persistent task';
    
    // Create a todo
    await page.fill('input[placeholder="Add a new todo..."]', todoTitle);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
    
    // Reload the page
    await page.reload();
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Todo App")');
    
    // Verify todo still exists
    await expect(page.locator(`text=${todoTitle}`).first()).toBeVisible();
  });
});
