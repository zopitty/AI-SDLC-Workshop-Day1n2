# Template System Implementation Checklist

Quick reference checklist for implementing PRP 07: Template System feature.

📖 **Full Implementation Plan**: [IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md)  
📋 **PRP Document**: [PRPs/07-template-system.md](PRPs/07-template-system.md)

---

## Phase 1: Database Schema ⚙️

### 1.1 Templates Table
- [ ] Create `templates` table with all columns
- [ ] Add CHECK constraint on `name` length (1-50 chars)
- [ ] Add CHECK constraint on `priority` (high/medium/low)
- [ ] Add FOREIGN KEY to `users(id)` with CASCADE delete
- [ ] Add UNIQUE constraint on `(user_id, name)`
- [ ] Create index on `user_id`

### 1.2 Template-Tags Junction Table
- [ ] Create `template_tags` table
- [ ] Add composite PRIMARY KEY `(template_id, tag_id)`
- [ ] Add FOREIGN KEY to `templates(id)` with CASCADE delete
- [ ] Add FOREIGN KEY to `tags(id)` with CASCADE delete
- [ ] Create index on `template_id`
- [ ] Create index on `tag_id`

### 1.3 TypeScript Interfaces (`lib/db.ts`)
- [ ] Add `Template` interface
- [ ] Add `TemplateSubtask` interface (for JSON serialization)
- [ ] Export interfaces

### 1.4 Database CRUD Methods (`lib/db.ts`)
- [ ] Implement `templateDB.create()`
- [ ] Implement `templateDB.get()`
- [ ] Implement `templateDB.list()`
- [ ] Implement `templateDB.update()`
- [ ] Implement `templateDB.delete()`
- [ ] Implement `templateTagDB.assign()`
- [ ] Implement `templateTagDB.remove()`
- [ ] Implement `templateTagDB.getTags()`
- [ ] Implement `templateTagDB.clearAll()`

### 1.5 Database Testing
- [ ] Test template creation
- [ ] Test name uniqueness enforcement
- [ ] Test name length validation
- [ ] Test user isolation
- [ ] Test cascade delete on template deletion
- [ ] Test template-tag relationships

---

## Phase 2: API Endpoints 🌐

### 2.1 GET /api/templates (List)
**File**: `app/api/templates/route.ts`
- [ ] Create file
- [ ] Implement GET handler
- [ ] Check authentication
- [ ] Fetch templates for user
- [ ] Include tags for each template
- [ ] Return JSON response
- [ ] Test with authenticated user
- [ ] Test without authentication (should 401)

### 2.2 POST /api/templates (Create)
**File**: `app/api/templates/route.ts`
- [ ] Implement POST handler
- [ ] Validate name (required, max 50 chars)
- [ ] Validate title (required)
- [ ] Validate priority
- [ ] Serialize subtasks to JSON
- [ ] Create template
- [ ] Assign tags
- [ ] Handle unique constraint error (409)
- [ ] Test successful creation
- [ ] Test validation errors
- [ ] Test duplicate name error

### 2.3 GET /api/templates/[id] (Get Single)
**File**: `app/api/templates/[id]/route.ts`
- [ ] Create file
- [ ] Implement GET handler
- [ ] Await `params` (Next.js 16 pattern)
- [ ] Validate template ID
- [ ] Check user ownership
- [ ] Include tags in response
- [ ] Test successful retrieval
- [ ] Test not found (404)
- [ ] Test unauthorized access

### 2.4 PUT /api/templates/[id] (Update)
**File**: `app/api/templates/[id]/route.ts`
- [ ] Implement PUT handler
- [ ] Validate all fields
- [ ] Check template exists and belongs to user
- [ ] Update template data
- [ ] Clear old tags
- [ ] Assign new tags
- [ ] Handle unique constraint error
- [ ] Test successful update
- [ ] Test not found error
- [ ] Test validation errors

### 2.5 DELETE /api/templates/[id] (Delete)
**File**: `app/api/templates/[id]/route.ts`
- [ ] Implement DELETE handler
- [ ] Check template exists and belongs to user
- [ ] Delete template (cascade removes tags)
- [ ] Return success
- [ ] Test successful deletion
- [ ] Test not found error

### 2.6 POST /api/templates/[id]/use (Use Template)
**File**: `app/api/templates/[id]/use/route.ts`
- [ ] Create file
- [ ] Implement POST handler
- [ ] Get template
- [ ] Calculate due date from offset using Singapore timezone
- [ ] Create todo with template data
- [ ] Parse and create subtasks
- [ ] Assign tags
- [ ] Return created todo
- [ ] Test successful todo creation
- [ ] Test due date calculation
- [ ] Test subtasks creation
- [ ] Test tags assignment

