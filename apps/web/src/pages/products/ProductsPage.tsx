/**
 * Products Page
 * List and manage products with weight-based pricing
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Search,
  AlertTriangle,
  Filter,
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

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  basePricePerKg: number | string;
  currentStockKg: number | string;
  minStockKg: number | string;
  isActive: boolean;
  category: Category | null;
}

interface ProductPayload {
  categoryId?: string;
  name: string;
  description?: string;
  unit: string;
  basePricePerKg: number;
  currentStockKg: number;
  minStockKg: number;
}

/**
 * Format price with thousand separators (Uzbek format)
 */
function formatPrice(amount: number | string, unit?: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const unitLabel = unit === "pcs" ? "/pc" : unit === "g" ? "/g" : "/kg";
  return new Intl.NumberFormat("uz-UZ").format(num) + " UZS" + unitLabel;
}

/**
 * Format stock amount with appropriate unit
 */
function formatStock(amount: number | string, unit: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (unit === "pcs") {
    return num.toFixed(0) + " pcs";
  }
  return num.toFixed(2) + " " + unit;
}

function toNumber(value: number | string): number {
  return typeof value === "string" ? parseFloat(value) : value;
}

export function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    unit: "kg",
    basePricePerKg: "",
    currentStockKg: "",
    minStockKg: "",
  });

  // Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const getCategoryById = (categoryId?: string): Category | null => {
    if (!categoryId) return null;
    return categories.find((category) => category.id === categoryId) ?? null;
  };

  const matchesActiveFilters = (product: Product): boolean => {
    if (selectedCategory && product.category?.id !== selectedCategory) {
      return false;
    }

    if (showLowStock) {
      const currentStock = toNumber(product.currentStockKg);
      const minStock = toNumber(product.minStockKg);
      if (!(currentStock <= minStock && minStock > 0)) {
        return false;
      }
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    const searchableValue = `${product.name} ${product.description ?? ""}`
      .trim()
      .toLowerCase();
    return searchableValue.includes(normalizedQuery);
  };

  const applyFilters = (items: Product[]): Product[] => {
    return items.filter(matchesActiveFilters);
  };

  const buildPayload = (): ProductPayload => {
    const payload: ProductPayload = {
      name: formData.name.trim(),
      unit: formData.unit,
      basePricePerKg: parseFloat(formData.basePricePerKg),
      currentStockKg: parseFloat(formData.currentStockKg) || 0,
      minStockKg: parseFloat(formData.minStockKg) || 0,
    };

    if (formData.description.trim()) {
      payload.description = formData.description.trim();
    }

    if (formData.categoryId) {
      payload.categoryId = formData.categoryId;
    }

    return payload;
  };

  const toOptimisticProduct = (
    payload: ProductPayload,
    id: string,
    currentStockKgOverride?: number | string,
  ): Product => {
    return {
      id,
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit,
      basePricePerKg: payload.basePricePerKg,
      currentStockKg: currentStockKgOverride ?? payload.currentStockKg,
      minStockKg: payload.minStockKg,
      isActive: true,
      category: getCategoryById(payload.categoryId),
    };
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (showLowStock) params.append("lowStock", "true");

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(t("products.errorLoad"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, showLowStock]);

  // Fetch categories for filter and form
  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      unit: "kg",
      basePricePerKg: "",
      currentStockKg: "",
      minStockKg: "",
    });
    setFormError(null);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingProduct(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      categoryId: product.category?.id || "",
      unit: product.unit,
      basePricePerKg: product.basePricePerKg.toString(),
      currentStockKg: product.currentStockKg.toString(),
      minStockKg: product.minStockKg.toString(),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError(t("products.nameRequired"));
      return;
    }

    if (!formData.basePricePerKg || parseFloat(formData.basePricePerKg) <= 0) {
      setFormError(t("products.priceRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = buildPayload();
    const previousProducts = products;

    const optimisticId = editingProduct
      ? editingProduct.id
      : `temp-product-${Date.now()}`;

    const optimisticProduct = toOptimisticProduct(
      payload,
      optimisticId,
      editingProduct?.currentStockKg,
    );

    setProducts((prevProducts) => {
      const nextProducts = editingProduct
        ? prevProducts.map((product) =>
            product.id === editingProduct.id ? optimisticProduct : product,
          )
        : [optimisticProduct, ...prevProducts];

      return applyFilters(nextProducts);
    });

    try {
      const response = editingProduct
        ? await api.patch(`/products/${editingProduct.id}`, payload)
        : await api.post("/products", payload);

      const serverProduct = response?.data?.data as Product | undefined;

      if (serverProduct) {
        setProducts((prevProducts) => {
          const nextProducts = editingProduct
            ? prevProducts.map((product) =>
                product.id === editingProduct.id ? serverProduct : product,
              )
            : prevProducts.map((product) =>
                product.id === optimisticId ? serverProduct : product,
              );

          return applyFilters(nextProducts);
        });
      } else {
        await fetchProducts();
      }

      setEditingProduct(null);
      resetForm();
      setIsModalOpen(false);
      toast.success(editingProduct ? t("products.updated") : t("products.created"));
    } catch (err: unknown) {
      setProducts(previousProducts);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("products.errorSave");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("products.errorSave"));
        toast.error(t("products.errorSave"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!deletingProduct) return;

    const productToDelete = deletingProduct;
    const previousProducts = products;

    setIsSubmitting(true);
    setDeletingProduct(null);
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productToDelete.id),
    );

    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success(t("products.deleted"));
    } catch (err: unknown) {
      setProducts(previousProducts);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("products.errorDelete");
        setError(message);
        toast.error(message);
      } else {
        setError(t("products.errorDelete"));
        toast.error(t("products.errorDelete"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && products.length === 0) {
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t("products.title")}</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t("products.subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("products.addProduct")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder={t("products.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select-field"
            aria-label="Filter by category"
          >
            <option value="">{t("products.allCategories")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button
            variant={showLowStock ? "primary" : "secondary"}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("products.lowStockFilter")}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-surface-400 dark:text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
                {t("products.noProducts")}
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-4">
                {t("products.noProductsDesc")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t("products.addProduct")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("products.allProducts", { count: products.length })}
              {isLoading && (
                <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("products.productColumn")}</th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("products.categoryColumn")}</th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("products.priceColumn")}</th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("products.stockColumn")}</th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("products.actionsColumn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {products.map((product) => {
                  const currentStock =
                    typeof product.currentStockKg === "string"
                      ? parseFloat(product.currentStockKg)
                      : product.currentStockKg;
                  const minStock =
                    typeof product.minStockKg === "string"
                      ? parseFloat(product.minStockKg)
                      : product.minStockKg;
                  const isLowStock = currentStock <= minStock && minStock > 0;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                            <Package className="h-5 w-5 text-surface-500 dark:text-surface-400" />
                          </div>
                          <div>
                            <p className="font-medium text-surface-900 dark:text-surface-100">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-sm text-surface-400 dark:text-surface-500 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="px-2 py-1 text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded">
                            {product.category.name}
                          </span>
                        ) : (
                            <span className="text-surface-400 dark:text-surface-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {formatPrice(product.basePricePerKg, product.unit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span
                            className={
                              isLowStock
                                ? "text-amber-400 font-medium"
                                : "text-surface-700 dark:text-surface-300"
                            }
                          >
                            {formatStock(product.currentStockKg, product.unit)}
                          </span>
                        </div>
                        {minStock > 0 && (
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                            {t("products.minLabel", { value: formatStock(product.minStockKg, product.unit) })}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            title={t("products.editProduct")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={t("products.deleteTitle")}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <CardHeader>
              <CardTitle>
                {editingProduct ? t("products.editProduct") : t("products.addProduct")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                <Input
                  label={t("products.nameLabel")}
                  name="name"
                  placeholder="e.g., Atlantic Salmon"
                  value={formData.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                    {t("products.descriptionLabel")}
                  </label>
                  <textarea
                    name="description"
                    placeholder={t("products.descriptionPlaceholder")}
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <SearchableSelect
                  label={t("products.categoryLabel")}
                  placeholder={t("products.selectCategoryPlaceholder")}
                  value={formData.categoryId}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, categoryId: val }))
                  }
                  options={[
                    { value: "", label: t("products.noCategoryOption") },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                      {t("products.unitLabel")}
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="select-field w-full"
                      aria-label="Product unit"
                    >
                      <option value="kg">{t("products.unitKg")}</option>
                      <option value="g">{t("products.unitG")}</option>
                      <option value="pcs">{t("products.unitPcs")}</option>
                    </select>
                  </div>

                  <Input
                    label={formData.unit === "kg" ? t("products.priceKgLabel") : formData.unit === "g" ? t("products.priceGLabel") : t("products.pricePcsLabel")}
                    name="basePricePerKg"
                    type="number"
                    placeholder="e.g., 85000"
                    value={formData.basePricePerKg}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {editingProduct ? (
                    <div>
                      <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                        {t("products.currentStockLabel", { unit: formData.unit })}
                      </label>
                      <div className="px-3 py-2 bg-surface-100 dark:bg-surface-700/50 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-500 dark:text-surface-400">
                        {formData.currentStockKg || "0"} {formData.unit}
                      </div>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                        {t("products.stockManagementNote")}
                      </p>
                    </div>
                  ) : (
                    <Input
                      label={t("products.currentStockLabel", { unit: formData.unit })}
                      name="currentStockKg"
                      type="number"
                      placeholder="0.00"
                      value={formData.currentStockKg}
                      onChange={handleInputChange}
                      min="0"
                      step={formData.unit === "pcs" ? "1" : "0.01"}
                    />
                  )}

                  <Input
                    label={t("products.minStockLabel", { unit: formData.unit })}
                    name="minStockKg"
                    type="number"
                    placeholder="0.00"
                    value={formData.minStockKg}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.unit === "pcs" ? "1" : "0.01"}
                  />
                </div>

                <p className="text-xs text-surface-400 dark:text-surface-500">
                  {t("products.lowStockNote")}
                </p>

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
                    ) : editingProduct ? (
                      t("products.saveChanges")
                    ) : (
                      t("products.addProduct")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("products.deleteTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-surface-600 dark:text-surface-300">
                {t("products.deleteConfirmText")}{" "}
                <span className="font-medium text-surface-900 dark:text-surface-100">
                  {deletingProduct.name}
                </span>
                ? {t("products.deleteCannotUndo")}
              </p>

              {parseFloat(String(deletingProduct.currentStockKg)) > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("products.stockWarning", { stock: formatStock(deletingProduct.currentStockKg, deletingProduct.unit) })}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingProduct(null)}
                  disabled={isSubmitting}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("common.delete")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
