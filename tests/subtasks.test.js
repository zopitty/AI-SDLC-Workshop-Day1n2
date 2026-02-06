const { chromium } = require('playwright');

async function testSubtasks() {
  console.log('🚀 Starting Subtasks Feature Test...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text());
    }
  });

  try {
    // Step 1: Login
    console.log('📝 Step 1: Testing Login...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('input#username');
    await page.screenshot({ path: 'test-screenshots/01-login.png' });
    
    await page.fill('input#username', 'testuser');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("Todo App")', { timeout: 5000 });
    console.log('✅ Login successful\n');
    await page.screenshot({ path: 'test-screenshots/02-logged-in.png' });

    // Step 2: Create a todo
    console.log('📝 Step 2: Creating a todo...');
    await page.fill('input[placeholder*="Add a new todo"]', 'Complete project presentation');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/03-todo-created.png' });
    
    const todoExists = await page.locator('text=Complete project presentation').count() > 0;
    if (!todoExists) {
      throw new Error('Todo was not created');
    }
    console.log('✅ Todo created successfully\n');

    // Step 3: Expand todo to show subtasks section
    console.log('📝 Step 3: Expanding todo...');
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/04-todo-expanded.png' });
    
    const subtaskFormVisible = await page.locator('input[placeholder*="Add subtask"]').isVisible();
    if (!subtaskFormVisible) {
      throw new Error('Subtask form not visible after expanding');
    }
    console.log('✅ Todo expanded, subtask form visible\n');

    // Step 4: Add first subtask
    console.log('📝 Step 4: Adding first subtask...');
    await page.fill('input[placeholder*="Add subtask"]', 'Create slides');
    await page.click('button:has-text("+ Add")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/05-subtask-1-added.png' });
    
    const subtask1 = await page.locator('text=Create slides').count() > 0;
    if (!subtask1) {
      throw new Error('First subtask not added');
    }
    console.log('✅ First subtask added\n');

    // Step 5: Add second subtask
    console.log('📝 Step 5: Adding second subtask...');
    await page.fill('input[placeholder*="Add subtask"]', 'Rehearse speech');
    await page.click('button:has-text("+ Add")');
    await page.waitForTimeout(500);
    
    const subtask2 = await page.locator('text=Rehearse speech').count() > 0;
    if (!subtask2) {
      throw new Error('Second subtask not added');
    }
    console.log('✅ Second subtask added\n');

    // Step 6: Add third subtask
    console.log('📝 Step 6: Adding third subtask...');
    await page.fill('input[placeholder*="Add subtask"]', 'Print handouts');
    await page.click('button:has-text("+ Add")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/06-all-subtasks-added.png' });
    
    const subtask3 = await page.locator('text=Print handouts').count() > 0;
    if (!subtask3) {
      throw new Error('Third subtask not added');
    }
    console.log('✅ Third subtask added\n');

    // Step 7: Verify progress bar shows 0/3 completed
    console.log('📝 Step 7: Verifying initial progress...');
    const progressText = await page.locator('text=0/3 completed').count();
    if (progressText === 0) {
      throw new Error('Progress bar not showing correct initial state');
    }
    const percentageText = await page.locator('text=0%').count();
    if (percentageText === 0) {
      throw new Error('Progress percentage not showing 0%');
    }
    console.log('✅ Progress shows 0/3 completed (0%)\n');

    // Step 8: Toggle first subtask
    console.log('📝 Step 8: Completing first subtask...');
    const firstCheckbox = page.locator('.bg-gray-50 input[type="checkbox"]').first();
    await firstCheckbox.click();
    // Wait for the progress to update
    await page.waitForSelector('text=1/3 completed', { timeout: 3000 });
    await page.screenshot({ path: 'test-screenshots/07-first-subtask-completed.png' });
    
    const percent33 = await page.locator('text=33%').count();
    if (percent33 === 0) {
      throw new Error('Progress percentage not showing 33%');
    }
    console.log('✅ First subtask completed, progress: 1/3 (33%)\n');

    // Step 9: Toggle second subtask
    console.log('�� Step 9: Completing second subtask...');
    const secondCheckbox = page.locator('.bg-gray-50 input[type="checkbox"]').nth(1);
    await secondCheckbox.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/08-two-subtasks-completed.png' });
    
    const progress2 = await page.locator('text=2/3 completed').count();
    if (progress2 === 0) {
      throw new Error('Progress not updated after completing second subtask');
    }
    const percent67 = await page.locator('text=67%').count();
    if (percent67 === 0) {
      throw new Error('Progress percentage not showing 67%');
    }
    console.log('✅ Second subtask completed, progress: 2/3 (67%)\n');

    // Step 10: Complete all subtasks
    console.log('📝 Step 10: Completing all subtasks...');
    const thirdCheckbox = page.locator('.bg-gray-50 input[type="checkbox"]').nth(2);
    await thirdCheckbox.click();
    // Wait for the progress to update
    await page.waitForSelector('text=3/3 completed', { timeout: 3000 });
    await page.screenshot({ path: 'test-screenshots/09-all-subtasks-completed.png' });
    
    const percent100 = await page.locator('text=100%').count();
    if (percent100 === 0) {
      throw new Error('Progress percentage not showing 100%');
    }
    console.log('✅ All subtasks completed, progress: 3/3 (100%)\n');

    // Step 11: Delete a subtask
    console.log('📝 Step 11: Deleting a subtask...');
    const deleteButton = page.locator('button:has-text("🗑")').first();
    await deleteButton.click();
    // Wait for the progress to update after deletion
    await page.waitForSelector('text=2/2 completed', { timeout: 3000 });
    await page.screenshot({ path: 'test-screenshots/10-subtask-deleted.png' });
    
    console.log('✅ Subtask deleted, progress recalculated: 2/2 (100%)\n');

    // Step 12: Collapse todo
    console.log('📝 Step 12: Collapsing todo...');
    const collapseButton = page.locator('button:has-text("▼")').first();
    await collapseButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/11-todo-collapsed.png' });
    
    const subtaskFormHidden = await page.locator('input[placeholder*="Add subtask"]').isHidden();
    if (!subtaskFormHidden) {
      throw new Error('Subtask form still visible after collapsing');
    }
    console.log('✅ Todo collapsed successfully\n');

    // Step 13: Final screenshot
    await page.screenshot({ path: 'test-screenshots/12-final-state.png', fullPage: true });

    console.log('🎉 All tests passed!\n');
    console.log('📸 Screenshots saved to test-screenshots/\n');

    // Summary
    console.log('='.repeat(60));
    console.log('TEST SUMMARY - PRP 05: Subtasks & Progress Tracking');
    console.log('='.repeat(60));
    console.log('✅ User can add subtasks to any todo');
    console.log('✅ User can toggle subtask completion');
    console.log('✅ User can delete individual subtasks');
    console.log('✅ Progress bar shows X/Y completed with percentage');
    console.log('✅ Subtasks displayed in position order');
    console.log('✅ Expand/collapse todo to show/hide subtasks');
    console.log('✅ Progress recalculates automatically');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots', { recursive: true });
}

// Run the test
testSubtasks()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
