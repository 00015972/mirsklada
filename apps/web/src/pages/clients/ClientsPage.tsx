/**
 * Clients Page
 * List and manage clients
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Search,
  Phone,
  MapPin,
  MessageCircle,
  Eye,
  ShoppingCart,
  X,
  Calendar,
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

interface Client {
  id: string;
  name: string;
  phone: string | null;
  telegramId: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  currentDebt: number | string;
  createdAt: string;
}

interface ClientPayload {
  name: string;
  phone: string | null;
  telegramId: string | null;
  address: string | null;
  notes: string | null;
}

interface ClientOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  paidAmount: number | string;
  createdAt: string;
  items: Array<{
    id: string;
    quantityKg: number;
    pricePerKg: number;
    totalPrice: number;
    product: { name: string };
  }>;
}

interface ClientDetail extends Client {
  orders: ClientOrder[];
}

/**
 * Format price with thousand separators (Uzbek format)
 */
function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("uz-UZ").format(num) + " UZS";
}

function toDebtNumber(amount: number | string): number {
  return typeof amount === "string" ? parseFloat(amount) : amount;
}

export function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showWithDebt, setShowWithDebt] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    telegramId: "",
    address: "",
    notes: "",
  });

  // Delete confirmation
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Client detail modal
  const [viewingClient, setViewingClient] = useState<ClientDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const matchesActiveFilters = (client: Client): boolean => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      [client.name, client.phone, client.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));

    if (!matchesSearch) {
      return false;
    }

    if (showWithDebt && toDebtNumber(client.currentDebt) <= 0) {
      return false;
    }

    return true;
  };

  const applyFilters = (items: Client[]): Client[] => {
    return items.filter(matchesActiveFilters);
  };

  const toOptimisticClient = (
    payload: ClientPayload,
    id: string,
    existingClient?: Client,
  ): Client => {
    return {
      id,
      name: payload.name,
      phone: payload.phone,
      telegramId: payload.telegramId,
      address: payload.address,
      notes: payload.notes,
      isActive: existingClient?.isActive ?? true,
      currentDebt: existingClient?.currentDebt ?? 0,
      createdAt: existingClient?.createdAt ?? new Date().toISOString(),
    };
  };

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (showWithDebt) params.append("hasDebt", "true");

      const response = await api.get(`/clients?${params.toString()}`);
      setClients(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(t("clients.errorLoad"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showWithDebt, t]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      telegramId: "",
      address: "",
      notes: "",
    });
    setFormError(null);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingClient(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || "",
      telegramId: client.telegramId || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError(t("clients.nameRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: ClientPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      telegramId: formData.telegramId.trim() || null,
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null,
    };

    const previousClients = clients;
    const optimisticId = editingClient
      ? editingClient.id
      : `temp-client-${Date.now()}`;
    const optimisticClient = toOptimisticClient(
      payload,
      optimisticId,
      editingClient ?? undefined,
    );

    setClients((prevClients) => {
      const nextClients = editingClient
        ? prevClients.map((client) =>
            client.id === editingClient.id ? optimisticClient : client,
          )
        : [optimisticClient, ...prevClients];

      return applyFilters(nextClients);
    });

    setViewingClient((prev) => {
      if (!prev || prev.id !== optimisticClient.id) {
        return prev;
      }

      return {
        ...prev,
        ...optimisticClient,
        orders: prev.orders,
      };
    });

    try {
      const response = editingClient
        ? await api.patch(`/clients/${editingClient.id}`, payload)
        : await api.post("/clients", payload);

      const serverClient = response?.data?.data as Client | undefined;

      if (serverClient) {
        setClients((prevClients) => {
          const nextClients = editingClient
            ? prevClients.map((client) =>
                client.id === editingClient.id ? serverClient : client,
              )
            : prevClients.map((client) =>
                client.id === optimisticId ? serverClient : client,
              );

          return applyFilters(nextClients);
        });

        setViewingClient((prev) => {
          if (!prev || prev.id !== serverClient.id) {
            return prev;
          }

          return {
            ...prev,
            ...serverClient,
            orders: prev.orders,
          };
        });
      } else {
        await fetchClients();
      }

      setEditingClient(null);
      resetForm();
      setIsModalOpen(false);
      toast.success(editingClient ? t("clients.updated") : t("clients.created"));
    } catch (err: unknown) {
      setClients(previousClients);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("clients.errorSave");
        setFormError(message);
        toast.error(message);
      } else {
        setFormError(t("clients.errorSave"));
        toast.error(t("clients.errorSave"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete client
  const handleDelete = async () => {
    if (!deletingClient) return;

    const clientToDelete = deletingClient;
    const previousClients = clients;

    setIsSubmitting(true);
    setDeletingClient(null);
    setClients((prevClients) =>
      prevClients.filter((client) => client.id !== clientToDelete.id),
    );
    setViewingClient((prev) => (prev?.id === clientToDelete.id ? null : prev));

    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      toast.success(t("clients.deleted"));
    } catch (err: unknown) {
      setClients(previousClients);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        const message =
          axiosError.response?.data?.message || t("clients.errorDelete");
        setError(message);
        toast.error(message);
      } else {
        setError(t("clients.errorDelete"));
        toast.error(t("clients.errorDelete"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // View client details
  const handleViewClient = async (client: Client) => {
    setIsLoadingDetail(true);
    setViewingClient({ ...client, orders: [] } as ClientDetail);
    try {
      const response = await api.get(
        `/clients/${client.id}/with-orders?limit=10`,
      );
      setViewingClient(response.data.data);
    } catch (err) {
      console.error("Failed to load client details:", err);
      toast.error(t("clients.errorLoadDetail"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (isLoading && clients.length === 0) {
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
            {t("clients.title")}
          </h1>
          <p className="text-surface-400 mt-1">
            {t("clients.subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("clients.addClient")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder={t("clients.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <Button
          variant={showWithDebt ? "primary" : "secondary"}
          onClick={() => setShowWithDebt(!showWithDebt)}
        >
          {t("clients.withDebt")}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-200 mb-2">
                {t("clients.noClients")}
              </h3>
              <p className="text-surface-400 mb-4">
                {t("clients.noClientsDesc")}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t("clients.addClient")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="relative">
              <CardContent className="p-4">
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleViewClient(client)}
                    className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    title={t("clients.viewDetails")}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(client)}
                    className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    title={t("clients.editClient")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingClient(client)}
                    className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title={t("clients.deleteTitle")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Client Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-primary-400">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                      {client.name}
                    </h3>
                    {parseFloat(String(client.currentDebt)) > 0 && (
                      <p className="text-sm text-amber-400">
                        {t("clients.debt", { amount: formatPrice(client.currentDebt) })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.telegramId && (
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <MessageCircle className="h-4 w-4" />
                      <span>@{client.telegramId}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-surface-500 dark:text-surface-400">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="mt-3 text-xs text-surface-500 line-clamp-2 border-t border-surface-800 pt-3">
                    {client.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <CardHeader>
              <CardTitle>
                {editingClient ? t("clients.editClient") : t("clients.addClient")}
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
                  label={t("clients.nameLabel")}
                  name="name"
                  placeholder={t("clients.namePlaceholder")}
                  value={formData.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                <Input
                  label={t("clients.phoneLabel")}
                  name="phone"
                  placeholder={t("clients.phonePlaceholder")}
                  value={formData.phone}
                  onChange={handleInputChange}
                />

                <Input
                  label={t("clients.telegramLabel")}
                  name="telegramId"
                  placeholder={t("clients.telegramPlaceholder")}
                  value={formData.telegramId}
                  onChange={handleInputChange}
                />

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("clients.addressLabel")}
                  </label>
                  <textarea
                    name="address"
                    placeholder={t("clients.addressPlaceholder")}
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    {t("clients.notesLabel")}
                  </label>
                  <textarea
                    name="notes"
                    placeholder={t("clients.notesPlaceholder")}
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

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
                    ) : editingClient ? (
                      t("clients.saveChanges")
                    ) : (
                      t("clients.addClient")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("clients.deleteTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-surface-300">
                {t("clients.deleteConfirmText")}{" "}
                <span className="font-medium text-surface-900 dark:text-surface-100">
                  {deletingClient.name}
                </span>
                {t("clients.deleteHistoryWarning")}
              </p>

              {parseFloat(String(deletingClient.currentDebt)) > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  {t("clients.outstandingDebtWarning", { amount: formatPrice(deletingClient.currentDebt) })}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingClient(null)}
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

      {/* Client Details Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-400">
                    {viewingClient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {viewingClient.name}
              </CardTitle>
              <button
                type="button"
                onClick={() => setViewingClient(null)}
                className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                title={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {viewingClient.phone && (
                  <div className="flex items-center gap-2 text-surface-300">
                    <Phone className="h-4 w-4 text-surface-500" />
                    <span className="text-sm">{viewingClient.phone}</span>
                  </div>
                )}
                {viewingClient.telegramId && (
                  <div className="flex items-center gap-2 text-surface-300">
                    <MessageCircle className="h-4 w-4 text-surface-500" />
                    <span className="text-sm">@{viewingClient.telegramId}</span>
                  </div>
                )}
                {viewingClient.address && (
                  <div className="flex items-start gap-2 text-surface-300 col-span-2">
                    <MapPin className="h-4 w-4 text-surface-500 mt-0.5" />
                    <span className="text-sm">{viewingClient.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-surface-300">
                  <Calendar className="h-4 w-4 text-surface-500" />
                  <span className="text-sm">
                    {t("clients.clientSince", { date: new Date(viewingClient.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) })}
                  </span>
                </div>
              </div>

              {/* Debt Summary */}
              {parseFloat(String(viewingClient.currentDebt)) > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-400">
                      {t("clients.outstandingDebt")}
                    </span>
                    <span className="text-lg font-bold text-amber-300">
                      {formatPrice(viewingClient.currentDebt)}
                    </span>
                  </div>
                </div>
              )}

              {viewingClient.notes && (
                <div className="p-3 rounded-lg bg-surface-800 text-surface-400 text-sm">
                  <span className="font-medium text-surface-300">{t("clients.notes")}</span>{" "}
                  {viewingClient.notes}
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {t("clients.recentOrders")}
                </h3>
                {isLoadingDetail ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                  </div>
                ) : viewingClient.orders?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {viewingClient.orders.map((order) => {
                      const total =
                        typeof order.totalAmount === "string"
                          ? parseFloat(order.totalAmount)
                          : order.totalAmount;
                      const paid =
                        typeof order.paidAmount === "string"
                          ? parseFloat(order.paidAmount)
                          : order.paidAmount;
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-700"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-surface-200">
                                {order.orderNumber}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  order.status === "COMPLETED"
                                    ? "bg-green-500/20 text-green-400"
                                    : order.status === "CANCELLED"
                                      ? "bg-red-500/20 text-red-400"
                                      : order.status === "CONFIRMED"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-surface-700 text-surface-300"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-surface-500 mt-1">
                              {t("clients.items", { count: order.items?.length || 0 })} &middot;{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-surface-200">
                              {formatPrice(total)}
                            </p>
                            {paid < total && (
                              <p className="text-xs text-amber-400">
                                {t("clients.unpaid", { amount: formatPrice(total - paid) })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 text-center py-4">
                    {t("clients.noOrders")}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setViewingClient(null)}
                >
                  {t("common.close")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const client = viewingClient;
                    setViewingClient(null);
                    handleEdit(client);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("clients.editClient")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