### 2.7 API Testing
- [ ] Test all endpoints with Postman/curl
- [ ] Test authentication on all endpoints
- [ ] Test user isolation (can't access other users' data)
- [ ] Test error responses (400, 401, 404, 409, 500)
- [ ] Test with malformed JSON
- [ ] Test with missing required fields

---

## Phase 3: UI Components 🎨

### 3.1 State Management (`app/page.tsx`)
- [ ] Add `saveTemplateModalOpen` state
- [ ] Add `selectedTodoForTemplate` state
- [ ] Add `useTemplateModalOpen` state
- [ ] Add `templates` state
- [ ] Add `fetchTemplates()` function

### 3.2 Save as Template Button
- [ ] Add button to todo detail view
- [ ] Add `handleSaveAsTemplate()` handler
- [ ] Style button appropriately
- [ ] Test button click opens modal

### 3.3 SaveTemplateModal Component
- [ ] Create inline component in `app/page.tsx`
- [ ] Add template name input
- [ ] Add character counter (50 max)
- [ ] Add due date offset dropdown
- [ ] Add preview of what will be saved
- [ ] Add validation
- [ ] Add error display
- [ ] Add submit and cancel buttons
- [ ] Style for light/dark mode
- [ ] Test form validation
- [ ] Test form submission

### 3.4 Save Template Handler
- [ ] Implement `handleSaveTemplate()` function
- [ ] Serialize subtasks
- [ ] Collect tag IDs
- [ ] POST to /api/templates
- [ ] Handle errors
- [ ] Show success message
- [ ] Close modal on success
- [ ] Refresh templates list
- [ ] Test successful save
- [ ] Test error handling

### 3.5 Use Template Button
- [ ] Add button to header/toolbar
- [ ] Add click handler
- [ ] Fetch templates on open
- [ ] Open modal
- [ ] Style button
- [ ] Test button visibility
- [ ] Test modal opening

### 3.6 UseTemplateModal Component
- [ ] Create inline component
- [ ] Display templates list
- [ ] Show empty state
- [ ] Add close button
- [ ] Pass handlers to template cards
- [ ] Style for light/dark mode
- [ ] Test modal display
- [ ] Test empty state

### 3.7 TemplateCard Component
- [ ] Create inline component
- [ ] Display template name and title
- [ ] Display priority badge
- [ ] Display tags count
- [ ] Display subtasks count
- [ ] Display due date offset
- [ ] Add "Use" button
- [ ] Add edit button (placeholder)
- [ ] Add delete button
- [ ] Style for light/dark mode
- [ ] Test card rendering
- [ ] Test all buttons

### 3.8 Template Usage Handler
- [ ] Implement `handleUseTemplate()` function
- [ ] POST to /api/templates/[id]/use
- [ ] Close modal on success
- [ ] Refresh todos list
- [ ] Show success message
- [ ] Handle errors
- [ ] Test successful usage
- [ ] Test error handling

### 3.9 Template Delete Handler
- [ ] Implement `handleDeleteTemplate()` function
- [ ] Show confirmation dialog
- [ ] DELETE to /api/templates/[id]
- [ ] Refresh templates list
- [ ] Handle errors
- [ ] Test deletion
- [ ] Test confirmation

### 3.10 Render Modals
- [ ] Add SaveTemplateModal to component return
- [ ] Add UseTemplateModal to component return
- [ ] Add conditional rendering
- [ ] Test modal visibility

### 3.11 UI Testing
- [ ] Test all buttons are visible
- [ ] Test all modals open/close
- [ ] Test form validation
- [ ] Test dark mode styling
- [ ] Test responsive design (mobile)
- [ ] Test keyboard navigation
- [ ] Test screen reader accessibility

---

## Phase 4: End-to-End Testing 🧪

### 4.1 Test File Setup
**File**: `tests/07-template-system.spec.ts`
- [ ] Create test file
- [ ] Add imports
- [ ] Add test.describe block
- [ ] Add beforeEach with auth setup

### 4.2 Test: Save Todo as Template
- [ ] Create todo with subtasks and tags
- [ ] Click "Save as Template"
- [ ] Fill template modal
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify template appears in list

### 4.3 Test: Use Template
- [ ] Open "Use Template" modal
- [ ] Verify templates list
- [ ] Click "Use This Template"
- [ ] Verify todo created
- [ ] Verify subtasks created
- [ ] Verify tags assigned
- [ ] Verify priority set

