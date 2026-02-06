/**
 * E2E tests for WebAuthn authentication
 */

import { test, expect } from '@playwright/test';

test.describe('WebAuthn Authentication', () => {
  test.beforeEach(async ({ page, context }) => {
    // Enable virtual authenticator for WebAuthn testing
    const client = await context.newCDPSession(page);
    await client.send('WebAuthn.enable');
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    });
  });

  test('user can register with WebAuthn', async ({ page }) => {
    await page.goto('/login');

    // Check that we're on the login page
    await expect(page.locator('h1')).toContainText('Todo App');

    // Fill in username
    await page.fill('input[name="username"]', 'testuser');

    // Click register button
    await page.click('button:has-text("Register")');

    // Wait for redirect to main app
    await expect(page).toHaveURL('/');

    // Verify we see the main app
    await expect(page.locator('text=Welcome to Todo App')).toBeVisible();

    // Verify logout button is present
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('session persists after page reload', async ({ page }) => {
    // Register first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'alice');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');

    // Reload page
    await page.reload();

    // Should still be on main app (not redirected to login)
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome to Todo App')).toBeVisible();
  });

  test('user can logout and login again', async ({ page }) => {
    // Register first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'bob');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');

    // Login again
    await page.fill('input[name="username"]', 'bob');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome to Todo App')).toBeVisible();
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Todo App');
  });

  test('duplicate username shows error', async ({ page }) => {
    // Register first user
    await page.goto('/login');
    await page.fill('input[name="username"]', 'duplicate');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');

    // Try to register same username again
    await page.fill('input[name="username"]', 'duplicate');
    await page.click('button:has-text("Register")');

    // Should show error message
    await expect(page.locator('text=Username already exists')).toBeVisible();
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('login with non-existent user shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'nonexistent');
    await page.click('button:has-text("Login")');

    // Should show error message
    await expect(page.locator('text=User not found')).toBeVisible();
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('username validation works', async ({ page }) => {
    await page.goto('/login');

    // Try username that's too short
    await page.fill('input[name="username"]', 'ab');
    await page.click('button:has-text("Register")');
    await expect(page.locator('text=Username must be 3-30 characters')).toBeVisible();

    // Try username with invalid characters
    await page.fill('input[name="username"]', 'user@name');
    await page.click('button:has-text("Register")');
    await expect(page.locator('text=Username can only contain letters, numbers, and underscores')).toBeVisible();
  });

  test('logged-in user redirected from login page', async ({ page }) => {
    // Register and get logged in
    await page.goto('/login');
    await page.fill('input[name="username"]', 'redirect_test');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');

    // Try to go to login page
    await page.goto('/login');

    // Should be redirected back to main app
    await expect(page).toHaveURL('/');
  });
});
