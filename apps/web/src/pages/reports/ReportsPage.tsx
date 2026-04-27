/**
 * Reports Page
 * Analytics dashboard with exportable reports for business insights.
 * Features: Revenue reports, inventory reports, client analytics,
 * order summaries, and export to CSV functionality.
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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Filter,
  Loader2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Zap,
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
import { useAuthStore, useThemeStore } from "@/stores";
import { useTranslation } from "react-i18next";

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

type Period = "today" | "week" | "month" | "quarter" | "year";
type ReportType = "revenue" | "inventory" | "clients" | "orders" | "payments";

interface RevenueData extends Record<string, unknown> {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

interface InventoryReport extends Record<string, unknown> {
  categoryName: string;
  productCount: number;
  totalStock: number;
  stockValue: number;
  lowStockCount: number;
}

interface ClientReport extends Record<string, unknown> {
  clientId: string;
  clientName: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  debt: number;
  lastOrderDate: string | null;
}

interface OrderReport extends Record<string, unknown> {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface PaymentReport extends Record<string, unknown> {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface SummaryMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalClients: number;
  totalDebt: number;
  revenueChange: number;
  ordersChange: number;
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
 * Generate CSV content from data
 */
function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
): string {
  const headerRow = headers.map((h) => h.label).join(",");
  const rows = data.map((item) =>
    headers
      .map((h) => {
        const value = item[h.key];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return String(value ?? "");
      })
      .join(","),
  );
  return [headerRow, ...rows].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { tenants, currentTenantId } = useAuthStore();
  const navigate = useNavigate();
  const currentTenant = tenants.find((tenant) => tenant.id === currentTenantId);
  const isPro = currentTenant?.subscriptionTier === "pro";
  const isDark = theme === "dark";

  // Update Chart.js defaults based on theme
  ChartJS.defaults.color = isDark ? "#9ca3af" : "#6b7280";
  ChartJS.defaults.borderColor = isDark ? "#374151" : "#e5e7eb";

  const periodOptions = [
    { value: "today", label: t("reports.periods.today") },
    { value: "week", label: t("reports.periods.week") },
    { value: "month", label: t("reports.periods.month") },
    { value: "quarter", label: t("reports.periods.quarter") },
    { value: "year", label: t("reports.periods.year") },
  ];

  const reportTypeOptions = [
    { value: "revenue", label: t("reports.types.revenue") },
    { value: "inventory", label: t("reports.types.inventory") },
    { value: "clients", label: t("reports.types.clients") },
    { value: "orders", label: t("reports.types.orders") },
    { value: "payments", label: t("reports.types.payments") },
  ];

  const [period, setPeriod] = useState<Period>("month");
  const [reportType, setReportType] = useState<ReportType>("revenue");
  const [showUSD, setShowUSD] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(
    null,
  );
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([]);
  const [clientReport, setClientReport] = useState<ClientReport[]>([]);
  const [orderReport, setOrderReport] = useState<OrderReport[]>([]);
  const [paymentReport, setPaymentReport] = useState<PaymentReport[]>([]);
  const [exchangeRate, setExchangeRate] = useState(12500);

  const fetchReportsData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        // Fetch summary metrics
        const metricsRes = await api.get(`/dashboard/metrics?period=${period}`);
        const metrics = metricsRes.data.data;

        setSummaryMetrics({
          totalRevenue: metrics.revenue?.amount || 0,
          totalOrders: metrics.orders?.count || 0,
          averageOrderValue:
            metrics.orders?.count > 0
              ? (metrics.revenue?.amount || 0) / metrics.orders.count
              : 0,
          totalClients: metrics.clients?.active || 0,
          totalDebt: metrics.debt?.amount || 0,
          revenueChange: metrics.revenue?.change || 0,
          ordersChange: metrics.orders?.change || 0,
        });
        setExchangeRate(metrics.exchangeRate || 12500);

        // Fetch revenue chart data
        const revenueRes = await api.get(
          `/dashboard/revenue-chart?period=${period}`,
        );
        setRevenueData(
          (revenueRes.data.data || []).map(
            (d: { date: string; revenue: number; orders: number }) => ({
              date: d.date,
              revenue: d.revenue,
              cost: d.revenue * 0.7,
              profit: d.revenue * 0.3,
              orders: d.orders,
            }),
          ),
        );

        if (!isPro) return;

        // Fetch category-based inventory report
        try {
          const categoriesRes = await api.get("/categories");
          const productsRes = await api.get("/products?limit=1000");
          const categories = categoriesRes.data.data || [];
          const products = productsRes.data.data || [];

          const inventoryByCategory: InventoryReport[] = categories.map(
            (cat: { id: string; name: string }) => {
              const categoryProducts = products.filter(
                (p: { categoryId: string }) => p.categoryId === cat.id,
              );
              const totalStock = categoryProducts.reduce(
                (sum: number, p: { currentStockKg: number }) =>
                  sum + (Number(p.currentStockKg) || 0),
                0,
              );
              const stockValue = categoryProducts.reduce(
                (
                  sum: number,
                  p: { currentStockKg: number; pricePerKg: string | number },
                ) =>
                  sum +
                  (Number(p.currentStockKg) || 0) * (Number(p.pricePerKg) || 0),
                0,
              );
              const lowStockCount = categoryProducts.filter(
                (p: { currentStockKg: number; minStockKg: number }) =>
                  Number(p.currentStockKg) < Number(p.minStockKg),
              ).length;

              return {
                categoryName: cat.name,
                productCount: categoryProducts.length,
                totalStock: Math.round(totalStock * 100) / 100,
                stockValue,
                lowStockCount,
              };
            },
          );
          setInventoryReport(inventoryByCategory);
        } catch {
          setInventoryReport([]);
        }

        // Fetch client report
        try {
          const clientsRes = await api.get("/dashboard/clients-report");
          setClientReport(clientsRes.data.data || []);
        } catch {
          setClientReport([]);
        }

        // Fetch orders by status
        try {
          const ordersStatusRes = await api.get(
            `/dashboard/orders-by-status?period=${period}`,
          );
          const ordersData = ordersStatusRes.data.data || [];
          const totalOrders = ordersData.reduce(
            (sum: number, d: { count: number }) => sum + d.count,
            0,
          );
          setOrderReport(
            ordersData.map(
              (d: { status: string; count: number; amount?: number }) => ({
                status: d.status,
                count: d.count,
                totalAmount: d.amount || 0,
                percentage:
                  totalOrders > 0
                    ? Math.round((d.count / totalOrders) * 100)
                    : 0,
              }),
            ),
          );
        } catch {
          setOrderReport([]);
        }

        // Fetch payment methods breakdown
        try {
          const paymentRes = await api.get(
            `/dashboard/payment-status?period=${period}`,
          );
          const paymentData = paymentRes.data.data || [];
          const totalPayments = paymentData.reduce(
            (sum: number, d: { count: number }) => sum + d.count,
            0,
          );
          setPaymentReport(
            paymentData.map(
              (d: { status: string; count: number; amount?: number }) => ({
                method: d.status,
                count: d.count,
                totalAmount: d.amount || 0,
                percentage:
                  totalPayments > 0
                    ? Math.round((d.count / totalPayments) * 100)
                    : 0,
              }),
            ),
          );
        } catch {
          setPaymentReport([]);
        }
      } catch (error) {
        console.error("Failed to load reports:", error);
        toast.error(t("reports.errorLoading"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isPro, period, t],
  );

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      let csvContent = "";
      let filename = "";

      switch (reportType) {
        case "revenue":
          csvContent = generateCSV(revenueData, [
            { key: "date", label: t("reports.columns.date") },
            { key: "revenue", label: t("reports.columns.revenue") },
            { key: "cost", label: t("reports.columns.cost") },
            { key: "profit", label: t("reports.columns.profit") },
            { key: "orders", label: t("reports.columns.orders") },
          ]);
          filename = `revenue-report-${period}-${dateStr}.csv`;
          break;

        case "inventory":
          csvContent = generateCSV(inventoryReport, [
            { key: "categoryName", label: t("reports.columns.category") },
            { key: "productCount", label: t("reports.columns.productCount") },
            { key: "totalStock", label: t("reports.columns.totalStock") },
            { key: "stockValue", label: t("reports.columns.stockValue") },
            { key: "lowStockCount", label: t("reports.columns.lowStock") },
          ]);
          filename = `inventory-report-${dateStr}.csv`;
          break;

        case "clients":
          csvContent = generateCSV(clientReport, [
            { key: "clientName", label: t("reports.columns.clientName") },
            { key: "phone", label: t("common.phone") },
            { key: "totalOrders", label: t("reports.columns.totalOrders") },
            { key: "totalSpent", label: t("reports.columns.totalSpent") },
            { key: "debt", label: t("reports.columns.debt") },
          ]);
          filename = `clients-report-${dateStr}.csv`;
          break;

        case "orders":
          csvContent = generateCSV(orderReport, [
            { key: "status", label: t("common.status") },
            { key: "count", label: t("reports.columns.count") },
            { key: "totalAmount", label: t("reports.columns.totalAmount") },
            { key: "percentage", label: t("reports.columns.percentage") },
          ]);
          filename = `orders-report-${period}-${dateStr}.csv`;
          break;

        case "payments":
          csvContent = generateCSV(paymentReport, [
            { key: "method", label: t("reports.columns.method") },
            { key: "count", label: t("reports.columns.count") },
            { key: "totalAmount", label: t("reports.columns.totalAmount") },
            { key: "percentage", label: t("reports.columns.percentage") },
          ]);
          filename = `payments-report-${period}-${dateStr}.csv`;
          break;
      }

      downloadCSV(csvContent, filename);
      toast.success(t("reports.exportSuccess"));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("reports.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  // Chart configurations
  const revenueChartData = {
    labels: revenueData.map((d) => d.date),
    datasets: [
      {
        label: t("reports.columns.revenue"),
        data: revenueData.map((d) =>
          showUSD ? d.revenue / exchangeRate : d.revenue,
        ),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: t("reports.columns.profit"),
        data: revenueData.map((d) =>
          showUSD ? d.profit / exchangeRate : d.profit,
        ),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
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

  const inventoryChartData = {
    labels: inventoryReport.map((d) => d.categoryName),
    datasets: [
      {
        label: t("reports.columns.stockValue"),
        data: inventoryReport.map((d) =>
          showUSD ? d.stockValue / exchangeRate : d.stockValue,
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

  const orderChartData = {
    labels: orderReport.map((d) => t(`orders.status.${d.status}`, d.status)),
    datasets: [
      {
        data: orderReport.map((d) => d.count),
        backgroundColor: ["#6b7280", "#3b82f6", "#22c55e", "#ef4444"],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {t("reports.title")}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              {t("reports.subtitle")}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fetchReportsData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("reports.refresh")}
          </Button>
        </div>

        {/* Period filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-surface-500" />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {t("reports.period")}:
              </span>
              <div className="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value as Period)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      period === opt.value
                        ? "bg-primary-600 text-white"
                        : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
                {summaryMetrics && summaryMetrics.revenueChange !== 0 && (
                  <div className={`flex items-center text-sm ${summaryMetrics.revenueChange > 0 ? "text-green-400" : "text-red-400"}`}>
                    {summaryMetrics.revenueChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(summaryMetrics.revenueChange)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">{t("reports.metrics.totalRevenue")}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {summaryMetrics ? formatPrice(summaryMetrics.totalRevenue) : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-400" />
                </div>
                {summaryMetrics && summaryMetrics.ordersChange !== 0 && (
                  <div className={`flex items-center text-sm ${summaryMetrics.ordersChange > 0 ? "text-green-400" : "text-red-400"}`}>
                    {summaryMetrics.ordersChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(summaryMetrics.ordersChange)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">{t("reports.metrics.totalOrders")}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {summaryMetrics?.totalOrders ?? "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="p-2 bg-purple-500/10 rounded-lg w-fit">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">{t("reports.metrics.activeClients")}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {summaryMetrics?.totalClients ?? "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="p-2 bg-amber-500/10 rounded-lg w-fit">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">{t("reports.metrics.avgOrderValue")}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {summaryMetrics ? formatPrice(summaryMetrics.averageOrderValue) : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              {t("reports.charts.revenueTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={revenueChartData} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Pro upgrade teaser */}
        <Card className="border border-primary-500/30 bg-primary-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-5 w-5 text-primary-500" />
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    {t("reports.proFeatures")}
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-surface-600 dark:text-surface-400">
                  <li>• {t("reports.proFeature.inventory")}</li>
                  <li>• {t("reports.proFeature.clients")}</li>
                  <li>• {t("reports.proFeature.orders")}</li>
                  <li>• {t("reports.proFeature.payments")}</li>
                  <li>• {t("reports.proFeature.export")}</li>
                </ul>
              </div>
              <Button
                type="button"
                className="shrink-0"
                onClick={() => navigate("/dashboard/settings")}
              >
                <Zap className="h-4 w-4 mr-2" />
                {t("settings.upgrade")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {t("reports.title")}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t("reports.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUSD(!showUSD)}
            className="text-surface-600 dark:text-surface-400"
          >
            {showUSD ? "USD" : "UZS"}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchReportsData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("reports.refresh")}
          </Button>

          {/* Export Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t("reports.exportCSV")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-surface-500" />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {t("reports.period")}:
              </span>
              <div className="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value as Period)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      period === opt.value
                        ? "bg-primary-600 text-white"
                        : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-surface-500" />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {t("reports.reportType")}:
              </span>
              <div className="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                {reportTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportType(opt.value as ReportType)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      reportType === opt.value
                        ? "bg-primary-600 text-white"
                        : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              {summaryMetrics && summaryMetrics.revenueChange !== 0 && (
                <div
                  className={`flex items-center text-sm ${
                    summaryMetrics.revenueChange > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {summaryMetrics.revenueChange > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(summaryMetrics.revenueChange)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("reports.metrics.totalRevenue")}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {summaryMetrics
                  ? formatPrice(
                      showUSD
                        ? summaryMetrics.totalRevenue / exchangeRate
                        : summaryMetrics.totalRevenue,
                      showUSD ? "USD" : "UZS",
                    )
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-400" />
              </div>
              {summaryMetrics && summaryMetrics.ordersChange !== 0 && (
                <div
                  className={`flex items-center text-sm ${
                    summaryMetrics.ordersChange > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {summaryMetrics.ordersChange > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(summaryMetrics.ordersChange)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("reports.metrics.totalOrders")}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {summaryMetrics?.totalOrders ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("reports.metrics.activeClients")}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {summaryMetrics?.totalClients ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("reports.metrics.avgOrderValue")}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {summaryMetrics
                  ? formatPrice(
                      showUSD
                        ? summaryMetrics.averageOrderValue / exchangeRate
                        : summaryMetrics.averageOrderValue,
                      showUSD ? "USD" : "UZS",
                    )
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on selected report type */}
      {reportType === "revenue" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                {t("reports.charts.revenueTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={revenueChartData} options={lineChartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Revenue Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-500" />
                {t("reports.tables.revenueDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.date")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.revenue")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.profit")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.orders")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.length > 0 ? (
                      revenueData.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-surface-100 dark:border-surface-800"
                        >
                          <td className="py-3 px-4 text-sm text-surface-900 dark:text-surface-100">
                            {row.date}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {formatPrice(
                              showUSD
                                ? row.revenue / exchangeRate
                                : row.revenue,
                              showUSD ? "USD" : "UZS",
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-green-500">
                            {formatPrice(
                              showUSD ? row.profit / exchangeRate : row.profit,
                              showUSD ? "USD" : "UZS",
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.orders}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-surface-500 dark:text-surface-400"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "inventory" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                {t("reports.charts.inventoryByCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={inventoryChartData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                {t("reports.tables.inventoryDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.category")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.productCount")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.totalStock")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.lowStock")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.length > 0 ? (
                      inventoryReport.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-surface-100 dark:border-surface-800"
                        >
                          <td className="py-3 px-4 text-sm text-surface-900 dark:text-surface-100">
                            {row.categoryName}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.productCount}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.totalStock.toFixed(2)} kg
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {row.lowStockCount > 0 ? (
                              <span className="text-red-500">
                                {row.lowStockCount}
                              </span>
                            ) : (
                              <span className="text-green-500">0</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-surface-500 dark:text-surface-400"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "clients" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-500" />
              {t("reports.tables.clientReport")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                      {t("reports.columns.clientName")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                      {t("common.phone")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                      {t("reports.columns.totalOrders")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                      {t("reports.columns.totalSpent")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                      {t("reports.columns.debt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientReport.length > 0 ? (
                    clientReport.map((client) => (
                      <tr
                        key={client.clientId}
                        className="border-b border-surface-100 dark:border-surface-800"
                      >
                        <td className="py-3 px-4 text-sm text-surface-900 dark:text-surface-100">
                          {client.clientName}
                        </td>
                        <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-400">
                          {client.phone || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                          {client.totalOrders}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                          {formatPrice(
                            showUSD
                              ? client.totalSpent / exchangeRate
                              : client.totalSpent,
                            showUSD ? "USD" : "UZS",
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          {client.debt > 0 ? (
                            <span className="text-red-500">
                              {formatPrice(
                                showUSD
                                  ? client.debt / exchangeRate
                                  : client.debt,
                                showUSD ? "USD" : "UZS",
                              )}
                            </span>
                          ) : (
                            <span className="text-green-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-surface-500 dark:text-surface-400"
                      >
                        {t("common.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "orders" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                {t("reports.charts.ordersByStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Doughnut data={orderChartData} options={doughnutOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary-500" />
                {t("reports.tables.orderDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("common.status")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.count")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.percentage")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderReport.length > 0 ? (
                      orderReport.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-surface-100 dark:border-surface-800"
                        >
                          <td className="py-3 px-4 text-sm text-surface-900 dark:text-surface-100">
                            {t(
                              `orders.status.${row.status.toLowerCase()}`,
                              row.status,
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.count}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.percentage}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-8 text-center text-surface-500 dark:text-surface-400"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "payments" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                {t("reports.charts.paymentBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Doughnut
                  data={{
                    labels: paymentReport.map((d) =>
                      t(`orders.paymentStatus.${d.method}`, d.method),
                    ),
                    datasets: [
                      {
                        data: paymentReport.map((d) => d.count),
                        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-500" />
                {t("reports.tables.paymentDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("common.status")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.count")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-surface-600 dark:text-surface-400">
                        {t("reports.columns.percentage")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentReport.length > 0 ? (
                      paymentReport.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-surface-100 dark:border-surface-800"
                        >
                          <td className="py-3 px-4 text-sm text-surface-900 dark:text-surface-100">
                            {t(
                              `payments.status.${row.method.toLowerCase()}`,
                              row.method,
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.count}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-surface-900 dark:text-surface-100">
                            {row.percentage}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-8 text-center text-surface-500 dark:text-surface-400"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debt Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <TrendingDown className="h-5 w-5" />
            {t("reports.debtSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("reports.totalOutstandingDebt")}
              </p>
              <p className="text-3xl font-bold text-red-500">
                {summaryMetrics
                  ? formatPrice(
                      showUSD
                        ? summaryMetrics.totalDebt / exchangeRate
                        : summaryMetrics.totalDebt,
                      showUSD ? "USD" : "UZS",
                    )
                  : "-"}
              </p>
            </div>
            <div className="text-sm text-surface-500 dark:text-surface-400">
              {t("reports.clientsWithDebt", {
                count: clientReport.filter((c) => c.debt > 0).length,
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
