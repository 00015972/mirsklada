/**
 * Payments Page
 * List and manage payments with filtering and recording
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Loader2,
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  Eye,
  XCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  SearchableSelect,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

interface Client {
  id: string;
  name: string;
  currentDebt?: number | string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  paidAmount: number | string;
}

interface Payment {
  id: string;
  amount: number | string;
  method: "CASH" | "CARD" | "TRANSFER" | "CLICK" | "PAYME";
  reference: string | null;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  } | null;
  receivedBy?: {
    id: string;
    email: string;
  } | null;
}

interface PaymentSummary {
  total: number;
  count: number;
  byMethod: Record<string, number>;
}

type PaymentMethod = Payment["method"];

/**
 * Format price with thousand separators (Uzbek format)
 */
function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0 UZS";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 UZS";
  return new Intl.NumberFormat("uz-UZ").format(num) + " UZS";
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format short date
 */
function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PaymentsPage() {
  const { t } = useTranslation();
  const { tenants, currentTenantId } = useAuthStore();
  const currentTenant = tenants.find((t) => t.id === currentTenantId);
  if (currentTenant?.role?.toLowerCase() === "staff") {
    return <Navigate to="/dashboard" replace />;
  }
  const methodConfig: Record<
    string,
    { label: string; icon: typeof Banknote; className: string }
  > = {
    CASH: {
      label: t("payments.methods.CASH"),
      icon: Banknote,
      className: "bg-green-500/10 text-green-400",
    },
    CARD: {
      label: t("payments.methods.CARD"),
      icon: CreditCard,
      className: "bg-blue-500/10 text-blue-400",
    },
    TRANSFER: {
      label: t("payments.methods.TRANSFER"),
      icon: Building,
      className: "bg-purple-500/10 text-purple-400",
    },
    CLICK: {
      label: t("payments.methods.CLICK"),
      icon: Smartphone,
      className: "bg-cyan-500/10 text-cyan-400",
    },
    PAYME: {
      label: t("payments.methods.PAYME"),
      icon: Smartphone,
      className: "bg-amber-500/10 text-amber-400",
    },
  };
  // Data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("month");

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // Record payment form
  const [recordClientId, setRecordClientId] = useState("");
  const [recordOrderId, setRecordOrderId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState<string>("CASH");
  const [recordReference, setRecordReference] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Void form
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);

  // Get date range for API
  const getDateParams = useCallback(() => {
    const now = new Date();
    let startDate: Date | undefined;
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "all":
        return {};
    }

    return {
      startDate: startDate?.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [dateRange]);

  const isInActiveDateRange = (dateStr: string): boolean => {
    const parsedDate = new Date(dateStr);
    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    const dateParams = getDateParams();
    if (dateParams.startDate) {
      const startDate = new Date(dateParams.startDate);
      if (parsedDate < startDate) {
        return false;
      }
    }

    if (dateParams.endDate) {
      const endDate = new Date(dateParams.endDate);
      if (parsedDate > endDate) {
        return false;
      }
    }

    return true;
  };

  const matchesActiveFilters = (payment: Payment): boolean => {
    if (selectedClientId && payment.client.id !== selectedClientId) {
      return false;
    }

    if (selectedMethod && payment.method !== selectedMethod) {
      return false;
    }

    return isInActiveDateRange(payment.createdAt);
  };

  const applyFilters = (items: Payment[]): Payment[] => {
    return items.filter(matchesActiveFilters);
  };

  const adjustSummaryOptimistically = (
    amountDelta: number,
    method: PaymentMethod,
    createdAt: string,
  ) => {
    if (!isInActiveDateRange(createdAt)) {
      return;
    }

    setSummary((prevSummary) => {
      if (!prevSummary) {
        return prevSummary;
      }

      return {
        total: prevSummary.total + amountDelta,
        count: prevSummary.count + 1,
        byMethod: {
          ...prevSummary.byMethod,
          [method]: (prevSummary.byMethod[method] || 0) + amountDelta,
        },
      };
    });
  };

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (selectedClientId) params.append("clientId", selectedClientId);
      if (selectedMethod) params.append("method", selectedMethod);

      const dateParams = getDateParams();
      if (dateParams.startDate)
        params.append("startDate", dateParams.startDate);
      if (dateParams.endDate) params.append("endDate", dateParams.endDate);

      const response = await api.get(`/payments?${params.toString()}`);
      setPayments(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(t("payments.errorLoad"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, selectedMethod, getDateParams, t]);

  // Fetch payment summary
  const fetchSummary = useCallback(async () => {
    try {
      const dateParams = getDateParams();
      const params = new URLSearchParams();
      if (dateParams.startDate)
        params.append("startDate", dateParams.startDate);
      if (dateParams.endDate) params.append("endDate", dateParams.endDate);

      const response = await api.get(`/payments/summary?${params.toString()}`);
      setSummary(response.data.data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    }
  }, [getDateParams]);

  // Fetch clients for filter and form
  const fetchClients = async () => {
    try {
      const response = await api.get("/clients?isActive=true");
      setClients(response.data.data || []);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  // Fetch client orders (unpaid/partial)
  const fetchClientOrders = async (clientId: string) => {
    if (!clientId) {
      setClientOrders([]);
      return;
    }
    try {
      const response = await api.get(
        `/orders?clientId=${clientId}&paymentStatus=UNPAID,PARTIAL`,
      );
      setClientOrders(response.data.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setClientOrders([]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [fetchPayments, fetchSummary]);

  // When record client changes, fetch their orders
  useEffect(() => {
    if (recordClientId) {
      fetchClientOrders(recordClientId);
    } else {
      setClientOrders([]);
      setRecordOrderId("");
    }
  }, [recordClientId]);

  // Reset record form
  const resetRecordForm = () => {
    setRecordClientId("");
    setRecordOrderId("");
    setRecordAmount("");
    setRecordMethod("CASH");
    setRecordReference("");
    setRecordNotes("");
    setClientOrders([]);
    setFormError(null);
  };

  // Open record modal
  const handleOpenRecord = () => {
    resetRecordForm();
    setIsRecordModalOpen(true);
  };

  // Handle client selection in record form
  const handleRecordClientChange = (clientId: string) => {
    setRecordClientId(clientId);
    setRecordOrderId("");
  };

  // Handle order selection - auto-fill remaining amount
  const handleRecordOrderChange = (orderId: string) => {
    setRecordOrderId(orderId);
    if (orderId) {
      const order = clientOrders.find((o) => o.id === orderId);
      if (order) {
        const total =
          typeof order.totalAmount === "string"
            ? parseFloat(order.totalAmount)
            : order.totalAmount;
        const paid =
          typeof order.paidAmount === "string"
            ? parseFloat(order.paidAmount)
            : order.paidAmount;
        const remaining = total - paid;
        if (remaining > 0) {
          setRecordAmount(remaining.toString());
        }
      }
    }
  };

  // Submit record payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recordClientId) {
      setFormError(t("payments.selectClient"));
      return;
    }

    const amount = parseFloat(recordAmount);
    if (!amount || amount <= 0) {
      setFormError(t("payments.invalidAmount"));
      return;
    }

    const normalizedMethod = recordMethod as PaymentMethod;
    const selectedClient = clients.find(
      (client) => client.id === recordClientId,
    );
    const selectedOrder = clientOrders.find(
      (order) => order.id === recordOrderId,
    );
    const optimisticCreatedAt = new Date().toISOString();
    const optimisticId = `temp-payment-${Date.now()}`;
    const optimisticPayment: Payment = {
      id: optimisticId,
      amount,
      method: normalizedMethod,
      reference: recordReference.trim() || null,
      notes: recordNotes.trim() || null,
      createdAt: optimisticCreatedAt,
      client: {
        id: recordClientId,
        name: selectedClient?.name || "Unknown client",
      },
      order: recordOrderId
        ? {
            id: recordOrderId,
            orderNumber: selectedOrder?.orderNumber || "Order",
          }
        : null,
      receivedBy: null,
    };
    const previousPayments = payments;
    const previousSummary = summary;

    setIsSubmitting(true);
    setFormError(null);
    setPayments((prevPayments) =>
      applyFilters([optimisticPayment, ...prevPayments]),
    );
    adjustSummaryOptimistically(
      amount,
      optimisticPayment.method,
      optimisticCreatedAt,
    );

    try {
      const response = await api.post("/payments", {
        clientId: recordClientId,
        orderId: recordOrderId || undefined,
        amount,
        method: normalizedMethod,
        reference: recordReference.trim() || undefined,
        notes: recordNotes.trim() || undefined,
      });

      const serverPayment = response?.data?.data as Payment | undefined;

      if (serverPayment) {
        setPayments((prevPayments) => {
          const nextPayments = prevPayments.map((payment) =>
            payment.id === optimisticId ? serverPayment : payment,
          );
          return applyFilters(nextPayments);
        });
      } else {
        await fetchPayments();
      }

      setIsRecordModalOpen(false);
      resetRecordForm();
      toast.success(t("payments.recorded"));
    } catch (err: unknown) {
      setPayments(previousPayments);
      setSummary(previousSummary);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("payments.errorRecord");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("payments.errorRecord"));
        toast.error(t("payments.errorRecord"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open void modal
  const handleOpenVoid = (payment: Payment) => {
    setViewingPayment(payment);
    setVoidReason("");
    setVoidError(null);
    setIsVoidModalOpen(true);
  };

  // Submit void payment
  const handleVoidPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!viewingPayment) return;

    if (!voidReason.trim()) {
      setVoidError(t("payments.voidReasonRequired"));
      return;
    }

    const paymentToVoid = viewingPayment;
    const amountToReverse =
      typeof paymentToVoid.amount === "string"
        ? Math.abs(parseFloat(paymentToVoid.amount))
        : Math.abs(paymentToVoid.amount);
    const optimisticCreatedAt = new Date().toISOString();
    const optimisticVoid: Payment = {
      ...paymentToVoid,
      id: `temp-void-${Date.now()}`,
      amount: -amountToReverse,
      reference: `VOID:${paymentToVoid.id}`,
      notes: `Voided: ${voidReason.trim()}`,
      createdAt: optimisticCreatedAt,
    };
    const previousPayments = payments;
    const previousSummary = summary;

    setIsSubmitting(true);
    setVoidError(null);
    setPayments((prevPayments) =>
      applyFilters([optimisticVoid, ...prevPayments]),
    );
    adjustSummaryOptimistically(
      -amountToReverse,
      paymentToVoid.method,
      optimisticCreatedAt,
    );

    try {
      await api.post(`/payments/${paymentToVoid.id}/void`, {
        reason: voidReason.trim(),
      });

      setIsVoidModalOpen(false);
      setViewingPayment(null);
      toast.success(t("payments.voidedSuccess"));
      void fetchPayments();
      void fetchSummary();
    } catch (err: unknown) {
      setPayments(previousPayments);
      setSummary(previousSummary);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("payments.errorVoid");
        setVoidError(message);
        toast.error(message);
      } else {
        setVoidError(t("payments.errorVoid"));
        toast.error(t("payments.errorVoid"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected client&apos;s debt
  const selectedRecordClient = clients.find((c) => c.id === recordClientId);

  if (isLoading && payments.length === 0) {
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
            {t("payments.title")}
          </h1>
          <p className="text-surface-400 mt-1">
            {t("payments.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              fetchPayments();
              fetchSummary();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleOpenRecord}>
            <Plus className="h-4 w-4 mr-2" />
            {t("payments.recordPayment")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total */}
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">{t("payments.totalReceived")}</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatPrice(summary.total)}
                  </p>
                  <p className="text-xs text-surface-500">
                    {t("payments.paymentsCount", { count: summary.count })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Method */}
          {Object.entries(methodConfig).map(([method, config]) => {
            const Icon = config.icon;
            const amount = summary.byMethod[method] || 0;

            return (
              <Card key={method}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">{config.label}</p>
                      <p className="text-lg font-bold text-surface-900 dark:text-surface-100">
                        {formatPrice(amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Range */}
        <div className="flex gap-1 bg-surface-800 p-1 rounded-lg">
          {(["today", "week", "month", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? "bg-primary-500 text-white"
                  : "text-surface-400 hover:text-surface-100"
              }`}
            >
              {range === "today" ? t("payments.today") : range === "week" ? t("payments.week") : range === "month" ? t("payments.month") : t("payments.allTime")}
            </button>
          ))}
        </div>

        {/* Client Filter */}
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="select-field"
          aria-label="Filter by client"
        >
          <option value="">{t("payments.allClients")}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        {/* Method Filter */}
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="select-field"
          aria-label="Filter by payment method"
        >
          <option value="">{t("payments.allMethods")}</option>
          {Object.entries(methodConfig).map(([method, config]) => (
            <option key={method} value={method}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-surface-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-surface-300 mb-2">
              {t("payments.noPayments")}
            </h3>
            <p className="text-surface-500 mb-4">
              {selectedClientId || selectedMethod || dateRange !== "all"
                ? t("payments.noPaymentsDescFilter")
                : t("payments.noPaymentsDescEmpty")}
            </p>
            <Button onClick={handleOpenRecord}>
              <Plus className="h-4 w-4 mr-2" />
              {t("payments.recordPayment")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-700">
                <tr>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.dateColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.clientColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.orderColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.methodColumn")}
                  </th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.amountColumn")}
                  </th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("payments.actionsColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {payments.map((payment) => {
                  const config =
                    methodConfig[payment.method] || methodConfig.CASH;
                  const Icon = config.icon;
                  const amount =
                    typeof payment.amount === "string"
                      ? parseFloat(payment.amount)
                      : payment.amount;
                  const isVoid = amount < 0;

                  return (
                    <tr
                      key={payment.id}
                      className={`hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${
                        isVoid ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-surface-100">
                            {formatShortDate(payment.createdAt)}
                          </p>
                          <p className="text-xs text-surface-500">
                            {new Date(payment.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-surface-200">
                          {payment.client.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-surface-400">
                          {payment.order?.orderNumber || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-medium ${
                            isVoid ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {isVoid ? "" : "+"}
                          {formatPrice(amount)}
                        </span>
                        {payment.reference?.startsWith("VOID:") && (
                          <p className="text-xs text-red-400">{t("payments.voided")}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingPayment(payment)}
                            className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            title={t("payments.detailsTitle")}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isVoid &&
                            !payment.reference?.startsWith("VOID:") && (
                              <button
                                onClick={() => handleOpenVoid(payment)}
                                className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title={t("payments.voidTitle")}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <CardHeader>
              <CardTitle>{t("payments.recordTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {/* Client Selection */}
                <SearchableSelect
                  label={t("payments.clientLabel")}
                  placeholder={t("payments.selectClientPlaceholder")}
                  value={recordClientId}
                  onChange={(val) => handleRecordClientChange(val)}
                  options={clients.map((client) => ({
                    value: client.id,
                    label: client.name,
                    description:
                      client.currentDebt &&
                      parseFloat(String(client.currentDebt)) > 0
                        ? `${t("payments.debtLabel")} ${formatPrice(client.currentDebt)}`
                        : undefined,
                  }))}
                />

                {/* Client Debt Info */}
                {selectedRecordClient &&
                  parseFloat(String(selectedRecordClient.currentDebt || 0)) >
                    0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-400">
                        {t("payments.debtLabel")}{" "}
                        <span className="font-bold">
                          {formatPrice(selectedRecordClient.currentDebt)}
                        </span>
                      </p>
                    </div>
                  )}

                {/* Order Selection (Optional) */}
                {recordClientId && (
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1">
                      {t("payments.orderOptionalLabel")}
                    </label>
                    <select
                      value={recordOrderId}
                      onChange={(e) => handleRecordOrderChange(e.target.value)}
                      className="select-field w-full"
                      aria-label="Select order for payment"
                    >
                      <option value="">
                        {t("payments.generalPayment")}
                      </option>
                      {clientOrders.map((order) => {
                        const total =
                          typeof order.totalAmount === "string"
                            ? parseFloat(order.totalAmount)
                            : order.totalAmount;
                        const paid =
                          typeof order.paidAmount === "string"
                            ? parseFloat(order.paidAmount)
                            : order.paidAmount;
                        const remaining = total - paid;
                        return (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber} - {t("payments.orderRemaining", { amount: formatPrice(remaining) })}
                          </option>
                        );
                      })}
                    </select>
                    {clientOrders.length === 0 && (
                      <p className="text-xs text-surface-500 mt-1">
                        {t("payments.noUnpaidOrders")}
                      </p>
                    )}
                  </div>
                )}

                {/* Amount */}
                <Input
                  label={t("payments.amountLabel")}
                  type="number"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  min="0"
                  step="100"
                  placeholder={t("payments.amountPlaceholder")}
                />

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("payments.methodLabel")}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(methodConfig).map(([method, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setRecordMethod(method)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                            recordMethod === method
                              ? "border-primary-500 bg-primary-500/10 text-primary-400"
                              : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reference */}
                <Input
                  label={t("payments.referenceLabel")}
                  type="text"
                  value={recordReference}
                  onChange={(e) => setRecordReference(e.target.value)}
                  placeholder={t("payments.referencePlaceholder")}
                />

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("payments.notesLabel")}
                  </label>
                  <textarea
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    rows={2}
                    placeholder={t("payments.notesPlaceholder")}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsRecordModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || !recordClientId || !recordAmount}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("payments.recordButton")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Details Modal */}
      {viewingPayment && !isVoidModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("payments.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-surface-400">{t("payments.detailDate")}</span>
                  <span className="text-surface-100">
                    {formatDate(viewingPayment.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">{t("payments.detailClient")}</span>
                  <span className="text-surface-100">
                    {viewingPayment.client.name}
                  </span>
                </div>
                {viewingPayment.order && (
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("payments.detailOrder")}</span>
                    <span className="text-surface-100">
                      {viewingPayment.order.orderNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-400">{t("payments.detailMethod")}</span>
                  <span className="text-surface-100">
                    {methodConfig[viewingPayment.method]?.label ||
                      viewingPayment.method}
                  </span>
                </div>
                <div className="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-3">
                  <span className="text-surface-400">{t("payments.detailAmount")}</span>
                  <span
                    className={`text-xl font-bold ${
                      parseFloat(String(viewingPayment.amount)) < 0
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {parseFloat(String(viewingPayment.amount)) >= 0 ? "+" : ""}
                    {formatPrice(viewingPayment.amount)}
                  </span>
                </div>
                {viewingPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("payments.detailReference")}</span>
                    <span className="text-surface-100">
                      {viewingPayment.reference}
                    </span>
                  </div>
                )}
                {viewingPayment.notes && (
                  <div>
                    <span className="text-surface-400 block mb-1">{t("payments.detailNotes")}</span>
                    <p className="text-surface-200 bg-surface-800 p-2 rounded-lg text-sm">
                      {viewingPayment.notes}
                    </p>
                  </div>
                )}
                {viewingPayment.receivedBy && (
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("payments.detailReceivedBy")}</span>
                    <span className="text-surface-100 text-sm">
                      {viewingPayment.receivedBy.email}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setViewingPayment(null)}
                >
                  {t("common.close")}
                </Button>
                {parseFloat(String(viewingPayment.amount)) > 0 &&
                  !viewingPayment.reference?.startsWith("VOID:") && (
                    <Button
                      variant="secondary"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => handleOpenVoid(viewingPayment)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t("payments.voidButton")}
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Void Payment Modal */}
      {isVoidModalOpen && viewingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-400">{t("payments.voidTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVoidPayment} className="space-y-4">
                {voidError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {voidError}
                  </div>
                )}

                <div className="p-4 bg-surface-100 dark:bg-surface-800/50 rounded-lg">
                  <p className="text-surface-400 text-sm mb-2">
                    {t("payments.voidAbout")}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-surface-300">
                      {viewingPayment.client.name}
                    </span>
                    <span className="text-green-400 font-bold">
                      +{formatPrice(viewingPayment.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-2">
                    {t("payments.voidReversal")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("payments.voidReasonLabel")}
                  </label>
                  <textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    rows={3}
                    placeholder={t("payments.voidReasonPlaceholder")}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-red-500 resize-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setIsVoidModalOpen(false);
                      setViewingPayment(null);
                    }}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    disabled={isSubmitting || !voidReason.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("payments.voidSubmit")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