### 4.4 Test: Template Name Uniqueness
- [ ] Create template
- [ ] Try to create another with same name
- [ ] Verify error message
- [ ] Verify duplicate not created

### 4.5 Test: Delete Template
- [ ] Open templates modal
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify template removed

### 4.6 Test: Due Date Offset Calculation
- [ ] Use template with offset
- [ ] Verify due date is correct (offset days from now)
- [ ] Check Singapore timezone is used

### 4.7 Test: Subtasks and Tags Preservation
- [ ] Create template with subtasks and tags
- [ ] Use template
- [ ] Verify all subtasks created
- [ ] Verify all tags assigned
- [ ] Verify order/position preserved

### 4.8 Run Tests
- [ ] Run individual test file: `npx playwright test tests/07-template-system.spec.ts`
- [ ] Run in UI mode: `npx playwright test --ui`
- [ ] Fix any failing tests
- [ ] Achieve 100% pass rate

---

## Phase 5: Documentation & Polish 📝

### 5.1 Code Documentation
- [ ] Add JSDoc comments to complex functions
- [ ] Document template JSON format
- [ ] Add inline comments for tricky logic

### 5.2 User Documentation
- [ ] Verify USER_GUIDE.md section 9 is accurate
- [ ] Add screenshots if needed
- [ ] Document all features

### 5.3 Error Handling
- [ ] User-friendly error messages
- [ ] Console logging for debugging
- [ ] Graceful fallbacks

### 5.4 Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels
- [ ] Focus management in modals
- [ ] ARIA attributes where needed

### 5.5 Performance
- [ ] JSON parsing is fast
- [ ] No unnecessary re-renders
- [ ] Optimized database queries

### 5.6 Security Review
- [ ] SQL injection prevention (prepared statements)
- [ ] User isolation enforced
- [ ] Input validation on all endpoints
- [ ] No XSS vulnerabilities in JSON display

---

## Final Verification ✅

### Functional Requirements
- [ ] Can save todo as template
- [ ] Can view list of templates
- [ ] Can use template to create todo
- [ ] Can delete template
- [ ] Template names are unique per user
- [ ] Due date offset works correctly
- [ ] Subtasks preserved
- [ ] Tags preserved
- [ ] Priority preserved

### Non-Functional Requirements
- [ ] Performance acceptable (< 10ms JSON parse)
- [ ] Accessibility standards met
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Error handling robust
- [ ] User data isolated

### Integration
- [ ] Works with existing todos
- [ ] Works with existing subtasks
- [ ] Works with existing tags
- [ ] Works with authentication
- [ ] Works with Singapore timezone

### Testing
- [ ] All unit tests pass (if applicable)
- [ ] All E2E tests pass
- [ ] Manual testing complete
- [ ] Edge cases tested

### Code Quality
- [ ] ESLint passes: `npm run lint`
- [ ] TypeScript compiles: `npm run build`
- [ ] No console errors in browser
- [ ] Code follows project patterns

---

## Deployment Checklist 🚀

- [ ] All tests passing
- [ ] Code review complete
- [ ] Database migration tested
- [ ] Documentation updated
- [ ] Screenshots/demo ready
- [ ] Commit and push changes
- [ ] Create pull request
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production

---

## Common Issues & Solutions 🔧

### Issue: "UNIQUE constraint failed"
**Solution**: Template name already exists. Show error to user and suggest different name.

### Issue: JSON parsing error
**Solution**: Validate subtasks_json format before parsing. Use try-catch and default to empty array.

### Issue: Due date calculation wrong
**Solution**: Ensure using `getSingaporeNow()` from `lib/timezone.ts`, not `new Date()`.

### Issue: Templates visible to wrong user
**Solution**: Always filter by `session.userId` in all database queries.

### Issue: Deleting template doesn't remove tags
**Solution**: CASCADE delete should handle this automatically. Check foreign key constraints.

---

## Resources 📚

- **Full Plan**: [IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md](IMPLEMENTATION_PLAN_TEMPLATE_SYSTEM.md)
- **PRP Document**: [PRPs/07-template-system.md](PRPs/07-template-system.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md) - Section 9
- **Architecture**: [PRPs/ARCHITECTURE.md](PRPs/ARCHITECTURE.md)

---

**Estimated Time**: 15-21 hours  
**Difficulty**: Medium  
**Dependencies**: PRPs 01, 05, 06, 11  
**Version**: 1.0  
**Last Updated**: 2026-02-06
