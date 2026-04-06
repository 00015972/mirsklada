/**
 * Settings Page
 * Manage tenant settings, user profile, and team members
 */
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
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

type TabType = "business" | "profile" | "team";

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
      setMembersError("Failed to load team members");
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
      toast.success("Business settings saved");
      // Refresh tenant data
      fetchTenantDetails();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setBusinessError(
          axiosError.response?.data?.message || "Failed to save settings",
        );
      } else {
        setBusinessError("Failed to save settings");
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
      toast.success("Profile updated");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setProfileError(
          axiosError.response?.data?.message || "Failed to save profile",
        );
      } else {
        setProfileError("Failed to save profile");
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
      toast.success("Member invited successfully");
      fetchMembers();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setInviteError(
          axiosError.response?.data?.message || "Failed to invite member",
        );
      } else {
        setInviteError("Failed to invite member");
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
      toast.success("Role updated");
      fetchMembers();
    } catch (err) {
      toast.error("Failed to update role");
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
      toast.success("Member removed");
      fetchMembers();
    } catch (err) {
      toast.error("Failed to remove member");
      console.error("Failed to remove member:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Check if current user is admin
  const isAdmin = currentTenant?.role === "admin";

  const tabs: { id: TabType; label: string; icon: typeof Building2 }[] = [
    { id: "business", label: "Business", icon: Building2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "team", label: "Team", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Settings
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Manage your business and account settings
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
              <CardTitle>Business Information</CardTitle>
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
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    disabled={!isAdmin}
                  />

                  <div>
                    <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                      Workspace URL
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
                      Save Changes
                    </Button>
                  )}

                  {!isAdmin && (
                    <p className="text-sm text-surface-400 dark:text-surface-500">
                      Only admins can edit business settings
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <div>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    Current Plan
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 capitalize">
                    {tenantDetails?.subscriptionTier || "Basic"} Plan
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    tenantDetails?.subscriptionTier === "pro"
                      ? "bg-primary-500/20 text-primary-600 dark:text-primary-400"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
                  }`}
                >
                  {tenantDetails?.subscriptionTier === "pro" ? "Pro" : "Basic"}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  Unlimited products
                </div>
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  Unlimited clients
                </div>
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  Stock management
                </div>
                {tenantDetails?.subscriptionTier === "pro" ? (
                  <>
                    <div className="flex items-center gap-2 text-surface-300">
                      <Check className="h-4 w-4 text-green-400" />
                      Telegram bot integration
                    </div>
                    <div className="flex items-center gap-2 text-surface-300">
                      <Check className="h-4 w-4 text-green-400" />
                      Advanced reports
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
                      <X className="h-4 w-4" />
                      Telegram bot integration
                    </div>
                    <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
                      <X className="h-4 w-4" />
                      Advanced reports
                    </div>
                  </>
                )}
              </div>

              {tenantDetails?.subscriptionTier !== "pro" && (
                <Button variant="secondary" className="w-full" disabled>
                  Upgrade to Pro (Coming Soon)
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
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {profileError}
                  </div>
                )}
                <Input
                  label="Display Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                />

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700/50 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-500 dark:text-surface-400">
                    <Mail className="h-4 w-4" />
                    {user?.email || "..."}
                  </div>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <div>
                  <p className="text-surface-900 dark:text-surface-100 font-medium">
                    Your Role
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    in {currentTenant?.name}
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
                  {isAdmin ? "Admin" : "Staff"}
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full text-red-400 hover:bg-red-500/10"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
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
                Team Members
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Manage who has access to this workspace
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
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
                  No team members yet
                </h3>
                <p className="text-surface-500 dark:text-surface-500 mb-4">
                  Invite team members to collaborate
                </p>
                {isAdmin && (
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
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
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            {member.email}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                            Joined{" "}
                            {new Date(member.joinedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
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
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
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
                            {member.role === "admin" ? "Admin" : "Staff"}
                          </div>
                        )}

                        {/* Remove Button */}
                        {canModify && (
                          <button
                            onClick={() => setRemovingMember(member)}
                            className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove member"
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
              Only admins can invite or remove team members
            </p>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {inviteError}
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  autoFocus
                />

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">
                    Role
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
                      Staff - Can view and edit data
                    </option>
                    <option value="admin">
                      Admin - Full access including settings
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send Invite"
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
              <CardTitle className="text-red-400">Remove Team Member</CardTitle>
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
                  This member will lose access to this workspace immediately.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRemovingMember(null)}
                  disabled={isRemoving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleRemoveMember}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remove Member"
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
