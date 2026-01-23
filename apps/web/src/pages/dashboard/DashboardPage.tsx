/**
 * Dashboard Page
 */
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useAuthStore } from "@/stores";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-400">{title}</p>
          <p className="text-2xl font-bold text-surface-100 mt-1">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {Math.abs(change)}%
            </span>
            <span className="text-surface-500 text-sm">vs last month</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-primary-500/10">{icon}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user, tenants, currentTenantId } = useAuthStore();
  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
        <p className="text-surface-400 mt-1">
          Welcome back, {user?.name || user?.email}
          {currentTenant && (
            <span className="text-primary-400"> • {currentTenant.name}</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value="156"
          change={12.5}
          icon={<Package className="h-6 w-6 text-primary-400" />}
        />
        <StatCard
          title="Active Clients"
          value="48"
          change={8.2}
          icon={<Users className="h-6 w-6 text-primary-400" />}
        />
        <StatCard
          title="Orders Today"
          value="23"
          change={-3.1}
          icon={<ShoppingCart className="h-6 w-6 text-primary-400" />}
        />
        <StatCard
          title="Revenue (UZS)"
          value="45.2M"
          change={15.3}
          icon={<TrendingUp className="h-6 w-6 text-primary-400" />}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors text-left">
                <Package className="h-6 w-6 text-primary-400 mb-2" />
                <p className="font-medium text-surface-100">Add Product</p>
                <p className="text-sm text-surface-400">New inventory item</p>
              </button>
              <button className="p-4 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors text-left">
                <ShoppingCart className="h-6 w-6 text-primary-400 mb-2" />
                <p className="font-medium text-surface-100">New Order</p>
                <p className="text-sm text-surface-400">Create sales order</p>
              </button>
              <button className="p-4 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors text-left">
                <Users className="h-6 w-6 text-primary-400 mb-2" />
                <p className="font-medium text-surface-100">Add Client</p>
                <p className="text-sm text-surface-400">Register new client</p>
              </button>
              <button className="p-4 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors text-left">
                <TrendingUp className="h-6 w-6 text-primary-400 mb-2" />
                <p className="font-medium text-surface-100">Stock In</p>
                <p className="text-sm text-surface-400">Receive inventory</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Order #ORD-2026-0042 completed",
                  time: "2 min ago",
                  type: "order",
                },
                {
                  action: "Stock received: Salmon +50kg",
                  time: "15 min ago",
                  type: "stock",
                },
                {
                  action: "New client: Market Plus",
                  time: "1 hour ago",
                  type: "client",
                },
                {
                  action: "Payment received: 2,500,000 UZS",
                  time: "2 hours ago",
                  type: "payment",
                },
                {
                  action: "Low stock alert: Cheese Gouda",
                  time: "3 hours ago",
                  type: "alert",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0"
                >
                  <div>
                    <p className="text-surface-200">{item.action}</p>
                    <p className="text-sm text-surface-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-500">⚠️ Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-surface-400 text-sm">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Current Stock</th>
                  <th className="pb-3 font-medium">Min Stock</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-surface-200">
                <tr className="border-t border-surface-800">
                  <td className="py-3">Cheese Gouda</td>
                  <td className="py-3">Cheese</td>
                  <td className="py-3">5.50 kg</td>
                  <td className="py-3">10.00 kg</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">
                      Critical
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-surface-800">
                  <td className="py-3">Salmon Fillet</td>
                  <td className="py-3">Fish</td>
                  <td className="py-3">12.30 kg</td>
                  <td className="py-3">15.00 kg</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
                      Low
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
