/**
 * @file Button Component
 * @description Reusable button component with multiple variants, sizes, and loading state.
 * Supports dark mode via Tailwind CSS classes.
 *
 * @module apps/web/src/components/ui/Button
 *
 * @connections
 * - Exported via: ./index.ts → ../index.ts
 * - Used by: All pages and forms that require buttons
 * - Dependencies: clsx (class merging), lucide-react (icons)
 *
 * @variants
 * - primary: Blue background, white text - main action buttons
 * - secondary: Gray background, dark text - secondary actions
 * - ghost: Transparent background - tertiary/subtle actions
 * - danger: Red background - destructive actions (delete, cancel)
 *
 * @sizes
 * - sm: Small padding and text - compact UIs
 * - md: Medium padding (default) - standard buttons
 * - lg: Large padding - prominent CTAs
 */
import { forwardRef, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

/**
 * Button Props Interface
 * @extends ButtonHTMLAttributes - Inherits all native button attributes
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Show loading spinner and disable button */
  isLoading?: boolean;
}

/**
 * Button Component
 * @description Accessible button with variant styling, loading state, and ref forwarding.
 *
 * @example
 * // Primary button (default)
 * <Button onClick={handleSubmit}>Save</Button>
 *
 * // Loading state
 * <Button isLoading disabled>Saving...</Button>
 *
 * // Danger variant
 * <Button variant="danger" onClick={handleDelete}>Delete</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    // Variant styles - each maps to different visual appearance
    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
      secondary:
        "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600 focus:ring-surface-400 dark:focus:ring-surface-500",
      ghost:
        "bg-transparent text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    // Size styles - control padding and text size
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          // Base styles - layout, typography, transitions
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          // Focus ring styles - accessibility
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-950",
          // Disabled state
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Applied variant and size
          variants[variant],
          sizes[size],
          // Custom classes from props
          className,
        )}
        {...props}
      >
        {/* Loading spinner - shows when isLoading is true */}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

/** Display name for React DevTools */
Button.displayName = "Button";
