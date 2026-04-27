import { useState, useEffect, useCallback } from "react";
import type { Offerings, CustomerInfo } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import { useAuthStore } from "@/stores";
import { configureRevenueCat } from "@/lib/revenueCat";

const TENANT_REFRESH_DELAY_MS = 3000;

export interface UseSubscriptionReturn {
  offerings: Offerings | null;
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  purchasePro: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, currentTenantId, tenants, refreshTenants } = useAuthStore();
  const currentTenant = tenants.find((tenant) => tenant.id === currentTenantId);
  const scopedUserId =
    user?.id && currentTenantId ? `${user.id}:${currentTenantId}` : null;
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!scopedUserId) return;
    try {
      setIsLoading(true);
      setError(null);
      configureRevenueCat(scopedUserId);
      const [offeringsResult, info] = await Promise.all([
        Purchases.getSharedInstance().getOfferings(),
        Purchases.getSharedInstance().getCustomerInfo(),
      ]);
      console.log("[RC] offerings:", JSON.stringify({
        current: offeringsResult.current ? {
          identifier: offeringsResult.current.identifier,
          packages: offeringsResult.current.availablePackages.map(p => ({
            identifier: p.identifier,
            product: { identifier: p.rcBillingProduct?.identifier, title: p.rcBillingProduct?.title },
          })),
        } : null,
        all: Object.keys(offeringsResult.all),
      }, null, 2));
      setOfferings(offeringsResult);
      setCustomerInfo(info);
    } catch {
      setError("Failed to load subscription info");
    } finally {
      setIsLoading(false);
    }
  }, [scopedUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const purchasePro = async () => {
    const pkg = offerings?.current?.availablePackages[0];
    if (!pkg) {
      const pkgCount = offerings?.current?.availablePackages?.length ?? 0;
      const currentId = offerings?.current?.identifier ?? "none";
      throw new Error(`No package available (offering: "${currentId}", packages: ${pkgCount})`);
    }
    const { customerInfo: updated } =
      await Purchases.getSharedInstance().purchasePackage(pkg);
    setCustomerInfo(updated);
    // Refresh tenant data after a short delay to allow the webhook to process
    setTimeout(() => {
      refreshTenants();
    }, TENANT_REFRESH_DELAY_MS);
  };

  const isPro = currentTenant?.subscriptionTier === "pro";

  return {
    offerings,
    customerInfo,
    isPro,
    isLoading,
    error,
    purchasePro,
    reload: load,
  };
}
