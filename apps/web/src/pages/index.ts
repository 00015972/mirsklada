/**
 * @file Pages Module Exports
 * @description Central export point for all page components.
 * Each page corresponds to a route in the application.
 *
 * @module apps/web/src/pages
 *
 * @exports
 * - Auth pages: LoginPage, SignupPage
 * - DashboardPage: Main analytics dashboard
 * - OnboardingPage: First-time workspace creation
 * - Business pages: Categories, Products, Clients, Orders, Stock, Payments, Settings
 * - LandingPage: Public marketing page
 *
 * @connections
 * - Used by: ./router.tsx (route definitions)
 */
export { LoginPage, SignupPage } from "./auth";
export { DashboardPage } from "./dashboard";
export { OnboardingPage } from "./onboarding";
export { CategoriesPage } from "./categories";
export { ProductsPage } from "./products";
export { ClientsPage } from "./clients";
export { OrdersPage } from "./orders";
export { StockPage } from "./stock";
export { PaymentsPage } from "./payments";
export { SettingsPage } from "./settings";
export { ReportsPage } from "./reports";
export { LandingPage } from "./landing";
