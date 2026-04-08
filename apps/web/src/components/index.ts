/**
 * @file Components Module Exports
 * @description Central export point for all shared React components.
 *
 * @module apps/web/src/components
 *
 * @exports
 * - UI components (Button, Input, Card, etc.) from ./ui
 * - ProtectedRoute: Auth/tenant guard component
 *
 * @connections
 * - Used by: All page components
 * - Used by: ./router.tsx (ProtectedRoute)
 */
export * from "./ui";
export { ProtectedRoute } from "./ProtectedRoute";
