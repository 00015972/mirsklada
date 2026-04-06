/**
 * Dashboard Page
 * Real-time metrics and analytics with Chart.js
 */
import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CreditCard,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/stores";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Chart.js defaults — will be adjusted dynamically per render

type Period = "today" | "week" | "month" | "year";

interface Metrics {
  revenue: {
    amount: number;
    amountUSD: number;
    change: number;
    period: string;
  };
  debt: {
    amount: number;
    amountUSD: number;
  };
  orders: {
    count: number;
    change: number;
    period: string;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    stockValue: number;
    stockValueUSD: number;
  };
  clients: {
    active: number;
  };
  exchangeRate: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface StatusData {
  status: string;
  count: number;
  amount?: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopClient {
  clientId: string;
  clientName: string;
  totalOrders?: number;
  totalRevenue?: number;
  debt?: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

interface RecentPayment {
  id: string;
  clientName: string;
  orderNumber: string;
  amount: number;
  method: string;
  createdAt: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
}

/**
 * Format price with thousand separators (Uzbek format)
 */
function formatPrice(amount: number, currency: "UZS" | "USD" = "UZS"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

/**
 * Format compact number
 */
function formatCompact(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

const statusColors: Record<string, string> = {
  DRAFT: "#6b7280",
  CONFIRMED: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  UNPAID: "#ef4444",
  PARTIAL: "#f59e0b",
  PAID: "#22c55e",
};

export function DashboardPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // Update Chart.js defaults based on theme
  ChartJS.defaults.color = isDark ? "#9ca3af" : "#6b7280";
  ChartJS.defaults.borderColor = isDark ? "#374151" : "#e5e7eb";

  const [period, setPeriod] = useState<Period>("month");
  const [showUSD, setShowUSD] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueDataPoint[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<StatusData[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<StatusData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topDebtors, setTopDebtors] = useState<TopClient[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    [],
  );

  const fetchDashboardData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [
          metricsRes,
          revenueRes,
          ordersStatusRes,
          paymentStatusRes,
          topProductsRes,
          topDebtorsRes,
          recentOrdersRes,
          recentPaymentsRes,
          lowStockRes,
        ] = await Promise.all([
          api.get(`/dashboard/metrics?period=${period}`),
          api.get(`/dashboard/revenue-chart?period=${period}`),
          api.get(`/dashboard/orders-by-status?period=${period}`),
          api.get(`/dashboard/payment-status?period=${period}`),
          api.get(`/dashboard/top-products?period=${period}&limit=5`),
          api.get(`/dashboard/top-clients?sortBy=debt&limit=5`),
          api.get("/dashboard/recent-orders?limit=5"),
          api.get("/dashboard/recent-payments?limit=5"),
          api.get("/dashboard/low-stock?limit=5"),
        ]);

        setMetrics(metricsRes.data.data);
        setRevenueChart(revenueRes.data.data || []);
        setOrdersByStatus(ordersStatusRes.data.data || []);
        setPaymentStatus(paymentStatusRes.data.data || []);
        setTopProducts(topProductsRes.data.data || []);
        setTopDebtors(topDebtorsRes.data.data || []);
        setRecentOrders(recentOrdersRes.data.data || []);
        setRecentPayments(recentPaymentsRes.data.data || []);
        setLowStockProducts(lowStockRes.data.data || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [period],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Revenue chart config
  const revenueChartData = {
    labels: revenueChart.map((d) => d.date),
    datasets: [
      {
        label: "Revenue",
        data: revenueChart.map((d) =>
          showUSD ? d.revenue / (metrics?.exchangeRate || 12500) : d.revenue,
        ),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCompact(Number(value));
          },
        },
      },
    },
  };

  // Orders by status chart
  const ordersChartData = {
    labels: ordersByStatus.map((d) => d.status),
    datasets: [
      {
        data: ordersByStatus.map((d) => d.count),
        backgroundColor: ordersByStatus.map(
          (d) => statusColors[d.status] || "#6b7280",
        ),
        borderWidth: 0,
      },
    ],
  };

  // Payment status chart
  const paymentChartData = {
    labels: paymentStatus.map((d) => d.status),
    datasets: [
      {
        data: paymentStatus.map((d) => d.count),
        backgroundColor: paymentStatus.map(
          (d) => statusColors[d.status] || "#6b7280",
        ),
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
        },
      },
    },
    cutout: "60%",
  };

  // Top products chart
  const topProductsChartData = {
    labels: topProducts.map((p) =>
      p.productName.length > 15
        ? p.productName.substring(0, 15) + "..."
        : p.productName,
    ),
    datasets: [
      {
        label: "Revenue",
        data: topProducts.map((p) =>
          showUSD
            ? p.totalRevenue / (metrics?.exchangeRate || 12500)
            : p.totalRevenue,
        ),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCompact(Number(value));
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Dashboard
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Overview of your business performance
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Updated {formatDate(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <button
            type="button"
            onClick={() => setShowUSD(!showUSD)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showUSD
                ? "bg-green-500/20 text-green-500 dark:text-green-400"
                : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
            }`}
          >
            {showUSD ? "USD" : "UZS"}
          </button>

          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="select-field text-sm"
            aria-label="Select dashboard period"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              {metrics?.revenue.change !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    (metrics?.revenue.change || 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {(metrics?.revenue.change || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(metrics?.revenue.change || 0)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Revenue
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {showUSD
                  ? formatPrice(metrics?.revenue.amountUSD || 0, "USD")
                  : formatPrice(metrics?.revenue.amount || 0, "UZS")}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                {periodLabels[period]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Debt */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-amber-400" />
              </div>
              {(metrics?.debt.amount || 0) > 0 && (
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Outstanding Debt
              </p>
              <p className="text-2xl font-bold text-amber-400">
                {showUSD
                  ? formatPrice(metrics?.debt.amountUSD || 0, "USD")
                  : formatPrice(metrics?.debt.amount || 0, "UZS")}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                Total unpaid
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-400" />
              </div>
              {metrics?.orders.change !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    (metrics?.orders.change || 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {(metrics?.orders.change || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(metrics?.orders.change || 0)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Orders
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {metrics?.orders.count || 0}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                {periodLabels[period]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
              {(metrics?.inventory.lowStock || 0) +
                (metrics?.inventory.outOfStock || 0) >
                0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  {(metrics?.inventory.lowStock || 0) +
                    (metrics?.inventory.outOfStock || 0)}{" "}
                  alerts
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Inventory Value
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {showUSD
                  ? formatPrice(metrics?.inventory.stockValueUSD || 0, "USD")
                  : formatPrice(metrics?.inventory.stockValue || 0, "UZS")}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                {metrics?.inventory.totalProducts} products
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Active Clients
              </p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {metrics?.clients.active || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Low Stock
              </p>
              <p className="text-xl font-bold text-amber-400">
                {metrics?.inventory.lowStock || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Package className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Out of Stock
              </p>
              <p className="text-xl font-bold text-red-400">
                {metrics?.inventory.outOfStock || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {revenueChart.length > 0 ? (
                <Line data={revenueChartData} options={revenueChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-surface-500">
                  No revenue data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {ordersByStatus.length > 0 ? (
                <Doughnut data={ordersChartData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-surface-500">
                  No orders for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {topProducts.length > 0 ? (
                <Bar data={topProductsChartData} options={barChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-surface-500">
                  No sales data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {paymentStatus.length > 0 ? (
                <Doughnut data={paymentChartData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-surface-500">
                  No payment data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Debtors</CardTitle>
            <Link
              to="/dashboard/clients"
              className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {topDebtors.length > 0 ? (
              <div className="space-y-3">
                {topDebtors.map((client, index) => (
                  <div
                    key={client.clientId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-xs text-surface-500 dark:text-surface-400">
                        {index + 1}
                      </span>
                      <span className="text-surface-700 dark:text-surface-200">
                        {client.clientName}
                      </span>
                    </div>
                    <span className="text-red-400 font-medium">
                      {showUSD
                        ? formatPrice(
                            (client.debt || 0) /
                              (metrics?.exchangeRate || 12500),
                            "USD",
                          )
                        : formatPrice(client.debt || 0, "UZS")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-surface-500">
                No outstanding debts
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              to="/dashboard/orders"
              className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {order.clientName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {showUSD
                          ? formatPrice(
                              order.totalAmount /
                                (metrics?.exchangeRate || 12500),
                              "USD",
                            )
                          : formatPrice(order.totalAmount, "UZS")}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : order.status === "CONFIRMED"
                                ? "bg-blue-500/20 text-blue-400"
                                : order.status === "CANCELLED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-surface-500">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link
              to="/dashboard/orders"
              className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {payment.clientName}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {payment.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-400">
                        +
                        {showUSD
                          ? formatPrice(
                              payment.amount / (metrics?.exchangeRate || 12500),
                              "USD",
                            )
                          : formatPrice(payment.amount, "UZS")}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">
                        {payment.method}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-surface-500">
                No payments yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
            <Link
              to="/dashboard/stock"
              className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
            >
              Manage stock <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                >
                  <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-amber-400 font-bold">
                      {product.currentStock.toFixed(2)} kg
                    </span>
                    <span className="text-xs text-surface-400 dark:text-surface-500">
                      min: {product.minStock} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exchange Rate Footer */}
      <div className="text-center text-xs text-surface-400 dark:text-surface-500">
        Exchange rate: 1 USD ={" "}
        {metrics?.exchangeRate?.toLocaleString() || "12,500"} UZS
      </div>
    </div>
  );
}
