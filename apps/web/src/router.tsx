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
} from "@/pages";

const routes: RouteObject[] = [
  // Public Routes
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
    path: "/",
    element: (
      <ProtectedRoute requireTenant={true}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
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
      // Placeholder routes - will be implemented later
      {
        path: "payments",
        element: <PlaceholderPage title="Payments" />,
      },
      {
        path: "reports",
        element: <PlaceholderPage title="Reports" />,
      },
      {
        path: "settings",
        element: <PlaceholderPage title="Settings" />,
      },
    ],
  },

  // Catch all
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter(routes);

// Placeholder component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold text-surface-100 mb-2">{title}</h1>
      <p className="text-surface-400">This page is coming soon</p>
    </div>
  );
}
