/**
 * @file UI Components Module Exports
 * @description Central export point for all UI primitive components.
 * These are reusable building blocks used throughout the application.
 *
 * @module apps/web/src/components/ui
 *
 * @exports
 * - Button: Primary action buttons with variants
 * - Input: Form input fields with labels and errors
 * - Card, CardHeader, CardTitle, CardContent: Container components
 * - SearchableSelect: Dropdown with search functionality
 * - SelectOption: Type for select options
 * - LanguageSwitcher: i18n language selector
 *
 * @design_system
 * - All components support dark mode via Tailwind CSS
 * - Colors use the 'surface-*' and 'primary-*' palettes
 * - Consistent spacing and border radius
 */
export { Button } from "./Button";
export { Input } from "./Input";
export { Card, CardHeader, CardTitle, CardContent } from "./Card";
export { SearchableSelect } from "./SearchableSelect";
export type { SelectOption } from "./SearchableSelect";
export { LanguageSwitcher } from "./LanguageSwitcher";
