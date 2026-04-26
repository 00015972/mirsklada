/**
 * @file Application Layout Component
 * @description Main layout wrapper for authenticated pages with sidebar navigation,
 * workspace selector, user menu, and theme/language controls.
 *
 * @module apps/web/src/layouts/AppLayout
 *
 * @connections
 * - Exported via: ./index.ts
 * - Uses: @/stores (useAuthStore, useThemeStore)
 * - Uses: @/components/ui (LanguageSwitcher)
 * - Uses: react-router-dom (Outlet, NavLink, useNavigate)
 * - Uses: react-i18next (translations)
 * - Uses: @headlessui/react (Listbox for workspace selector)
 * - Used by: @/router.tsx (wraps all /dashboard routes)
 *
 * @features
 * - Responsive sidebar (drawer on mobile, fixed on desktop)
 * - Workspace/tenant selector for multi-tenant support
 * - Navigation links with active state highlighting
 * - User profile display with logout
 * - Language switcher and dark/light theme toggle
 * - New workspace invitation notifications
 *
 * @layout
 * - Sidebar: 256px wide, fixed on desktop, drawer on mobile
 * - Header: Sticky top bar with workspace info and controls
 * - Main: Scrollable content area with <Outlet /> for child routes
 */
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Warehouse,
  Building2,
  Bell,
  ChevronDown,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore, useThemeStore } from "@/stores";
import { clsx } from "clsx";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { LanguageSwitcher } from "@/components/ui";

/**
 * Navigation Items Configuration
 * @description Defines sidebar navigation links with translation keys, routes, and icons.
 * Each item maps to a protected route under /dashboard.
 */
const navigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "categories", href: "/dashboard/categories", icon: FolderTree },
  { key: "products", href: "/dashboard/products", icon: Package },
  { key: "stock", href: "/dashboard/stock", icon: Warehouse },
  { key: "clients", href: "/dashboard/clients", icon: Users },
  { key: "orders", href: "/dashboard/orders", icon: ShoppingCart },
  { key: "payments", href: "/dashboard/payments", icon: CreditCard },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3 },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
] as const;

/**
 * AppLayout Component
 * @description Main application shell for authenticated users.
 * Provides navigation, workspace selection, and user controls.
 */
export function AppLayout() {
  const { t } = useTranslation();
  // Mobile sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Notification for new workspace invitations
  const [newWorkspaceNotification, setNewWorkspaceNotification] = useState<
    string | null
  >(null);
  // Auth state
  const { user, tenants, currentTenantId, setTenant, logout } = useAuthStore();
  // Theme state
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  // Find current tenant object from ID
  const currentTenant = tenants.find((tenant) => tenant.id === currentTenantId);
  const navigationItems = navigation;

  /**
   * Workspace Invitation Detection Effect
   * @description Checks for new workspaces the user was invited to.
   * Compares current tenants against localStorage record to detect new invitations.
   */
  useEffect(() => {
    if (!user?.id || tenants.length === 0) return;

    const storageKey = `mirsklada_workspaces_${user.id}`;
    const knownWorkspaces = JSON.parse(
      localStorage.getItem(storageKey) || "[]",
    ) as string[];

    // Find workspaces not previously known
    const newWorkspaces = tenants.filter(
      (t) => !knownWorkspaces.includes(t.id),
    );

    if (newWorkspaces.length > 0 && knownWorkspaces.length > 0) {
      // User has been invited to new workspace(s) - show notification
      const newest = newWorkspaces[newWorkspaces.length - 1];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewWorkspaceNotification(
        t("nav.newWorkspaceInvite", { name: newest.name }),
      );

      // Auto-dismiss notification after 10 seconds
      setTimeout(() => setNewWorkspaceNotification(null), 10000);
    }

    // Update known workspaces list in localStorage
    localStorage.setItem(
      storageKey,
      JSON.stringify(tenants.map((tenant) => tenant.id)),
    );
  }, [user?.id, tenants, t]);

  /**
   * Handle Logout
   * @description Clears auth state and redirects to login page.
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* ========== MOBILE SIDEBAR OVERLAY ========== */}
      {/* Dark overlay behind sidebar on mobile, closes sidebar on click */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo and brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="font-semibold text-surface-900 dark:text-surface-100">
              Mirsklada
            </span>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            title={t("nav.closeSidebar")}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-surface-400 hover:text-surface-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========== WORKSPACE SELECTOR ========== */}
        {/* HeadlessUI Listbox for switching between workspaces/tenants */}
        {tenants.length > 0 && (
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <label className="text-xs text-surface-500 mb-1 block">
              {t("nav.workspace")}{" "}
              {tenants.length > 1 && (
                <span className="text-primary-500 dark:text-primary-400">
                  ({t("nav.workspaces", { count: tenants.length })})
                </span>
              )}
            </label>
            <Listbox
              value={currentTenantId || ""}
              onChange={(val) => setTenant(val)}
            >
              <div className="relative">
                <ListboxButton className="w-full flex items-center justify-between bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:border-primary-500">
                  <span className="truncate">
                    {currentTenant?.name || t("nav.selectWorkspace")}
                  </span>
                  <ChevronDown className="h-4 w-4 text-surface-500 flex-shrink-0" />
                </ListboxButton>
                <ListboxOptions className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 py-1 shadow-xl focus:outline-none">
                  {tenants.map((tenant) => (
                    <ListboxOption
                      key={tenant.id}
                      value={tenant.id}
                      className={({ focus }) =>
                        clsx(
                          "relative cursor-pointer select-none px-3 py-2 text-sm",
                          focus
                            ? "bg-primary-600/20 text-primary-600 dark:text-primary-300"
                            : "text-surface-700 dark:text-surface-200",
                        )
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between">
                          <span
                            className={clsx(
                              "truncate",
                              selected &&
                                "font-medium text-primary-600 dark:text-primary-400",
                            )}
                          >
                            {tenant.name}
                          </span>
                          {selected && (
                            <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </div>
        )}

        {/* ========== NAVIGATION LINKS ========== */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        {/* ========== USER MENU ========== */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800">
          {/* User avatar and info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
              <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {user?.name || t("nav.user")}
              </p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.signOut")}
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT AREA ========== */}
      <div className="lg:pl-64">
        {/* ========== TOP HEADER ========== */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-950/80 backdrop-blur-sm border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between h-full px-4">
            {/* Mobile menu button */}
            <button
              type="button"
              title={t("nav.openSidebar")}
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Current workspace indicator (desktop only) */}
            {currentTenant && (
              <div className="hidden lg:flex items-center gap-2 text-surface-500 dark:text-surface-400">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{currentTenant.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500">
                  {currentTenant.subscriptionTier}
                </span>
              </div>
            )}

            <div className="flex-1" />

            {/* Language & Theme Controls */}
            <div className="flex items-center gap-2 mr-2">
              <LanguageSwitcher variant="compact" />
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                title={t("common.theme")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Notification for new workspace invitation */}
            {newWorkspaceNotification && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 border border-primary-500/30 rounded-lg mr-4 animate-pulse">
                <Bell className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                <span className="text-sm text-primary-600 dark:text-primary-300">
                  {newWorkspaceNotification}
                </span>
                <button
                  type="button"
                  title={t("nav.dismiss")}
                  onClick={() => setNewWorkspaceNotification(null)}
                  className="ml-2 p-0.5 hover:bg-primary-500/20 rounded"
                >
                  <X className="h-3 w-3 text-primary-500 dark:text-primary-400" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ========== PAGE CONTENT ========== */}
        {/* React Router Outlet renders child route components here */}
        <main className="p-4 lg:p-6 min-h-screen bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
