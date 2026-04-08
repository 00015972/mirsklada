/**
 * @file Card Component
 * @description Composable card component with header, title, and content subcomponents.
 * Supports dark mode via Tailwind CSS classes.
 *
 * @module apps/web/src/components/ui/Card
 *
 * @connections
 * - Exported via: ./index.ts → ../index.ts
 * - Used by: Dashboard pages, data display sections, form containers
 * - Dependencies: clsx (class merging)
 *
 * @composition
 * Use Card with its subcomponents for structured content:
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Section Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     Your content here
 *   </CardContent>
 * </Card>
 * ```
 */
import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

/** Card props - inherits all div attributes */
type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * Card Component
 * @description Container with rounded corners, border, and padding.
 * Theme-aware with light/dark background colors.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          // Rounded corners, border, padding
          "rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * CardHeader Component
 * @description Header section of a card with bottom margin.
 * Typically contains CardTitle or other header content.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("mb-4", className)} {...props}>
        {children}
      </div>
    );
  },
);

CardHeader.displayName = "CardHeader";

/**
 * CardTitle Component
 * @description Title element for card headers.
 * Renders as h3 with semibold styling.
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={clsx(
        "text-lg font-semibold text-surface-900 dark:text-surface-100",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

/**
 * CardContent Component
 * @description Main content area of a card.
 * Minimal styling to allow flexible content.
 */
export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("", className)} {...props}>
        {children}
      </div>
    );
  },
);

CardContent.displayName = "CardContent";
