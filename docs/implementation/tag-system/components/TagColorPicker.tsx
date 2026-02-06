/**
 * TagColorPicker Component
 * 
 * Color selection UI for tag creation/editing
 * 
 * Features:
 * - Predefined color palette
 * - Optional custom hex color input
 * - Visual selection indicator
 * - Keyboard navigation
 * - Accessible (ARIA, focus management)
 */

'use client';

import { useState } from 'react';
import { TAG_COLORS, isValidHexColor } from '@/lib/db';
import type { TagColorValue } from '@/lib/db';

export interface TagColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  colors?: readonly { name: string; value: string }[];
  allowCustom?: boolean;
}

export function TagColorPicker({
  selectedColor,
  onChange,
  colors = TAG_COLORS,
  allowCustom = true,
}: TagColorPickerProps) {
  const [customColor, setCustomColor] = useState(selectedColor);
  const [customColorError, setCustomColorError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePaletteColorClick = (color: string) => {
    onChange(color);
    setShowCustomInput(false);
    setCustomColorError(null);
  };

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value.toUpperCase());
    
    // Validate and update
    if (isValidHexColor(value)) {
      onChange(value.toUpperCase());
      setCustomColorError(null);
    } else {
      setCustomColorError('Invalid hex color format');
    }
  };

  const handleCustomColorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidHexColor(customColor)) {
      onChange(customColor);
      setShowCustomInput(false);
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomColorError(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Predefined color palette */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose a color
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePaletteColorClick(color.value)}
              className={`
                relative w-10 h-10 rounded-lg
                border-2 transition-all
                hover:scale-110 hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${selectedColor === color.value 
                  ? 'border-gray-900 shadow-lg scale-105' 
                  : 'border-gray-300'
                }
              `}
              style={{ backgroundColor: color.value }}
              aria-label={`${color.name} (${color.value})`}
              title={color.name}
            >
              {/* Checkmark for selected color */}
              {selectedColor === color.value && (
                <svg
                  className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom color input */}
      {allowCustom && (
        <div>
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="
                text-sm text-blue-600 hover:text-blue-700
                font-medium underline
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded
              "
            >
              + Use custom color
            </button>
          ) : (
            <div className="space-y-2">
              <label 
                htmlFor="custom-color-input"
                className="block text-sm font-medium text-gray-700"
              >
                Custom hex color
              </label>
              <div className="flex items-center gap-2">
                {/* Color preview */}
                <div
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 flex-shrink-0"
                  style={{ 
                    backgroundColor: isValidHexColor(customColor) ? customColor : '#FFFFFF'
                  }}
                  aria-hidden="true"
                />
                
                {/* Hex input */}
                <input
                  id="custom-color-input"
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  onKeyDown={handleCustomColorKeyDown}
                  placeholder="#3B82F6"
                  maxLength={7}
                  className={`
                    flex-1 px-3 py-2
                    border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    font-mono text-sm
                    ${customColorError ? 'border-red-500' : 'border-gray-300'}
                  `}
                  aria-invalid={!!customColorError}
                  aria-describedby={customColorError ? 'custom-color-error' : undefined}
                />

                {/* Apply/Cancel buttons */}
                <button
                  type="button"
                  onClick={() => {
                    if (isValidHexColor(customColor)) {
                      onChange(customColor);
                      setShowCustomInput(false);
                    }
                  }}
                  disabled={!isValidHexColor(customColor)}
                  className="
                    px-3 py-2 bg-blue-600 text-white rounded-lg
                    hover:bg-blue-700 disabled:bg-gray-300
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  "
                  aria-label="Apply custom color"
                >
                  ✓
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomColorError(null);
                  }}
                  className="
                    px-3 py-2 bg-gray-200 text-gray-700 rounded-lg
                    hover:bg-gray-300
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                  "
                  aria-label="Cancel custom color"
                >
                  ✕
                </button>
              </div>
              
              {/* Error message */}
              {customColorError && (
                <p 
                  id="custom-color-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {customColorError}. Format: #RRGGBB (e.g., #3B82F6)
                </p>
              )}
              
              {/* Helper text */}
              <p className="text-xs text-gray-500">
                Enter a 6-digit hex color code (e.g., #3B82F6)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected color display */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Selected:</span>
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: selectedColor }}
            aria-hidden="true"
          />
          <span className="font-mono text-gray-900">{selectedColor}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Example Usage
 * 
 * // Basic usage
 * <TagColorPicker
 *   selectedColor={color}
 *   onChange={setColor}
 * />
 * 
 * // Preset palette only (no custom colors)
 * <TagColorPicker
 *   selectedColor={color}
 *   onChange={setColor}
 *   allowCustom={false}
 * />
 * 
 * // Custom color palette
 * const BRAND_COLORS = [
 *   { name: 'Primary', value: '#FF6B6B' },
 *   { name: 'Secondary', value: '#4ECDC4' },
 *   { name: 'Accent', value: '#FFE66D' },
 * ];
 * 
 * <TagColorPicker
 *   selectedColor={color}
 *   onChange={setColor}
 *   colors={BRAND_COLORS}
 * />
 */

/**
 * Integration Example (Tag Form)
 * 
 * function TagForm({ tag, onSave }: { tag?: Tag; onSave: (tag: Tag) => void }) {
 *   const [name, setName] = useState(tag?.name || '');
 *   const [color, setColor] = useState(tag?.color || '#3B82F6');
 * 
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     
 *     const endpoint = tag ? `/api/tags/${tag.id}` : '/api/tags';
 *     const method = tag ? 'PUT' : 'POST';
 * 
 *     const response = await fetch(endpoint, {
 *       method,
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ name, color })
 *     });
 * 
 *     const { tag: savedTag } = await response.json();
 *     onSave(savedTag);
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit} className="space-y-4">
 *       <div>
 *         <label className="block mb-2 font-medium">Tag Name</label>
 *         <input
 *           type="text"
 *           value={name}
 *           onChange={(e) => setName(e.target.value)}
 *           maxLength={30}
 *           required
 *           className="w-full px-4 py-2 border rounded-lg"
 *         />
 *       </div>
 * 
 *       <div>
 *         <label className="block mb-2 font-medium">Color</label>
 *         <TagColorPicker
 *           selectedColor={color}
 *           onChange={setColor}
 *         />
 *       </div>
 * 
 *       <button type="submit" className="btn-primary">
 *         {tag ? 'Update Tag' : 'Create Tag'}
 *       </button>
 *     </form>
 *   );
 * }
 */

/**
 * Accessibility Features
 * 
 * 1. ARIA Labels:
 *    - Color name and hex value in aria-label
 *    - aria-invalid for error states
 *    - aria-describedby for error messages
 * 
 * 2. Keyboard Navigation:
 *    - Tab through color buttons
 *    - Enter to apply custom color
 *    - Escape to cancel
 * 
 * 3. Visual Feedback:
 *    - Checkmark on selected color
 *    - Focus rings on all interactive elements
 *    - Scale animation on hover
 *    - Real-time color preview
 * 
 * 4. Error Handling:
 *    - Inline validation for hex colors
 *    - Role="alert" for error messages
 *    - Disabled state for invalid input
 */

/**
 * Validation
 * 
 * The component uses isValidHexColor() from types.ts:
 * - Must start with #
 * - Followed by exactly 6 hex digits (0-9, A-F)
 * - Case-insensitive input, auto-uppercase
 * 
 * Valid examples:
 * - #3B82F6
 * - #FFFFFF
 * - #000000
 * - #ff6b6b (converted to #FF6B6B)
 * 
 * Invalid examples:
 * - 3B82F6 (missing #)
 * - #3B8 (too short)
 * - #3B82F6AA (too long)
 * - #GGGGGG (invalid characters)
 */

export default TagColorPicker;
