/**
 * Stock Management Page
 * Record stock movements (IN/OUT/ADJUST) and view history
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Minus,
  RefreshCw,
  Loader2,
  Package,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Filter,
  TrendingDown,
  AlertTriangle,
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

interface Product {
  id: string;
  name: string;
  unit: string;
  currentStockKg: number | string;
  minStockKg: number | string;
  category?: { id: string; name: string } | null;
}

interface StockMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantityKg: number | string;
  balanceAfterKg: number | string;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    unit: string;
  };
  performedBy?: {
    id: string;
    email: string;
  } | null;
}

interface StockMovementRecordResponse {
  movement?: StockMovement;
  product?: {
    id: string;
    currentStockKg: number | string;
  };
}

/**
 * Format weight with 2 decimal places
 */
function formatWeight(kg: number | string): string {
  const num = typeof kg === "string" ? parseFloat(kg) : kg;
  return num.toFixed(2) + " kg";
}

function toNumber(value: number | string): number {
  return typeof value === "string" ? parseFloat(value) : value;
}

/**
 * Format date
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockPage() {
  const { t } = useTranslation();

  const movementTypeConfig = {
    IN: {
      label: t("stock.typeIn"),
      icon: ArrowUpCircle,
      className: "text-green-400 bg-green-500/10",
      sign: "+",
    },
    OUT: {
      label: t("stock.typeOut"),
      icon: ArrowDownCircle,
      className: "text-red-400 bg-red-500/10",
      sign: "-",
    },
    ADJUST: {
      label: t("stock.typeAdjust"),
      icon: RefreshCw,
      className: "text-blue-400 bg-blue-500/10",
      sign: "±",
    },
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<"levels" | "movements">("levels");

  // Stock levels state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  // Movements state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [movementFilter, setMovementFilter] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUST">(
    "IN",
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // General error
  const [error, setError] = useState<string | null>(null);

  const shouldIncludeMovementForFilter = (type: StockMovement["type"]) => {
    return !movementFilter || movementFilter === type;
  };

  // Fetch products for stock levels
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await api.get("/products");
      setProducts(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(t("stock.errorLoad"));
      console.error(err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch stock movements
  const fetchMovements = useCallback(async () => {
    try {
      setIsLoadingMovements(true);
      const params = new URLSearchParams();
      if (movementFilter) params.append("type", movementFilter);

      const response = await api.get(`/stock/movements?${params.toString()}`);
      setMovements(response.data.data || []);
    } catch (err) {
      console.error("Failed to load movements:", err);
    } finally {
      setIsLoadingMovements(false);
    }
  }, [movementFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === "movements") {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Filter products by search and low stock
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(productSearch.toLowerCase());
    const currentStock =
      typeof product.currentStockKg === "string"
        ? parseFloat(product.currentStockKg)
        : product.currentStockKg;
    const minStock =
      typeof product.minStockKg === "string"
        ? parseFloat(product.minStockKg)
        : product.minStockKg;
    const isLow = currentStock <= minStock && minStock > 0;

    if (showLowStock) {
      return matchesSearch && isLow;
    }
    return matchesSearch;
  });

  // Open modal for specific movement type
  const openModal = (type: "IN" | "OUT" | "ADJUST", productId?: string) => {
    setMovementType(type);
    setSelectedProductId(productId || "");
    setQuantity("");
    setReason("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit stock movement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      setFormError(t("stock.selectProduct"));
      return;
    }

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setFormError(t("stock.invalidQuantity"));
      return;
    }

    const productToUpdate = products.find(
      (product) => product.id === selectedProductId,
    );

    if (!productToUpdate) {
      setFormError(t("stock.productNotFound"));
      return;
    }

    const currentStock = toNumber(productToUpdate.currentStockKg);
    let nextStock = currentStock;
    let movementQuantity = qty;

    if (movementType === "IN") {
      nextStock = currentStock + qty;
      movementQuantity = qty;
    } else if (movementType === "OUT") {
      if (qty > currentStock) {
        setFormError(
          t("stock.insufficientStock", { available: formatWeight(currentStock) }),
        );
        return;
      }

      nextStock = currentStock - qty;
      movementQuantity = -qty;
    } else {
      nextStock = qty;
      movementQuantity = qty - currentStock;
    }

    const optimisticMovement: StockMovement = {
      id: `temp-movement-${Date.now()}`,
      type: movementType,
      quantityKg: movementQuantity,
      balanceAfterKg: nextStock,
      reason: reason.trim() || null,
      reference: null,
      createdAt: new Date().toISOString(),
      product: {
        id: productToUpdate.id,
        name: productToUpdate.name,
        unit: productToUpdate.unit,
      },
      performedBy: null,
    };
    const previousProducts = products;
    const previousMovements = movements;

    setIsSubmitting(true);
    setFormError(null);
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === selectedProductId
          ? { ...product, currentStockKg: nextStock }
          : product,
      ),
    );

    if (
      activeTab === "movements" &&
      shouldIncludeMovementForFilter(movementType)
    ) {
      setMovements((prevMovements) => [optimisticMovement, ...prevMovements]);
    }

    try {
      const response = await api.post("/stock/movements", {
        productId: selectedProductId,
        type: movementType,
        quantityKg: qty,
        reason: reason.trim() || undefined,
      });

      const result = response?.data?.data as
        | StockMovementRecordResponse
        | undefined;

      if (result?.product) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === result.product?.id
              ? { ...product, currentStockKg: result.product.currentStockKg }
              : product,
          ),
        );
      }

      if (
        activeTab === "movements" &&
        shouldIncludeMovementForFilter(movementType)
      ) {
        if (result?.movement) {
          setMovements((prevMovements) =>
            prevMovements.map((movement) =>
              movement.id === optimisticMovement.id
                ? result.movement!
                : movement,
            ),
          );
        }
      }

      setIsModalOpen(false);
      toast.success(t("stock.movementRecorded"));
    } catch (err: unknown) {
      setProducts(previousProducts);
      setMovements(previousMovements);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("stock.errorRecord");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("stock.errorRecord"));
        toast.error(t("stock.errorRecord"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected product details
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Calculate stats
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => {
    const current =
      typeof p.currentStockKg === "string"
        ? parseFloat(p.currentStockKg)
        : p.currentStockKg;
    const min =
      typeof p.minStockKg === "string"
        ? parseFloat(p.minStockKg)
        : p.minStockKg;
    return current <= min && min > 0;
  }).length;
  const outOfStockCount = products.filter((p) => {
    const current =
      typeof p.currentStockKg === "string"
        ? parseFloat(p.currentStockKg)
        : p.currentStockKg;
    return current <= 0;
  }).length;

  if (isLoadingProducts && products.length === 0) {
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
            {t("stock.title")}
          </h1>
          <p className="text-surface-400 mt-1">
            {t("stock.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openModal("OUT")}>
            <Minus className="h-4 w-4 mr-2" />
            {t("stock.stockOut")}
          </Button>
          <Button onClick={() => openModal("IN")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("stock.stockIn")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <Package className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {totalProducts}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t("stock.totalProducts")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingDown className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {lowStockCount}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t("stock.lowStock")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {outOfStockCount}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t("stock.outOfStock")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("levels")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "levels"
              ? "bg-primary-600 text-white"
              : "text-surface-400 hover:text-surface-100"
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          {t("stock.tabLevels")}
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "movements"
              ? "bg-primary-600 text-white"
              : "text-surface-400 hover:text-surface-100"
          }`}
        >
          <History className="h-4 w-4 inline mr-2" />
          {t("stock.tabMovements")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Stock Levels Tab */}
      {activeTab === "levels" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
              <input
                type="text"
                placeholder={t("stock.searchPlaceholder")}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <Button
              variant={showLowStock ? "primary" : "secondary"}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("stock.lowStockOnly")}
            </Button>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-surface-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-surface-200 mb-2">
                    {showLowStock ? t("stock.noLowStock") : t("stock.noProducts")}
                  </h3>
                  <p className="text-surface-400">
                    {showLowStock
                      ? t("stock.noLowStockDesc")
                      : t("stock.noProductsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("stock.stockLevels", { count: filteredProducts.length })}
                  {isLoadingProducts && (
                    <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-800">
                      <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                        {t("stock.productColumn")}
                      </th>
                      <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                        {t("stock.categoryColumn")}
                      </th>
                      <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                        {t("stock.currentStockColumn")}
                      </th>
                      <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                        {t("stock.minLevelColumn")}
                      </th>
                      <th className="text-center text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">
                        {t("stock.actionsColumn")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                    {filteredProducts.map((product) => {
                      const currentStock =
                        typeof product.currentStockKg === "string"
                          ? parseFloat(product.currentStockKg)
                          : product.currentStockKg;
                      const minStock =
                        typeof product.minStockKg === "string"
                          ? parseFloat(product.minStockKg)
                          : product.minStockKg;
                      const isLow = currentStock <= minStock && minStock > 0;
                      const isOut = currentStock <= 0;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isOut
                                    ? "bg-red-500/10"
                                    : isLow
                                      ? "bg-amber-500/10"
                                      : "bg-surface-700"
                                }`}
                              >
                                <Package
                                  className={`h-5 w-5 ${
                                    isOut
                                      ? "text-red-400"
                                      : isLow
                                        ? "text-amber-400"
                                        : "text-surface-400"
                                  }`}
                                />
                              </div>
                              <span className="font-medium text-surface-900 dark:text-surface-100">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {product.category ? (
                              <span className="px-2 py-1 text-xs font-medium bg-surface-700 text-surface-300 rounded">
                                {product.category.name}
                              </span>
                            ) : (
                              <span className="text-surface-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isOut && (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              )}
                              {isLow && !isOut && (
                                <TrendingDown className="h-4 w-4 text-amber-400" />
                              )}
                              <span
                                className={`font-medium ${
                                  isOut
                                    ? "text-red-400"
                                    : isLow
                                      ? "text-amber-400"
                                      : "text-surface-100"
                                }`}
                              >
                                {formatWeight(currentStock)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-surface-400">
                            {minStock > 0 ? formatWeight(minStock) : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openModal("IN", product.id)}
                                className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title={t("stock.stockIn")}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openModal("OUT", product.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title={t("stock.stockOut")}
                                disabled={isOut}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openModal("ADJUST", product.id)}
                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title={t("stock.typeAdjust")}
                              >
                                <RefreshCw className="h-4 w-4" />
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
        </>
      )}

      {/* Movements Tab */}
      {activeTab === "movements" && (
        <>
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="select-field"
              aria-label="Filter stock movements by type"
            >
              <option value="">{t("stock.allTypes")}</option>
              <option value="IN">{t("stock.typeIn")}</option>
              <option value="OUT">{t("stock.typeOut")}</option>
              <option value="ADJUST">{t("stock.typeAdjust")}</option>
            </select>
            <Button variant="secondary" onClick={fetchMovements}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoadingMovements ? "animate-spin" : ""}`}
              />
              {t("stock.refresh")}
            </Button>
          </div>

          {/* Movements List */}
          {movements.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <History className="h-12 w-12 text-surface-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-surface-200 mb-2">
                    {t("stock.noMovements")}
                  </h3>
                  <p className="text-surface-400">
                    {t("stock.noMovementsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("stock.recentMovements", { count: movements.length })}
                  {isLoadingMovements && (
                    <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-surface-200 dark:divide-surface-800">
                  {movements.map((movement) => {
                    const config = movementTypeConfig[movement.type];
                    const Icon = config.icon;
                    const qty =
                      typeof movement.quantityKg === "string"
                        ? parseFloat(movement.quantityKg)
                        : movement.quantityKg;

                    return (
                      <div
                        key={movement.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${config.className}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-surface-900 dark:text-surface-100">
                              {movement.product.name}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                movement.type === "IN"
                                  ? "text-green-400"
                                  : movement.type === "OUT"
                                    ? "text-red-400"
                                    : "text-blue-400"
                              }`}
                            >
                              {config.sign}
                              {formatWeight(Math.abs(qty))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                            <span>{config.label}</span>
                            {movement.reason && (
                              <>
                                <span>•</span>
                                <span>{movement.reason}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-surface-300">
                            {t("stock.balance", { value: formatWeight(movement.balanceAfterKg) })}
                          </p>
                          <p className="text-xs text-surface-500">
                            {formatDate(movement.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Stock Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {movementType === "IN" && (
                  <>
                    <ArrowUpCircle className="h-5 w-5 text-green-400" />
                    {t("stock.recordStockIn")}
                  </>
                )}
                {movementType === "OUT" && (
                  <>
                    <ArrowDownCircle className="h-5 w-5 text-red-400" />
                    {t("stock.recordStockOut")}
                  </>
                )}
                {movementType === "ADJUST" && (
                  <>
                    <RefreshCw className="h-5 w-5 text-blue-400" />
                    {t("stock.adjustStockLevel")}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {/* Product Selection */}
                <SearchableSelect
                  label={t("stock.productLabel")}
                  placeholder={t("stock.searchPlaceholder")}
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.name,
                    description: `${t("stock.currentStockColumn")}: ${formatWeight(product.currentStockKg)}`,
                  }))}
                />

                {/* Current Stock Display */}
                {selectedProduct && (
                  <div className="p-3 rounded-lg bg-surface-800 border border-surface-700">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t("stock.currentStockColumn")}
                    </p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                      {formatWeight(selectedProduct.currentStockKg)}
                    </p>
                  </div>
                )}

                {/* Quantity */}
                <Input
                  label={
                    movementType === "ADJUST"
                      ? t("stock.newStockLevelLabel", { unit: "kg" })
                      : t("stock.quantityLabel", { unit: "kg" })
                  }
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                />

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("stock.reasonLabel")}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      movementType === "IN"
                        ? t("stock.reasonInPlaceholder")
                        : movementType === "OUT"
                          ? t("stock.reasonOutPlaceholder")
                          : t("stock.reasonAdjustPlaceholder")
                    }
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {/* Preview */}
                {selectedProduct && quantity && parseFloat(quantity) > 0 && (
                  <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">
                      {t("stock.afterMovement")}
                    </p>
                    <p className="text-lg font-semibold text-primary-400">
                      {(() => {
                        const current =
                          typeof selectedProduct.currentStockKg === "string"
                            ? parseFloat(selectedProduct.currentStockKg)
                            : selectedProduct.currentStockKg;
                        const qty = parseFloat(quantity);
                        let newStock = 0;

                        if (movementType === "IN") newStock = current + qty;
                        else if (movementType === "OUT")
                          newStock = Math.max(0, current - qty);
                        else newStock = qty;

                        return formatWeight(newStock);
                      })()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
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
                      t("stock.recordMovement")
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
