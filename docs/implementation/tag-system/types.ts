/**
 * Tag System - TypeScript Type Definitions
 * 
 * These types should be added to lib/db.ts in the actual Todo App
 */

// ============================================================================
// Core Tag Types
// ============================================================================

/**
 * Tag entity representing a color-coded label
 */
export interface Tag {
  id: number;
  user_id: number;
  name: string;              // Max 30 chars, unique per user
  color: string;             // Hex color #RRGGBB
  created_at: string;        // ISO 8601 datetime
}

/**
 * Junction table record (not typically exposed in API)
 */
export interface TodoTag {
  todo_id: number;
  tag_id: number;
}

// ============================================================================
// Extended Todo Interface
// ============================================================================

/**
 * Extended Todo interface with tags populated
 * Update existing Todo interface to include this optional field
 */
export interface Todo {
  // ... existing fields (id, user_id, title, description, etc.)
  tags?: Tag[];  // Populated via JOIN in todoDB.list() and getWithTags()
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Tag CRUD API types
export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface CreateTagResponse {
  tag: Tag;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface UpdateTagResponse {
  tag: Tag;
}

export interface ListTagsResponse {
  tags: Tag[];
}

// Tag Assignment API types
export interface AssignTagRequest {
  tag_id: number;
}

export interface AssignTagResponse {
  todo: Todo;  // Todo with updated tags array
}

export interface UnassignTagResponse {
  success: boolean;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Predefined color palette for tag colors
 */
export const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
] as const;

export type TagColorValue = typeof TAG_COLORS[number]['value'];

/**
 * Validation constants
 */
export const TAG_CONSTRAINTS = {
  MAX_NAME_LENGTH: 30,
  MIN_NAME_LENGTH: 1,
  COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/,
} as const;

// ============================================================================
// Database Layer Types
// ============================================================================

/**
 * Database operations interface for tags
 */
export interface TagDatabase {
  list(userId: number): Tag[];
  get(tagId: number, userId: number): Tag | undefined;
  create(userId: number, name: string, color: string): Tag;
  update(tagId: number, userId: number, name: string, color: string): void;
  delete(tagId: number, userId: number): void;
}

/**
 * Database operations interface for todo-tag relationships
 */
export interface TodoTagDatabase {
  assign(todoId: number, tagId: number): void;
  unassign(todoId: number, tagId: number): void;
  getTagsForTodo(todoId: number): Tag[];
  getTodosWithTag(tagId: number, userId: number): number[];
  copyTags(fromTodoId: number, toTodoId: number): void;
}

// ============================================================================
// React Component Props Types
// ============================================================================

/**
 * Props for TagPill component
 */
export interface TagPillProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
  className?: string;
  removable?: boolean;
}

/**
 * Props for TagSelector component
 */
export interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreateNew?: (name: string, color: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxTags?: number;
}

/**
 * Props for TagManager component (modal/sidebar)
 */
export interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  onUpdateTag: (tagId: number, name: string, color: string) => Promise<void>;
  onDeleteTag: (tagId: number) => Promise<void>;
}

/**
 * Props for TagColorPicker component
 */
export interface TagColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  colors?: readonly { name: string; value: string }[];
  allowCustom?: boolean;
}

// ============================================================================
// Client-Side State Types
// ============================================================================

/**
 * Tag filter state
 */
export interface TagFilter {
  tagId: number | null;
  tagName: string | null;
}

/**
 * Tag form state
 */
export interface TagFormState {
  name: string;
  color: string;
  errors: {
    name?: string;
    color?: string;
  };
}

/**
 * Tag manager modal state
 */
export interface TagManagerState {
  isOpen: boolean;
  editingTagId: number | null;
  formState: TagFormState;
}

// ============================================================================
// Validation Helper Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    color?: string;
  };
}

/**
 * Tag validation function type
 */
export type TagValidator = (name: string, color: string) => ValidationResult;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Tag with todo count (for statistics)
 */
export interface TagWithCount extends Tag {
  todo_count: number;
}

/**
 * Tag assignment change event
 */
export interface TagAssignmentChange {
  todoId: number;
  tagId: number;
  action: 'assign' | 'unassign';
}

// ============================================================================
// Template System Integration
// ============================================================================

/**
 * Extended Template interface to include tags
 * Add this field to existing Template interface
 */
export interface Template {
  // ... existing fields
  tag_ids?: number[];  // Array of tag IDs to apply when using template
}

/**
 * Template with resolved tag data
 */
export interface TemplateWithTags extends Omit<Template, 'tag_ids'> {
  tags: Tag[];
}

// ============================================================================
// Export/Import Types
// ============================================================================

/**
 * Tag export format
 */
export interface ExportedTag {
  name: string;
  color: string;
}

/**
 * Todo export format with tag names
 */
export interface ExportedTodo {
  // ... existing fields
  tag_names?: string[];  // Tag names (not IDs) for portability
}

/**
 * Import mapping for tags (old name -> new ID)
 */
export type TagImportMap = Map<string, number>;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Tag-specific error types
 */
export class TagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagValidationError';
  }
}

export class DuplicateTagError extends Error {
  constructor(tagName: string) {
    super(`Tag "${tagName}" already exists`);
    this.name = 'DuplicateTagError';
  }
}

export class TagNotFoundError extends Error {
  constructor(tagId: number) {
    super(`Tag with ID ${tagId} not found`);
    this.name = 'TagNotFoundError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return TAG_CONSTRAINTS.COLOR_REGEX.test(color);
}

/**
 * Check if a tag name is valid length
 */
export function isValidTagName(name: string): boolean {
  return (
    name.length >= TAG_CONSTRAINTS.MIN_NAME_LENGTH &&
    name.length <= TAG_CONSTRAINTS.MAX_NAME_LENGTH
  );
}

/**
 * Type guard for Tag object
 */
export function isTag(obj: any): obj is Tag {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.color === 'string' &&
    typeof obj.created_at === 'string' &&
    isValidHexColor(obj.color)
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate tag creation/update data
 */
export function validateTagData(name: string, color: string): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!isValidTagName(name)) {
    errors.name = `Tag name must be between ${TAG_CONSTRAINTS.MIN_NAME_LENGTH} and ${TAG_CONSTRAINTS.MAX_NAME_LENGTH} characters`;
  }

  if (!isValidHexColor(color)) {
    errors.color = 'Color must be a valid hex color (#RRGGBB)';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get contrasting text color for tag background
 */
export function getContrastColor(hexColor: string): '#FFFFFF' | '#000000' {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Sort tags alphabetically by name
 */
export function sortTags(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find tag by ID
 */
export function findTagById(tags: Tag[], tagId: number): Tag | undefined {
  return tags.find(tag => tag.id === tagId);
}

/**
 * Check if todo has specific tag
 */
export function todoHasTag(todo: Todo, tagId: number): boolean {
  return todo.tags?.some(tag => tag.id === tagId) ?? false;
}
