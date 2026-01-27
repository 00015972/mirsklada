/**
 * Products Page
 * List and manage products with weight-based pricing
 */
import { useState, useEffect } from "react";
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
} from "@/components/ui";
import { api } from "@/lib/api";

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

/**
 * Format price with thousand separators (Uzbek format)
 */
function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("uz-UZ").format(num) + " UZS";
}

/**
 * Format weight with 2 decimal places
 */
function formatWeight(kg: number | string): string {
  const num = typeof kg === "string" ? parseFloat(kg) : kg;
  return num.toFixed(2) + " kg";
}

export function ProductsPage() {
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

  // Fetch products
  const fetchProducts = async () => {
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
      setError("Failed to load products");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
  }, [searchQuery, selectedCategory, showLowStock]);

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
      setFormError("Product name is required");
      return;
    }

    if (!formData.basePricePerKg || parseFloat(formData.basePricePerKg) <= 0) {
      setFormError("Valid price is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        unit: formData.unit,
        basePricePerKg: parseFloat(formData.basePricePerKg),
        currentStockKg: parseFloat(formData.currentStockKg) || 0,
        minStockKg: parseFloat(formData.minStockKg) || 0,
      };

      // Only include optional fields if they have values
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.categoryId) {
        payload.categoryId = formData.categoryId;
      }

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setFormError(
          axiosError.response?.data?.message || "Failed to save product",
        );
      } else {
        setFormError("Failed to save product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!deletingProduct) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || "Failed to delete product",
        );
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
          <h1 className="text-2xl font-bold text-surface-100">Products</h1>
          <p className="text-surface-400 mt-1">
            Manage your inventory products with weight-based pricing
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Categories</option>
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
            Low Stock
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
              <Package className="h-12 w-12 text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-200 mb-2">
                No products yet
              </h3>
              <p className="text-surface-400 mb-4">
                Add your first product to start managing inventory
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              All Products ({products.length})
              {isLoading && (
                <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                    Product
                  </th>
                  <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                    Category
                  </th>
                  <th className="text-right text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                    Price/kg
                  </th>
                  <th className="text-right text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                    Stock
                  </th>
                  <th className="text-right text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {products.map((product) => {
                  const isLowStock =
                    product.currentStockKg <= product.minStockKg;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-surface-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
                            <Package className="h-5 w-5 text-surface-400" />
                          </div>
                          <div>
                            <p className="font-medium text-surface-100">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-sm text-surface-500 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                          </div>
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
                        <span className="font-medium text-surface-100">
                          {formatPrice(product.basePricePerKg)}
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
                                : "text-surface-300"
                            }
                          >
                            {formatWeight(product.currentStockKg)}
                          </span>
                        </div>
                        {product.minStockKg > 0 && (
                          <p className="text-xs text-surface-500 mt-1">
                            Min: {formatWeight(product.minStockKg)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                {editingProduct ? "Edit Product" : "Add Product"}
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
                  label="Product Name *"
                  name="name"
                  placeholder="e.g., Atlantic Salmon"
                  value={formData.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1">
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:border-primary-500"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="pcs">Pieces (pcs)</option>
                    </select>
                  </div>

                  <Input
                    label="Price per kg (UZS) *"
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
                  <Input
                    label="Current Stock (kg)"
                    name="currentStockKg"
                    type="number"
                    placeholder="0.00"
                    value={formData.currentStockKg}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />

                  <Input
                    label="Minimum Stock (kg)"
                    name="minStockKg"
                    type="number"
                    placeholder="0.00"
                    value={formData.minStockKg}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <p className="text-xs text-surface-500">
                  Low stock warning will be shown when current stock falls below
                  minimum stock level.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingProduct ? (
                      "Save Changes"
                    ) : (
                      "Add Product"
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
              <CardTitle>Delete Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-surface-300">
                Are you sure you want to delete{" "}
                <span className="font-medium text-surface-100">
                  {deletingProduct.name}
                </span>
                ? This action cannot be undone.
              </p>

              {deletingProduct.currentStockKg > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    This product still has{" "}
                    {formatWeight(deletingProduct.currentStockKg)} in stock.
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
                  Cancel
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
                    "Delete"
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
