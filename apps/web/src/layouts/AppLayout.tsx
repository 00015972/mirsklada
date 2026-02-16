/**
 * Main App Layout with Sidebar
 */
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
  ChevronDown,
  Warehouse,
  Building2,
  Bell,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { clsx } from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Products", href: "/products", icon: Package },
  { name: "Stock", href: "/stock", icon: Warehouse },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newWorkspaceNotification, setNewWorkspaceNotification] = useState<
    string | null
  >(null);
  const { user, tenants, currentTenantId, setTenant, logout } = useAuthStore();
  const navigate = useNavigate();
  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  // Check for new workspace invitations
  useEffect(() => {
    if (!user?.id || tenants.length === 0) return;

    const storageKey = `mirsklada_workspaces_${user.id}`;
    const knownWorkspaces = JSON.parse(
      localStorage.getItem(storageKey) || "[]",
    ) as string[];

    // Find new workspaces
    const newWorkspaces = tenants.filter(
      (t) => !knownWorkspaces.includes(t.id),
    );

    if (newWorkspaces.length > 0 && knownWorkspaces.length > 0) {
      // User has been invited to new workspace(s)
      const newest = newWorkspaces[newWorkspaces.length - 1];
      setNewWorkspaceNotification(`You've been invited to "${newest.name}"`);

      // Auto-dismiss after 10 seconds
      setTimeout(() => setNewWorkspaceNotification(null), 10000);
    }

    // Update known workspaces
    localStorage.setItem(storageKey, JSON.stringify(tenants.map((t) => t.id)));
  }, [user?.id, tenants]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-64 bg-surface-900 border-r border-surface-800 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="font-semibold text-surface-100">Mirsklada</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-surface-400 hover:text-surface-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant Selector */}
        {tenants.length > 0 && (
          <div className="p-4 border-b border-surface-800">
            <label className="text-xs text-surface-500 mb-1 block">
              Workspace{" "}
              {tenants.length > 1 && (
                <span className="text-primary-400">
                  ({tenants.length} workspaces)
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={currentTenantId || ""}
                onChange={(e) => setTenant(e.target.value)}
                className="w-full appearance-none bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-100",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
              <span className="text-sm font-medium text-surface-300">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-100 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-surface-950/80 backdrop-blur-sm border-b border-surface-800">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-400 hover:text-surface-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Current Workspace Indicator */}
            {currentTenant && (
              <div className="hidden lg:flex items-center gap-2 text-surface-400">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{currentTenant.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-800 text-surface-500">
                  {currentTenant.subscriptionTier}
                </span>
              </div>
            )}

            <div className="flex-1" />

            {/* Notification for new workspace invitation */}
            {newWorkspaceNotification && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 border border-primary-500/30 rounded-lg mr-4 animate-pulse">
                <Bell className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-primary-300">
                  {newWorkspaceNotification}
                </span>
                <button
                  onClick={() => setNewWorkspaceNotification(null)}
                  className="ml-2 p-0.5 hover:bg-primary-500/20 rounded"
                >
                  <X className="h-3 w-3 text-primary-400" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
