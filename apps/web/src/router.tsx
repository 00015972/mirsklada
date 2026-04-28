/**
 * @file Application Router Configuration
 * @description Defines all routes for the Mirsklada web application using React Router.
 * Routes are organized into three categories:
 * 1. Public routes (landing, login, signup)
 * 2. Auth-required routes without tenant (onboarding)
 * 3. Protected routes with auth + tenant (dashboard and all business pages)
 *
 * @module apps/web/src/router
 *
 * @connections
 * - Uses: @/layouts/AppLayout (main dashboard layout with sidebar)
 * - Uses: @/components/ProtectedRoute (auth/tenant guard)
 * - Uses: @/pages/* (all page components)
 * - Used by: ./main.tsx (RouterProvider)
 *
 * @route_structure
 * - / → LandingPage (public marketing page)
 * - /login → LoginPage (public auth)
 * - /signup → SignupPage (public auth)
 * - /onboarding → OnboardingPage (auth required, creates first workspace)
 * - /dashboard/* → Protected business pages (auth + tenant required)
 *
 * @protection_rules
 * - ProtectedRoute handles auth checks and redirects
 * - requireTenant=true redirects to /onboarding if no workspace
 * - requireTenant=false allows access without workspace selection
 */
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { AppLayout } from "@/layouts";
import { ProtectedRoute } from "@/components";
import {
  LoginPage,
  SignupPage,
  ConfirmPage,
  DashboardPage,
  OnboardingPage,
  CategoriesPage,
  ProductsPage,
  ClientsPage,
  OrdersPage,
  StockPage,
  PaymentsPage,
  SettingsPage,
  ReportsPage,
  LandingPage,
} from "@/pages";

/**
 * Route Configuration Array
 * @description Defines all application routes with their components and guards.
 */
const routes: RouteObject[] = [
  // ═══════════════════════════════════════════════════════════════════
  // Public Routes (no authentication required)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Landing Page
   * @description Public marketing/home page for the application.
   * Accessible to all users regardless of auth state.
   */
  {
    path: "/",
    element: <LandingPage />,
  },

  // ═══════════════════════════════════════════════════════════════════
  // Authentication Routes (public, redirect to dashboard if logged in)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Login Page
   * @description User sign-in form with email/password authentication.
   * After successful login, redirects to /dashboard or /onboarding.
   */
  {
    path: "/login",
    element: <LoginPage />,
  },

  /**
   * Signup Page
   * @description New user registration form.
   * After signup, may require email confirmation before proceeding.
   */
  {
    path: "/signup",
    element: <SignupPage />,
  },

  {
    path: "/auth/confirm",
    element: <ConfirmPage />,
  },

  // ═══════════════════════════════════════════════════════════════════
  // Onboarding Route (auth required, no tenant required)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Onboarding Page
   * @description First-time workspace creation for new users.
   * Protected: Requires authentication but NOT tenant selection.
   * Users are redirected here if they have no workspaces.
   */
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute requireTenant={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // ═══════════════════════════════════════════════════════════════════
  // Protected Dashboard Routes (auth + tenant required)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Dashboard Routes
   * @description All protected business functionality pages.
   * Wrapped in ProtectedRoute with requireTenant=true.
   * Uses AppLayout for consistent sidebar navigation.
   *
   * @children
   * - /dashboard → Main dashboard with analytics
   * - /dashboard/categories → Product category management
   * - /dashboard/products → Product catalog management
   * - /dashboard/clients → Client/customer management
   * - /dashboard/orders → Sales order management
   * - /dashboard/stock → Inventory/stock management
   * - /dashboard/payments → Payment recording and debt tracking
   * - /dashboard/settings → Workspace settings
   * - /dashboard/reports → Analytics reports (placeholder)
   */
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requireTenant={true}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      /**
       * Dashboard Home (index route)
       * @description Main analytics dashboard with KPIs, charts, and summaries
       */
      {
        index: true,
        element: <DashboardPage />,
      },

      /**
       * Categories Management
       * @description CRUD operations for product categories
       */
      {
        path: "categories",
        element: <CategoriesPage />,
      },

      /**
       * Products Management
       * @description CRUD operations for products with weight tracking
       */
      {
        path: "products",
        element: <ProductsPage />,
      },

      /**
       * Clients Management
       * @description CRUD operations for business clients with debt tracking
       */
      {
        path: "clients",
        element: <ClientsPage />,
      },

      /**
       * Orders Management
       * @description Order lifecycle: draft → confirmed → completed/cancelled
       */
      {
        path: "orders",
        element: <OrdersPage />,
      },

      /**
       * Stock/Inventory Management
       * @description Track product stock levels and adjustments
       */
      {
        path: "stock",
        element: <StockPage />,
      },

      /**
       * Payments Management
       * @description Record payments and manage client debt
       */
      {
        path: "payments",
        element: <PaymentsPage />,
      },

      /**
       * Workspace Settings
       * @description Configure workspace name, users, and preferences
       */
      {
        path: "settings",
        element: <SettingsPage />,
      },

      /**
       * Reports Page
       * @description Analytics and exportable business reports
       */
      {
        path: "reports",
        element: <ReportsPage />,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Catch-All Route
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 404 Catch-All
   * @description Redirects any unmatched routes to the landing page.
   * Uses `replace` to prevent back button issues.
   */
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

/**
 * Browser Router Instance
 * @description Creates the React Router instance for the application.
 * Uses createBrowserRouter for modern data router features.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter(routes);
