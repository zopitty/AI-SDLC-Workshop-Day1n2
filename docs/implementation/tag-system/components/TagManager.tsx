/**
 * TagManager Component
 * 
 * Modal/sidebar for managing tags (CRUD operations)
 * 
 * Features:
 * - List all user's tags
 * - Create new tags
 * - Edit existing tags (inline or modal)
 * - Delete tags with confirmation
 * - Real-time validation
 * - Accessible (ARIA, focus trap, Escape to close)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { Tag } from '@/lib/db';
import { validateTagData, getContrastColor } from '@/lib/db';
import { TagColorPicker } from './TagColorPicker';

export interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  onUpdateTag: (tagId: number, name: string, color: string) => Promise<void>;
  onDeleteTag: (tagId: number) => Promise<void>;
}

interface TagFormData {
  name: string;
  color: string;
}

export function TagManager({
  isOpen,
  onClose,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagManagerProps) {
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TagFormData>({ name: '', color: '#3B82F6' });
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsCreating(false);
      setEditingTagId(null);
      setFormData({ name: '', color: '#3B82F6' });
      setErrors({});
      setDeleteConfirmId(null);
      
      // Focus first element
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isCreating || editingTagId) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isCreating, editingTagId, deleteConfirmId, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingTagId(null);
    setFormData({ name: '', color: '#3B82F6' });
    setErrors({});
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setIsCreating(false);
    setFormData({ name: tag.name, color: tag.color });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingTagId(null);
    setFormData({ name: '', color: '#3B82F6' });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateTagData(formData.name.trim(), formData.color);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (isCreating) {
        await onCreateTag(formData.name.trim(), formData.color);
      } else if (editingTagId) {
        await onUpdateTag(editingTagId, formData.name.trim(), formData.color);
      }
      
      handleCancelEdit();
    } catch (error: any) {
      // Handle duplicate tag error
      if (error.message?.includes('already exists')) {
        setErrors({ name: 'A tag with this name already exists' });
      } else {
        setErrors({ name: 'Failed to save tag. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: number) => {
    if (deleteConfirmId !== tagId) {
      setDeleteConfirmId(tagId);
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeleteTag(tagId);
      setDeleteConfirmId(null);
    } catch (error) {
      alert('Failed to delete tag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="tag-manager-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="
            relative w-full max-w-2xl
            bg-white rounded-lg shadow-xl
            transform transition-all
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="tag-manager-title" className="text-xl font-semibold text-gray-900">
              Manage Tags
            </h2>
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={onClose}
              className="
                text-gray-400 hover:text-gray-600
                focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                p-1
              "
              aria-label="Close tag manager"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Create button */}
            {!isCreating && !editingTagId && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="
                  w-full mb-4 px-4 py-3
                  border-2 border-dashed border-gray-300 rounded-lg
                  text-gray-600 hover:text-gray-900 hover:border-gray-400
                  transition-colors
                  font-medium
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                + Create New Tag
              </button>
            )}

            {/* Create/Edit form */}
            {(isCreating || editingTagId) && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">
                  {isCreating ? 'Create New Tag' : 'Edit Tag'}
                </h3>

                <div className="space-y-4">
                  {/* Name input */}
                  <div>
                    <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      id="tag-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      maxLength={30}
                      required
                      autoFocus
                      className={`
                        w-full px-3 py-2 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${errors.name ? 'border-red-500' : 'border-gray-300'}
                      `}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.name.length}/30 characters
                    </p>
                  </div>

                  {/* Color picker */}
                  <div>
                    <TagColorPicker
                      selectedColor={formData.color}
                      onChange={(color) => setFormData({ ...formData, color })}
                    />
                    {errors.color && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.color}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="
                        flex-1 px-4 py-2
                        bg-blue-600 text-white rounded-lg
                        hover:bg-blue-700 disabled:bg-gray-400
                        transition-colors
                        font-medium
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      "
                    >
                      {isSubmitting ? 'Saving...' : (isCreating ? 'Create Tag' : 'Update Tag')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="
                        px-4 py-2
                        bg-gray-200 text-gray-700 rounded-lg
                        hover:bg-gray-300 disabled:bg-gray-100
                        transition-colors
                        font-medium
                        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tags list */}
            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No tags yet. Create your first tag above!
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="
                      flex items-center gap-3 p-3
                      bg-white border border-gray-200 rounded-lg
                      hover:border-gray-300 transition-colors
                    "
                  >
                    {/* Tag preview */}
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium flex-shrink-0"
                      style={{
                        backgroundColor: tag.color,
                        color: getContrastColor(tag.color),
                      }}
                    >
                      {tag.name}
                    </span>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tag)}
                        disabled={isSubmitting}
                        className="
                          px-3 py-1 text-sm
                          text-blue-600 hover:text-blue-700
                          font-medium
                          focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                        "
                        aria-label={`Edit ${tag.name} tag`}
                      >
                        Edit
                      </button>

                      {deleteConfirmId === tag.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(tag.id)}
                            disabled={isSubmitting}
                            className="
                              px-3 py-1 text-sm
                              text-red-600 hover:text-red-700
                              font-medium
                              focus:outline-none focus:ring-2 focus:ring-red-500 rounded
                            "
                          >
                            {isSubmitting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={isSubmitting}
                            className="
                              px-3 py-1 text-sm
                              text-gray-600 hover:text-gray-700
                              font-medium
                              focus:outline-none focus:ring-2 focus:ring-gray-400 rounded
                            "
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(tag.id)}
                          disabled={isSubmitting}
                          className="
                            px-3 py-1 text-sm
                            text-red-600 hover:text-red-700
                            font-medium
                            focus:outline-none focus:ring-2 focus:ring-red-500 rounded
                          "
                          aria-label={`Delete ${tag.name} tag`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-sm text-gray-600">
              {tags.length} {tags.length === 1 ? 'tag' : 'tags'} total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example Usage
 * 
 * function TodoApp() {
 *   const [tags, setTags] = useState<Tag[]>([]);
 *   const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
 * 
 *   useEffect(() => {
 *     fetchTags();
 *   }, []);
 * 
 *   const fetchTags = async () => {
 *     const response = await fetch('/api/tags');
 *     const { tags } = await response.json();
 *     setTags(tags);
 *   };
 * 
 *   const handleCreateTag = async (name: string, color: string) => {
 *     const response = await fetch('/api/tags', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ name, color })
 *     });
 *     const { tag } = await response.json();
 *     setTags(prev => [...prev, tag]);
 *   };
 * 
 *   const handleUpdateTag = async (tagId: number, name: string, color: string) => {
 *     const response = await fetch(`/api/tags/${tagId}`, {
 *       method: 'PUT',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ name, color })
 *     });
 *     const { tag } = await response.json();
 *     setTags(prev => prev.map(t => t.id === tagId ? tag : t));
 *   };
 * 
 *   const handleDeleteTag = async (tagId: number) => {
 *     await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
 *     setTags(prev => prev.filter(t => t.id !== tagId));
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={() => setIsTagManagerOpen(true)}>
 *         Manage Tags
 *       </button>
 * 
 *       <TagManager
 *         isOpen={isTagManagerOpen}
 *         onClose={() => setIsTagManagerOpen(false)}
 *         tags={tags}
 *         onCreateTag={handleCreateTag}
 *         onUpdateTag={handleUpdateTag}
 *         onDeleteTag={handleDeleteTag}
 *       />
 *     </>
 *   );
 * }
 */

export default TagManager;
