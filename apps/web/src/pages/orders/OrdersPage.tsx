/**
 * Orders Page
 * List and manage orders
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Eye,
  Loader2,
  ShoppingCart,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  CreditCard,
  EyeOff,
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
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface OrderItem {
  id: string;
  quantityKg: number;
  pricePerKg: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  totalAmount: number | string;
  paidAmount: number | string;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  _count?: {
    items: number;
  };
}

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  basePricePerKg: number;
  currentStockKg: number | string;
}

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
 * Format weight with 2 decimal places
 */
function formatWeight(kg: number | string | null | undefined): string {
  if (kg === null || kg === undefined) return "0.00 kg";
  const num = typeof kg === "string" ? parseFloat(kg) : kg;
  if (isNaN(num)) return "0.00 kg";
  return num.toFixed(2) + " kg";
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "string" ? parseFloat(value) : value;
}

/**
 * Format date
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

export function OrdersPage() {
  const { t } = useTranslation();

  const statusConfig = {
    DRAFT: {
      label: t("orders.status.DRAFT"),
      icon: Clock,
      className: "bg-surface-700 text-surface-300",
    },
    CONFIRMED: {
      label: t("orders.status.CONFIRMED"),
      icon: CheckCircle,
      className: "bg-blue-500/20 text-blue-400",
    },
    COMPLETED: {
      label: t("orders.status.COMPLETED"),
      icon: CheckCircle,
      className: "bg-green-500/20 text-green-400",
    },
    CANCELLED: {
      label: t("orders.status.CANCELLED"),
      icon: XCircle,
      className: "bg-red-500/20 text-red-400",
    },
  };

  const paymentStatusConfig = {
    UNPAID: {
      label: t("orders.paymentStatus.UNPAID"),
      className: "text-red-400",
    },
    PARTIAL: {
      label: t("orders.paymentStatus.PARTIAL"),
      className: "text-amber-400",
    },
    PAID: {
      label: t("orders.paymentStatus.PAID"),
      className: "text-green-400",
    },
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<string>("");

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create order form
  const [selectedClientId, setSelectedClientId] = useState("");
  const [orderItems, setOrderItems] = useState<
    Array<{ productId: string; quantityKg: string; pricePerKg: string }>
  >([{ productId: "", quantityKg: "", pricePerKg: "" }]);
  const [orderNotes, setOrderNotes] = useState("");

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Stock visibility toggle (persisted in localStorage)
  const [showStockInOrders, setShowStockInOrders] = useState(() => {
    return localStorage.getItem("mirsklada_showStockInOrders") === "true";
  });

  const toggleStockVisibility = () => {
    setShowStockInOrders((prev) => {
      const next = !prev;
      localStorage.setItem("mirsklada_showStockInOrders", String(next));
      return next;
    });
  };

  const matchesActiveFilters = useCallback(
    (order: Order): boolean => {
      if (selectedStatus && order.status !== selectedStatus) {
        return false;
      }

      if (
        selectedPaymentStatus &&
        order.paymentStatus !== selectedPaymentStatus
      ) {
        return false;
      }

      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (!normalizedQuery) {
        return true;
      }

      return (
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.client.name.toLowerCase().includes(normalizedQuery)
      );
    },
    [selectedStatus, selectedPaymentStatus, searchQuery],
  );

  const applyFilters = useCallback(
    (items: Order[]): Order[] => {
      return items.filter(matchesActiveFilters);
    },
    [matchesActiveFilters],
  );

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedPaymentStatus)
        params.append("paymentStatus", selectedPaymentStatus);

      const response = await api.get(`/orders?${params.toString()}`);
      const ordersData = response.data.data || [];

      setOrders(applyFilters(ordersData));
      setError(null);
    } catch (err) {
      setError(t("orders.errorLoad"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedPaymentStatus, applyFilters]);

  // Fetch clients and products for order creation
  const fetchClientsAndProducts = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        api.get("/clients"),
        api.get("/products"),
      ]);
      setClients(clientsRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (err) {
      console.error("Failed to load clients/products:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchClientsAndProducts();
  }, []);

  // Reset create form
  const resetCreateForm = () => {
    setSelectedClientId("");
    setOrderItems([{ productId: "", quantityKg: "", pricePerKg: "" }]);
    setOrderNotes("");
    setFormError(null);
  };

  // Open create modal
  const handleCreate = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  // Add item row
  const addItemRow = () => {
    setOrderItems([
      ...orderItems,
      { productId: "", quantityKg: "", pricePerKg: "" },
    ]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].pricePerKg = product.basePricePerKg.toString();
      }
    }

    setOrderItems(newItems);
  };

  // Calculate total
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantityKg) || 0;
      const price = parseFloat(item.pricePerKg) || 0;
      return sum + qty * price;
    }, 0);
  };

  // Submit order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      setFormError(t("orders.selectClient"));
      return;
    }

    const validItems = orderItems.filter(
      (item) => item.productId && parseFloat(item.quantityKg) > 0,
    );

    if (validItems.length === 0) {
      setFormError(t("orders.addProductRequired"));
      return;
    }

    const payload = {
      clientId: selectedClientId,
      items: validItems.map((item) => ({
        productId: item.productId,
        quantityKg: parseFloat(item.quantityKg),
        pricePerKg: parseFloat(item.pricePerKg) || undefined,
      })),
      notes: orderNotes.trim() || undefined,
    };
    const previousOrders = orders;
    const selectedClient = clients.find(
      (client) => client.id === selectedClientId,
    );
    const optimisticId = `temp-order-${Date.now()}`;
    const optimisticItems: OrderItem[] = validItems.map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const quantityKg = parseFloat(item.quantityKg);
      const pricePerKg =
        parseFloat(item.pricePerKg) || product?.basePricePerKg || 0;

      return {
        id: `${optimisticId}-item-${index}`,
        quantityKg,
        pricePerKg,
        totalPrice: quantityKg * pricePerKg,
        product: {
          id: item.productId,
          name: product?.name || "Product",
        },
      };
    });
    const optimisticOrder: Order = {
      id: optimisticId,
      orderNumber: `NEW-${String(Date.now()).slice(-6)}`,
      status: "DRAFT",
      paymentStatus: "UNPAID",
      totalAmount: optimisticItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      ),
      paidAmount: 0,
      notes: orderNotes.trim() || null,
      createdAt: new Date().toISOString(),
      client: {
        id: selectedClientId,
        name: selectedClient?.name || "Unknown client",
      },
      items: optimisticItems,
      _count: {
        items: optimisticItems.length,
      },
    };

    setIsSubmitting(true);
    setFormError(null);
    setOrders((prevOrders) => applyFilters([optimisticOrder, ...prevOrders]));

    try {
      const response = await api.post("/orders", payload);
      const serverOrder = response?.data?.data as Partial<Order> | undefined;

      if (serverOrder) {
        const normalizedServerOrder: Order = {
          ...optimisticOrder,
          ...serverOrder,
          client: serverOrder.client || optimisticOrder.client,
          items: serverOrder.items || optimisticOrder.items,
          _count: serverOrder._count || {
            items: serverOrder.items?.length ?? optimisticOrder.items.length,
          },
        };

        setOrders((prevOrders) => {
          const nextOrders = prevOrders.map((order) =>
            order.id === optimisticId ? normalizedServerOrder : order,
          );
          return applyFilters(nextOrders);
        });
      } else {
        await fetchOrders();
      }

      setIsCreateModalOpen(false);
      resetCreateForm();
      toast.success(t("orders.created"));
    } catch (err: unknown) {
      setOrders(previousOrders);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("orders.errorCreate");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("orders.errorCreate"));
        toast.error(t("orders.errorCreate"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm order
  const handleConfirmOrder = async (orderId: string) => {
    const previousOrders = orders;
    const previousViewingOrder = viewingOrder;

    setOrders((prevOrders) => {
      const nextOrders: Order[] = prevOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        return {
          ...order,
          status: "CONFIRMED",
        };
      });
      return applyFilters(nextOrders);
    });
    setViewingOrder((prevOrder) =>
      prevOrder?.id === orderId
        ? { ...prevOrder, status: "CONFIRMED" as Order["status"] }
        : prevOrder,
    );

    try {
      const response = await api.post(`/orders/${orderId}/confirm`);
      const serverOrder = response?.data?.data as Partial<Order> | undefined;

      if (serverOrder) {
        setOrders((prevOrders) => {
          const nextOrders = prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  ...serverOrder,
                  client: serverOrder.client || order.client,
                  items: serverOrder.items || order.items,
                  _count: serverOrder._count || order._count,
                }
              : order,
          );
          return applyFilters(nextOrders);
        });

        setViewingOrder((prevOrder) => {
          if (!prevOrder || prevOrder.id !== orderId) {
            return prevOrder;
          }

          return {
            ...prevOrder,
            ...serverOrder,
            client: serverOrder.client || prevOrder.client,
            items: serverOrder.items || prevOrder.items,
            _count: serverOrder._count || prevOrder._count,
          } as Order;
        });
      }

      toast.success(t("orders.confirmed"));
    } catch (err: unknown) {
      setOrders(previousOrders);
      setViewingOrder(previousViewingOrder);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("orders.errorConfirm");
        setError(message);
        toast.error(message);
      } else {
        setError(t("orders.errorConfirm"));
        toast.error(t("orders.errorConfirm"));
      }
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    const previousOrders = orders;
    const previousViewingOrder = viewingOrder;

    setOrders((prevOrders) => {
      const nextOrders: Order[] = prevOrders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        return {
          ...order,
          status: "CANCELLED",
        };
      });
      return applyFilters(nextOrders);
    });
    setViewingOrder((prevOrder) =>
      prevOrder?.id === orderId
        ? { ...prevOrder, status: "CANCELLED" as Order["status"] }
        : prevOrder,
    );

    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success(t("orders.cancelled"));
      setViewingOrder(null);
    } catch (err: unknown) {
      setOrders(previousOrders);
      setViewingOrder(previousViewingOrder);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("orders.errorCancel");
        setError(message);
        toast.error(message);
      } else {
        setError(t("orders.errorCancel"));
        toast.error(t("orders.errorCancel"));
      }
    }
  };

  // Open payment modal
  const handleOpenPayment = (order: Order) => {
    setPayingOrder(order);
    const totalAmount =
      typeof order.totalAmount === "string"
        ? parseFloat(order.totalAmount)
        : order.totalAmount || 0;
    const paidAmount =
      typeof order.paidAmount === "string"
        ? parseFloat(order.paidAmount)
        : order.paidAmount || 0;
    const remaining = totalAmount - paidAmount;
    setPaymentAmount(remaining > 0 ? remaining.toString() : "");
    setPaymentMethod("CASH");
    setPaymentNotes("");
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  // Record payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payingOrder) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError(t("orders.invalidAmount"));
      return;
    }

    const orderToPay = payingOrder;
    const previousOrders = orders;
    const previousViewingOrder = viewingOrder;
    const previousPayingOrder = payingOrder;

    const totalAmount = toNumber(orderToPay.totalAmount);
    const paidAmount = toNumber(orderToPay.paidAmount);
    const nextPaidAmount = paidAmount + amount;
    const nextPaymentStatus: Order["paymentStatus"] =
      nextPaidAmount >= totalAmount
        ? "PAID"
        : nextPaidAmount > 0
          ? "PARTIAL"
          : "UNPAID";

    const patchOrderPaymentState = (order: Order): Order => {
      if (order.id !== orderToPay.id) {
        return order;
      }

      return {
        ...order,
        paidAmount: nextPaidAmount,
        paymentStatus: nextPaymentStatus,
      };
    };

    setIsSubmitting(true);
    setPaymentError(null);
    setOrders((prevOrders) =>
      applyFilters(prevOrders.map(patchOrderPaymentState)),
    );
    setViewingOrder((prevOrder) =>
      prevOrder?.id === orderToPay.id
        ? patchOrderPaymentState(prevOrder)
        : prevOrder,
    );
    setPayingOrder((prevOrder) =>
      prevOrder?.id === orderToPay.id
        ? patchOrderPaymentState(prevOrder)
        : prevOrder,
    );

    try {
      await api.post("/payments", {
        orderId: orderToPay.id,
        clientId: orderToPay.client.id,
        amount,
        method: paymentMethod,
        notes: paymentNotes.trim() || undefined,
      });

      setIsPaymentModalOpen(false);
      setPayingOrder(null);
      toast.success(t("orders.paymentRecorded"));
    } catch (err: unknown) {
      setOrders(previousOrders);
      setViewingOrder(previousViewingOrder);
      setPayingOrder(previousPayingOrder);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("orders.errorPayment");
        setPaymentError(message);
        toast.error(message);
      } else {
        setPaymentError(t("orders.errorPayment"));
        toast.error(t("orders.errorPayment"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {t("orders.title")}
          </h1>
          <p className="text-surface-400 mt-1">
            {t("orders.subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("orders.newOrder")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder={t("orders.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select-field"
            aria-label="Filter by order status"
          >
            <option value="">{t("orders.allStatus")}</option>
            <option value="DRAFT">{t("orders.status.DRAFT")}</option>
            <option value="CONFIRMED">{t("orders.status.CONFIRMED")}</option>
            <option value="COMPLETED">{t("orders.status.COMPLETED")}</option>
            <option value="CANCELLED">{t("orders.status.CANCELLED")}</option>
          </select>
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="select-field"
            aria-label="Filter by payment status"
          >
            <option value="">{t("orders.allPayments")}</option>
            <option value="UNPAID">{t("orders.paymentStatus.UNPAID")}</option>
            <option value="PARTIAL">{t("orders.paymentStatus.PARTIAL")}</option>
            <option value="PAID">{t("orders.paymentStatus.PAID")}</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-200 mb-2">
                {t("orders.noOrders")}
              </h3>
              <p className="text-surface-400 mb-4">
                {t("orders.noOrdersDesc")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t("orders.createOrder")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("orders.allOrders", { count: orders.length })}
              {isLoading && (
                <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.orderColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.clientColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.statusColumn")}
                  </th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.totalColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.paymentColumn")}
                  </th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.dateColumn")}
                  </th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                    {t("orders.actionsColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
                      onClick={() => setViewingOrder(order)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-surface-300">
                          {order.client.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${statusConfig[order.status].className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm ${paymentStatusConfig[order.paymentStatus].className}`}
                        >
                          {paymentStatusConfig[order.paymentStatus].label}
                        </span>
                        {order.paymentStatus === "PARTIAL" && (
                          <p className="text-xs text-surface-500">
                            {t("orders.paid")}: {formatPrice(order.paidAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-500 dark:text-surface-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.paymentStatus !== "PAID" &&
                            order.status !== "CANCELLED" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPayment(order);
                                }}
                                className="p-2 text-surface-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title={t("orders.recordPayment")}
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrder(order);
                            }}
                            className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            title={t("orders.viewDetails")}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader>
              <CardTitle>{t("orders.createOrder")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {/* Client Selection */}
                <SearchableSelect
                  label={t("orders.clientLabel")}
                  placeholder={t("orders.selectClientPlaceholder")}
                  value={selectedClientId}
                  onChange={(val) => setSelectedClientId(val)}
                  options={clients.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />

                {/* Order Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-surface-300">
                      {t("orders.productsLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={toggleStockVisibility}
                      className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors"
                      title={showStockInOrders ? t("orders.hideStock") : t("orders.showStock")}
                    >
                      {showStockInOrders ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {showStockInOrders ? t("orders.hideStock") : t("orders.showStock")}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-end p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="block text-xs text-surface-500 mb-1">
                            {t("orders.productLabel")}
                          </label>
                          <SearchableSelect
                            placeholder="Search products..."
                            value={item.productId}
                            onChange={(val) =>
                              updateItem(index, "productId", val)
                            }
                            options={products.map((product) => ({
                              value: product.id,
                              label: product.name,
                              description: showStockInOrders
                                ? t("orders.inStock", { amount: formatWeight(product.currentStockKg) })
                                : undefined,
                            }))}
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-surface-500 mb-1">
                            {t("orders.qtyLabel")}
                          </label>
                          <input
                            type="number"
                            value={item.quantityKg}
                            onChange={(e) =>
                              updateItem(index, "quantityKg", e.target.value)
                            }
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:border-primary-500"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-surface-500 mb-1">
                            {t("orders.priceLabel")}
                          </label>
                          <input
                            type="number"
                            value={item.pricePerKg}
                            onChange={(e) =>
                              updateItem(index, "pricePerKg", e.target.value)
                            }
                            min="0"
                            step="100"
                            placeholder="Price"
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:border-primary-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          disabled={orderItems.length === 1}
                          className="px-3 py-2 text-surface-400 hover:text-red-400 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addItemRow}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("orders.addProduct")}
                  </Button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("orders.notesLabel")}
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    placeholder={t("orders.notesPlaceholder")}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-3 border-t border-surface-200 dark:border-surface-700">
                  <span className="text-surface-400">{t("orders.totalLabel")}</span>
                  <span className="text-xl font-bold text-surface-900 dark:text-surface-100">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("orders.createOrder")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("orders.orderLabel")} {viewingOrder.orderNumber}</CardTitle>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${statusConfig[viewingOrder.status].className}`}
                >
                  {statusConfig[viewingOrder.status].label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Info */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("orders.clientColumn")}
                  </p>
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {viewingOrder.client.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("orders.dateColumn")}
                  </p>
                  <p className="text-surface-300">
                    {formatDate(viewingOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                  {t("orders.orderDetailItems")}
                </p>
                <div className="space-y-2">
                  {viewingOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-surface-500" />
                        <div>
                          <p className="font-medium text-surface-900 dark:text-surface-100">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            {formatWeight(item.quantityKg)} ×{" "}
                            {formatPrice(item.pricePerKg)}/kg
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment */}
              <div className="flex justify-between items-center py-3 border-t border-surface-200 dark:border-surface-700">
                <div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("orders.orderDetailPayStatus")}
                  </p>
                  <p
                    className={`font-medium ${paymentStatusConfig[viewingOrder.paymentStatus].className}`}
                  >
                    {paymentStatusConfig[viewingOrder.paymentStatus].label}
                    {viewingOrder.paymentStatus !== "PAID" && (
                      <span className="text-surface-500 ml-2">
                        ({t("orders.paid")}: {formatPrice(viewingOrder.paidAmount)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("orders.orderDetailTotal")}
                  </p>
                  <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                    {formatPrice(viewingOrder.totalAmount)}
                  </p>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg">
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("orders.orderDetailNotes")}
                  </p>
                  <p className="text-surface-300">{viewingOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setViewingOrder(null)}
                >
                  {t("common.close")}
                </Button>
                {viewingOrder.paymentStatus !== "PAID" &&
                  viewingOrder.status !== "CANCELLED" && (
                    <Button
                      variant="primary"
                      onClick={() => handleOpenPayment(viewingOrder)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t("orders.recordPayment")}
                    </Button>
                  )}
                {viewingOrder.status === "DRAFT" && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleCancelOrder(viewingOrder.id)}
                    >
                      {t("orders.cancelOrder")}
                    </Button>
                    <Button onClick={() => handleConfirmOrder(viewingOrder.id)}>
                      {t("orders.confirmOrder")}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && payingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("orders.recordPayment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                {paymentError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {paymentError}
                  </div>
                )}

                {/* Order Info */}
                <div className="p-3 bg-surface-100 dark:bg-surface-800/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("orders.paymentOrderLabel")}</span>
                    <span className="text-surface-100 font-medium">
                      {payingOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("orders.paymentClientLabel")}</span>
                    <span className="text-surface-100">
                      {payingOrder.client.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("orders.paymentTotalLabel")}</span>
                    <span className="text-surface-100">
                      {formatPrice(payingOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">{t("orders.paymentPaidLabel")}</span>
                    <span className="text-green-400">
                      {formatPrice(payingOrder.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-2">
                    <span className="text-surface-400">{t("orders.paymentRemainingLabel")}</span>
                    <span className="text-amber-400 font-medium">
                      {formatPrice(
                        (typeof payingOrder.totalAmount === "string"
                          ? parseFloat(payingOrder.totalAmount)
                          : payingOrder.totalAmount || 0) -
                          (typeof payingOrder.paidAmount === "string"
                            ? parseFloat(payingOrder.paidAmount)
                            : payingOrder.paidAmount || 0),
                      )}
                    </span>
                  </div>
                </div>

                <Input
                  label={t("orders.amountLabel")}
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="100"
                  placeholder={t("orders.amountPlaceholder")}
                  autoFocus
                />

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("orders.methodLabel")}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="select-field w-full"
                    aria-label="Select payment method"
                  >
                    <option value="CASH">{t("payments.methods.CASH")}</option>
                    <option value="CARD">{t("payments.methods.CARD")}</option>
                    <option value="TRANSFER">{t("payments.methods.TRANSFER")}</option>
                    <option value="CLICK">{t("payments.methods.CLICK")}</option>
                    <option value="PAYME">{t("payments.methods.PAYME")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("orders.paymentNotesLabel")}
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    placeholder={t("orders.paymentNotesPlaceholder")}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setPayingOrder(null);
                    }}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("orders.recordPayment")
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
