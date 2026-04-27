/**
 * Settings Page
 * Manage tenant settings, user profile, and team members
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  User,
  Users,
  Save,
  Loader2,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  Crown,
  AlertTriangle,
  Check,
  X,
  LogOut,
  CreditCard,
  Zap,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
} from "@/components/ui";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";

type TabType = "business" | "profile" | "team" | "subscription";

interface TenantMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: "admin" | "staff";
  status: "active" | "invited" | "disabled";
  joinedAt: string;
}

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  status: string;
  role: string;
  createdAt: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, tenants, currentTenantId, logout, updateTenantName } =
    useAuthStore();
  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("business");

  // Business settings state
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(
    null,
  );
  const [businessName, setBusinessName] = useState("");
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Team state
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove member state
  const [removingMember, setRemovingMember] = useState<TenantMember | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);

  // Subscription
  const {
    offerings,
    isPro,
    isLoading: isLoadingSub,
    purchasePro,
  } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Fetch tenant details
  const fetchTenantDetails = useCallback(async () => {
    if (!currentTenantId) return;
    try {
      setIsLoadingTenant(true);
      const response = await api.get(`/tenants/${currentTenantId}`);
      const tenant = response.data.tenant || response.data;
      setTenantDetails(tenant);
      setBusinessName(tenant.name || "");
    } catch (err) {
      console.error("Failed to load tenant details:", err);
    } finally {
      setIsLoadingTenant(false);
    }
  }, [currentTenantId]);

  // Fetch team members
  const fetchMembers = useCallback(async () => {
    if (!currentTenantId) return;
    try {
      setIsLoadingMembers(true);
      setMembersError(null);
      const response = await api.get(`/tenants/${currentTenantId}/members`);
      setMembers(response.data.members || []);
    } catch (err) {
      setMembersError(t("settings.errorLoadMembers"));
      console.error(err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    fetchTenantDetails();
    if (user) {
      setProfileName(user.name || "");
    }
  }, [fetchTenantDetails, user]);

  useEffect(() => {
    if (activeTab === "team") {
      fetchMembers();
    }
  }, [activeTab, fetchMembers]);

  // Save business settings
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenantId || !businessName.trim()) return;

    setIsSavingBusiness(true);
    setBusinessError(null);

    try {
      await api.patch(`/tenants/${currentTenantId}`, {
        name: businessName.trim(),
      });
      // Update the sidebar tenant name
      updateTenantName(currentTenantId, businessName.trim());
      toast.success(t("settings.businessSaved"));
      // Refresh tenant data
      fetchTenantDetails();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setBusinessError(
          axiosError.response?.data?.message || t("settings.errorBusiness"),
        );
      } else {
        setBusinessError(t("settings.errorBusiness"));
      }
    } finally {
      setIsSavingBusiness(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      await api.patch("/auth/profile", {
        name: profileName.trim() || null,
      });
      toast.success(t("settings.profileUpdated"));
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setProfileError(
          axiosError.response?.data?.message || t("settings.errorProfile"),
        );
      } else {
        setProfileError(t("settings.errorProfile"));
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenantId || !inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      await api.post(`/tenants/${currentTenantId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
      toast.success(t("settings.memberInvited"));
      fetchMembers();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setInviteError(
          axiosError.response?.data?.message || t("settings.errorInvite"),
        );
      } else {
        setInviteError(t("settings.errorInvite"));
      }
    } finally {
      setIsInviting(false);
    }
  };

  // Update member role
  const handleUpdateRole = async (
    memberId: string,
    newRole: "admin" | "staff",
  ) => {
    if (!currentTenantId) return;

    try {
      await api.patch(`/tenants/${currentTenantId}/members/${memberId}`, {
        role: newRole,
      });
      toast.success(t("settings.roleUpdated"));
      fetchMembers();
    } catch (err) {
      toast.error(t("settings.errorRole"));
      console.error("Failed to update role:", err);
    }
  };

  // Remove member
  const handleRemoveMember = async () => {
    if (!currentTenantId || !removingMember) return;

    setIsRemoving(true);
    try {
      await api.delete(
        `/tenants/${currentTenantId}/members/${removingMember.id}`,
      );
      setRemovingMember(null);
      toast.success(t("settings.memberRemoved"));
      fetchMembers();
    } catch (err) {
      toast.error(t("settings.errorRemove"));
      console.error("Failed to remove member:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Check if current user is admin
  const isAdmin = currentTenant?.role === "admin";

  const handleUpgrade = async () => {
    setPurchaseError(null);
    setIsPurchasing(true);
    try {
      await purchasePro();
      setIsUpgradeModalOpen(false);
      toast.success(t("settings.upgradeSuccess"));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("settings.purchaseError");
      setPurchaseError(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Building2 }[] = [
    { id: "business", label: t("settings.tabBusiness"), icon: Building2 },
    { id: "profile", label: t("settings.tabProfile"), icon: User },
    { id: "team", label: t("settings.tabTeam"), icon: Users },
    { id: "subscription", label: t("settings.tabSubscription"), icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {t("settings.title")}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-500 text-white"
                  : "text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Business Settings Tab */}
      {activeTab === "business" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.businessInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTenant ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSaveBusiness} className="space-y-4">
                  {businessError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {businessError}
                    </div>
                  )}
                  <Input
                    label={t("settings.businessNameLabel")}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t("settings.businessNamePlaceholder")}
                    disabled={!isAdmin}
                  />

                  <div>
                    <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                      {t("settings.workspaceUrlLabel")}
                    </label>
                    <div className="px-4 py-2 bg-surface-100 dark:bg-surface-700/50 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-500 dark:text-surface-400">
                      mirsklada.com/{tenantDetails?.slug || "..."}
                    </div>
                  </div>

                  {isAdmin && (
                    <Button type="submit" disabled={isSavingBusiness}>
                      {isSavingBusiness ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {t("settings.saveChanges")}
                    </Button>
                  )}

                  {!isAdmin && (
                    <p className="text-sm text-surface-400 dark:text-surface-500">
                      {t("settings.adminOnly")}
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.subscription")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <div>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {t("settings.currentPlan")}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 capitalize">
                    {tenantDetails?.subscriptionTier || t("settings.planBasic")}{" "}
                    {t("settings.planLabel")}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    tenantDetails?.subscriptionTier === "pro"
                      ? "bg-primary-500/20 text-primary-600 dark:text-primary-400"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
                  }`}
                >
                  {tenantDetails?.subscriptionTier === "pro"
                    ? t("settings.planPro")
                    : t("settings.planBasic")}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  {t("settings.featureProducts")}
                </div>
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  {t("settings.featureClients")}
                </div>
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  {t("settings.featureStock")}
                </div>
                {tenantDetails?.subscriptionTier === "pro" ? (
                  <div className="flex items-center gap-2 text-surface-300">
                    <Check className="h-4 w-4 text-green-400" />
                    {t("settings.featureReports")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
                    <X className="h-4 w-4" />
                    {t("settings.featureReports")}
                  </div>
                )}
              </div>

              {tenantDetails?.subscriptionTier !== "pro" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setPurchaseError(null);
                    setActiveTab("subscription");
                    setIsUpgradeModalOpen(true);
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {t("settings.upgrade")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.yourProfile")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {profileError}
                  </div>
                )}
                <Input
                  label={t("settings.displayNameLabel")}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                />

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                    {t("settings.emailAddress")}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700/50 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-500 dark:text-surface-400">
                    <Mail className="h-4 w-4" />
                    {user?.email || "..."}
                  </div>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                    {t("settings.emailCannotChange")}
                  </p>
                </div>

                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t("settings.saveProfile")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <div>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {t("settings.yourRole")}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t("settings.inWorkspace", {
                      workspace: currentTenant?.name,
                    })}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                    isAdmin
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {isAdmin ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : (
                    <Shield className="h-3.5 w-3.5" />
                  )}
                  {isAdmin ? t("settings.roleAdmin") : t("settings.roleStaff")}
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full text-red-400 hover:bg-red-500/10"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("settings.signOut")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Team Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {t("settings.teamMembers")}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t("settings.teamSubtitle")}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t("settings.inviteMember")}
              </Button>
            )}
          </div>

          {/* Error */}
          {membersError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {membersError}
            </div>
          )}

          {/* Members List */}
          {isLoadingMembers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-surface-400 dark:text-surface-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-surface-600 dark:text-surface-300 mb-2">
                  {t("settings.noMembers")}
                </h3>
                <p className="text-surface-500 dark:text-surface-500 mb-4">
                  {t("settings.noMembersDesc")}
                </p>
                {isAdmin && (
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("settings.inviteMember")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {members.map((member) => {
                  const isCurrentUser = member.userId === user?.id;
                  const canModify = isAdmin && !isCurrentUser;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <span className="text-primary-400 font-medium">
                            {(member.name || member.email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-surface-900 dark:text-surface-100 font-medium">
                            {member.name || member.email}
                            {isCurrentUser && (
                              <span className="text-xs text-surface-400 dark:text-surface-500 ml-2">
                                {t("settings.you")}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            {member.email}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                            {t("settings.joined", {
                              date: new Date(
                                member.joinedAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }),
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Role Badge/Selector */}
                        {canModify ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.id,
                                e.target.value as "admin" | "staff",
                              )
                            }
                            className="select-field py-1.5 text-sm"
                            aria-label="Team member role"
                          >
                            <option value="admin">
                              {t("settings.roleAdmin")}
                            </option>
                            <option value="staff">
                              {t("settings.roleStaff")}
                            </option>
                          </select>
                        ) : (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                              member.role === "admin"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {member.role === "admin" ? (
                              <Crown className="h-3.5 w-3.5" />
                            ) : (
                              <Shield className="h-3.5 w-3.5" />
                            )}
                            {member.role === "admin"
                              ? t("settings.roleAdmin")
                              : t("settings.roleStaff")}
                          </div>
                        )}

                        {/* Remove Button */}
                        {canModify && (
                          <button
                            onClick={() => setRemovingMember(member)}
                            className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={t("settings.removeMember")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {!isAdmin && (
            <p className="text-sm text-surface-400 dark:text-surface-500 text-center">
              {t("settings.adminOnlyTeam")}
            </p>
          )}
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === "subscription" && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.subscription")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSub ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Current Plan Badge */}
                  <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPro ? "bg-primary-500/20" : "bg-surface-200 dark:bg-surface-700"}`}>
                        {isPro ? (
                          <Zap className="h-5 w-5 text-primary-500" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-surface-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-surface-100">
                          {isPro ? t("settings.planPro") : t("settings.planBasic")} {t("settings.planLabel")}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {isPro ? "99,000 UZS / mo" : t("settings.currentPlan")}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isPro ? "bg-primary-500/20 text-primary-600 dark:text-primary-400" : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300"}`}>
                      {isPro ? "Pro" : "Basic"}
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-2">
                    {[
                      { basicKey: "featureProductsBasic", proKey: "featureProductsPro", proOnly: false },
                      { basicKey: "featureClientsBasic", proKey: "featureClientsPro", proOnly: false },
                      { basicKey: "featureStock", proKey: "featureStock", proOnly: false },
                      { basicKey: "featureReports", proKey: "featureReports", proOnly: true },
                    ].map(({ basicKey, proKey, proOnly }) => (
                      <div key={basicKey} className="flex items-center gap-3 text-sm">
                        {!proOnly || isPro ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-surface-400 flex-shrink-0" />
                        )}
                        <span className={!proOnly || isPro ? "text-surface-700 dark:text-surface-300" : "text-surface-400 dark:text-surface-500"}>
                          {t(`settings.${isPro ? proKey : basicKey}`)}
                        </span>
                        {proOnly && !isPro && (
                          <span className="ml-auto text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">Pro</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Upgrade button */}
                  {!isPro && (
                    <div className="pt-2">
                      {offerings?.current ? (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setPurchaseError(null);
                            setIsUpgradeModalOpen(true);
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {t("settings.upgrade")}
                        </Button>
                      ) : (
                        <div className="text-sm text-surface-400 dark:text-surface-500 text-center py-2">
                          {t("settings.noOfferings")}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Confirmation Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary-500" />
                {t("settings.upgrade")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  99,000 UZS
                  <span className="text-sm font-normal text-surface-500 ml-1">/ mo</span>
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  {t("settings.planPro")} — unlimited products, advanced reports, up to 5 users
                </p>
              </div>

              {purchaseError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {purchaseError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  disabled={isPurchasing}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpgrade}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("settings.upgrading")}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {t("settings.upgradeNow")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("settings.inviteTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {inviteError}
                  </div>
                )}

                <Input
                  label={t("settings.inviteEmailLabel")}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("settings.inviteEmailPlaceholder")}
                  autoFocus
                />

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                    {t("settings.inviteRoleLabel")}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "admin" | "staff")
                    }
                    className="select-field w-full"
                    aria-label="Invite role"
                  >
                    <option value="staff">
                      {t("settings.inviteRoleStaff")}
                    </option>
                    <option value="admin">
                      {t("settings.inviteRoleAdmin")}
                    </option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setInviteEmail("");
                      setInviteError(null);
                    }}
                    disabled={isInviting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("settings.sendInvite")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-400">
                {t("settings.removeMemberTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-400 font-medium">
                    {(removingMember.name || removingMember.email)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    {removingMember.name || removingMember.email}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {removingMember.email}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  {t("settings.removeMemberWarning")}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRemovingMember(null)}
                  disabled={isRemoving}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleRemoveMember}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("settings.removeButton")
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
