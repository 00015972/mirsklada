/**
 * Application Router Configuration
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
  DashboardPage,
  OnboardingPage,
  CategoriesPage,
  ProductsPage,
  ClientsPage,
  OrdersPage,
  StockPage,
  PaymentsPage,
  SettingsPage,
  LandingPage,
} from "@/pages";

const routes: RouteObject[] = [
  // Public Landing Page
  {
    path: "/",
    element: <LandingPage />,
  },

  // Auth Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },

  // Onboarding (auth required, but no tenant required)
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute requireTenant={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // Protected Routes (require auth + tenant)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requireTenant={true}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "clients",
        element: <ClientsPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "stock",
        element: <StockPage />,
      },
      {
        path: "payments",
        element: <PaymentsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "reports",
        element: <PlaceholderPage title="Reports" />,
      },
    ],
  },

  // Catch all
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter(routes);

// Placeholder component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h1>
      <p className="text-surface-500 dark:text-surface-400">
        This page is coming soon
      </p>
    </div>
  );
}
