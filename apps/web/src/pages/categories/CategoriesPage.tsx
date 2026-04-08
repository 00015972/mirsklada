/**
 * Categories Page
 * List and manage product categories
 */
import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  GripVertical,
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
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count: {
    products: number;
  };
}

interface CategoryPayload {
  name: string;
}

interface CategoryApiResponse {
  id: string;
  name: string;
  sortOrder?: number;
  _count?: {
    products?: number;
  };
}

export function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  const sortCategories = (items: Category[]) => {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const toOptimisticCategory = (
    payload: CategoryPayload,
    id: string,
    existingCategory?: Category,
  ): Category => {
    return {
      id,
      name: payload.name,
      sortOrder: existingCategory?.sortOrder ?? 0,
      _count: {
        products: existingCategory?._count.products ?? 0,
      },
    };
  };

  const normalizeCategory = (
    category: CategoryApiResponse,
    fallbackCategory: Category,
  ): Category => {
    return {
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder ?? fallbackCategory.sortOrder,
      _count: {
        products: category._count?.products ?? fallbackCategory._count.products,
      },
    };
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(t("categories.errorLoad"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open create modal
  const handleCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError(t("categories.nameRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: CategoryPayload = { name: formName.trim() };
    const previousCategories = categories;
    const optimisticId = editingCategory
      ? editingCategory.id
      : `temp-category-${Date.now()}`;
    const optimisticCategory = toOptimisticCategory(
      payload,
      optimisticId,
      editingCategory ?? undefined,
    );

    setCategories((prevCategories) => {
      const nextCategories = editingCategory
        ? prevCategories.map((category) =>
            category.id === editingCategory.id ? optimisticCategory : category,
          )
        : [optimisticCategory, ...prevCategories];

      return sortCategories(nextCategories);
    });

    try {
      const response = editingCategory
        ? await api.patch(`/categories/${editingCategory.id}`, payload)
        : await api.post("/categories", payload);

      const serverCategory = response?.data?.data as
        | CategoryApiResponse
        | undefined;

      if (serverCategory) {
        const normalizedCategory = normalizeCategory(
          serverCategory,
          optimisticCategory,
        );

        setCategories((prevCategories) => {
          const nextCategories = editingCategory
            ? prevCategories.map((category) =>
                category.id === editingCategory.id
                  ? normalizedCategory
                  : category,
              )
            : prevCategories.map((category) =>
                category.id === optimisticId ? normalizedCategory : category,
              );

          return sortCategories(nextCategories);
        });
      } else {
        await fetchCategories();
      }

      setEditingCategory(null);
      setFormName("");
      setIsModalOpen(false);
      toast.success(editingCategory ? t("categories.updated") : t("categories.created"));
    } catch (err: unknown) {
      setCategories(previousCategories);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("categories.errorSave");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("categories.errorSave"));
        toast.error(t("categories.errorSave"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!deletingCategory) return;

    const categoryToDelete = deletingCategory;
    const previousCategories = categories;

    setIsSubmitting(true);
    setDeletingCategory(null);
    setCategories((prevCategories) =>
      prevCategories.filter((category) => category.id !== categoryToDelete.id),
    );

    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success(t("categories.deleted"));
    } catch (err: unknown) {
      setCategories(previousCategories);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("categories.errorDelete");
        setError(message);
        toast.error(message);
      } else {
        setError(t("categories.errorDelete"));
        toast.error(t("categories.errorDelete"));
      }
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t("categories.title")}</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t("categories.subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("categories.addCategory")}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-surface-400 dark:text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
                {t("categories.noCategories")}
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-4">
                {t("categories.noCategoriesDesc")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t("categories.createCategory")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("categories.allCategories", { count: categories.length })}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("categories.nameColumn")}</th>
                  <th className="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("categories.productsColumn")}</th>
                  <th className="text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider px-6 py-3">{t("categories.actionsColumn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-surface-400 dark:text-surface-600 cursor-grab" />
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-surface-500 dark:text-surface-400">
                        {t("categories.productsCount", { count: category._count.products })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title={t("categories.editCategory")}
                          onClick={() => handleEdit(category)}
                          className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(category)}
                          className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          disabled={category._count.products > 0}
                          title={
                            category._count.products > 0
                              ? t("categories.cannotDelete")
                              : t("categories.deleteTitle")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingCategory ? t("categories.editCategory") : t("categories.createCategory")}
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
                  label={t("categories.nameLabelField")}
                  placeholder={t("categories.namePlaceholder")}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                />

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
                    ) : editingCategory ? (
                      t("categories.saveChanges")
                    ) : (
                      t("common.create")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("categories.deleteTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-surface-600 dark:text-surface-300">
                {t("categories.deleteConfirmText")}{" "}
                <span className="font-medium text-surface-900 dark:text-surface-100">
                  {deletingCategory.name}
                </span>
                ? {t("categories.deleteCannotUndo")}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingCategory(null)}
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
