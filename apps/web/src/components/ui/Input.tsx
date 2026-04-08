/**
 * @file Input Component
 * @description Form input component with label and error message support.
 * Supports dark mode and accessible form patterns.
 *
 * @module apps/web/src/components/ui/Input
 *
 * @connections
 * - Exported via: ./index.ts → ../index.ts
 * - Used by: All forms (login, signup, product creation, etc.)
 * - Dependencies: clsx (class merging)
 *
 * @accessibility
 * - Labels are associated with inputs via htmlFor/id
 * - Error messages use visual and color indicators
 * - Focus states are clearly visible
 */
import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

/**
 * Input Props Interface
 * @extends InputHTMLAttributes - Inherits all native input attributes
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
}

/**
 * Input Component
 * @description Accessible input with label and error handling.
 * Includes focus ring, dark mode support, and error state styling.
 *
 * @example
 * // Basic input with label
 * <Input name="email" label="Email" type="email" />
 *
 * // Input with error
 * <Input name="password" label="Password" error="Password is required" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    // Use provided id or fall back to name attribute for label association
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {/* Label - displayed above input if provided */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1.5"
          >
            {label}
          </label>
        )}
        {/* Input element */}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            // Base styles - sizing, colors, typography
            "w-full rounded-lg border bg-white dark:bg-surface-800 px-4 py-2.5 text-surface-900 dark:text-surface-100",
            // Placeholder styling
            "placeholder-surface-400 dark:placeholder-surface-500 transition-colors",
            // Focus styles
            "focus:outline-none focus:ring-1",
            // Conditional border color based on error state
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-surface-300 dark:border-surface-700 focus:border-primary-500 focus:ring-primary-500",
            // Custom classes from props
            className,
          )}
          {...props}
        />
        {/* Error message - displayed below input if error exists */}
        {error && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

/** Display name for React DevTools */
Input.displayName = "Input";
