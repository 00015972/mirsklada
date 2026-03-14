/**
 * Clients Page
 * List and manage clients
 */
import { useState, useEffect } from "react";
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

export function ClientsPage() {
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

  // Fetch clients
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (showWithDebt) params.append("hasDebt", "true");

      const response = await api.get(`/clients?${params.toString()}`);
      setClients(response.data.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load clients");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery, showWithDebt]);

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
      setFormError("Client name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        telegramId: formData.telegramId.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingClient) {
        await api.patch(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }

      setIsModalOpen(false);
      toast.success(editingClient ? "Client updated" : "Client created");
      fetchClients();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setFormError(
          axiosError.response?.data?.message || "Failed to save client",
        );
      } else {
        setFormError("Failed to save client");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete client
  const handleDelete = async () => {
    if (!deletingClient) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/clients/${deletingClient.id}`);
      setDeletingClient(null);
      toast.success("Client deleted");
      fetchClients();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || "Failed to delete client",
        );
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
      toast.error("Failed to load client details");
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
          <h1 className="text-2xl font-bold text-surface-100">Clients</h1>
          <p className="text-surface-400 mt-1">
            Manage your customers and track their orders
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or Telegram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <Button
          variant={showWithDebt ? "primary" : "secondary"}
          onClick={() => setShowWithDebt(!showWithDebt)}
        >
          With Debt
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
                No clients yet
              </h3>
              <p className="text-surface-400 mb-4">
                Add your first client to start tracking orders
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
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
                    onClick={() => handleViewClient(client)}
                    className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingClient(client)}
                    className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                    <h3 className="font-semibold text-surface-100 truncate">
                      {client.name}
                    </h3>
                    {parseFloat(String(client.currentDebt)) > 0 && (
                      <p className="text-sm text-amber-400">
                        Debt: {formatPrice(client.currentDebt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-surface-400">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.telegramId && (
                    <div className="flex items-center gap-2 text-surface-400">
                      <MessageCircle className="h-4 w-4" />
                      <span>@{client.telegramId}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-surface-400">
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
                {editingClient ? "Edit Client" : "Add Client"}
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
                  label="Client Name *"
                  name="name"
                  placeholder="e.g., John's Restaurant"
                  value={formData.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  placeholder="+998 90 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                />

                <Input
                  label="Telegram Username"
                  name="telegramId"
                  placeholder="username (without @)"
                  value={formData.telegramId}
                  onChange={handleInputChange}
                />

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    placeholder="Delivery address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Any additional notes about this client"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none"
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingClient ? (
                      "Save Changes"
                    ) : (
                      "Add Client"
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
              <CardTitle>Delete Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-surface-300">
                Are you sure you want to delete{" "}
                <span className="font-medium text-surface-100">
                  {deletingClient.name}
                </span>
                ? This will also delete all their order history.
              </p>

              {parseFloat(String(deletingClient.currentDebt)) > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  This client has an outstanding debt of{" "}
                  {formatPrice(deletingClient.currentDebt)}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingClient(null)}
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
                onClick={() => setViewingClient(null)}
                className="p-2 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded-lg transition-colors"
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
                    Client since{" "}
                    {new Date(viewingClient.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              {/* Debt Summary */}
              {parseFloat(String(viewingClient.currentDebt)) > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-400">
                      Outstanding Debt
                    </span>
                    <span className="text-lg font-bold text-amber-300">
                      {formatPrice(viewingClient.currentDebt)}
                    </span>
                  </div>
                </div>
              )}

              {viewingClient.notes && (
                <div className="p-3 rounded-lg bg-surface-800 text-surface-400 text-sm">
                  <span className="font-medium text-surface-300">Notes:</span>{" "}
                  {viewingClient.notes}
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Recent Orders
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
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700"
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
                              {order.items?.length || 0} items &middot;{" "}
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
                                Unpaid: {formatPrice(total - paid)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 text-center py-4">
                    No orders yet
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setViewingClient(null)}
                >
                  Close
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
                  Edit Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
