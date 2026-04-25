  import { Router, type Router as RouterType, Request, Response } from "express";
import { prisma } from "@mirsklada/database";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { logger } from "../../utils/logger";

const router: RouterType = Router();

type SubscriptionTier = "basic" | "pro";
type BillingStatus =
  | "active"
  | "inactive"
  | "past_due"
  | "cancelled"
  | "expired";

interface RevenueCatWebhookPayload {
  event?: RevenueCatEvent;
}

interface RevenueCatEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  entitlement_ids?: string[];
  product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  expires_date_ms?: number | null;
  event_timestamp_ms?: number;
}

const PAST_DUE_EVENTS = new Set(["BILLING_ISSUE"]);
const CANCELLED_EVENTS = new Set(["CANCELLATION"]);
const EXPIRED_EVENTS = new Set(["EXPIRATION"]);

function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

function parseScopedAppUserId(
  appUserId: string,
): { userId: string; tenantId: string } | null {
  const separatorIndex = appUserId.lastIndexOf(":");
  if (separatorIndex <= 0 || separatorIndex === appUserId.length - 1) {
    return null;
  }

  return {
    userId: appUserId.slice(0, separatorIndex),
    tenantId: appUserId.slice(separatorIndex + 1),
  };
}

function toDateFromMillis(value: number | null | undefined): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return new Date(value);
}

function deriveSubscriptionTier(event: RevenueCatEvent): SubscriptionTier {
  const hasProEntitlement = event.entitlement_ids?.includes("pro") ?? false;
  const expirationAt = toDateFromMillis(
    event.expiration_at_ms ?? event.expires_date_ms,
  );
  const notExpired = !expirationAt || expirationAt.getTime() > Date.now();
  const eventType = event.type ?? "";

  if (hasProEntitlement && notExpired && !EXPIRED_EVENTS.has(eventType)) {
    return "pro";
  }

  return "basic";
}

function deriveBillingStatus(
  event: RevenueCatEvent,
  tier: SubscriptionTier,
): BillingStatus {
  const eventType = event.type ?? "";

  if (tier === "pro") return "active";
  if (EXPIRED_EVENTS.has(eventType)) return "expired";
  if (PAST_DUE_EVENTS.has(eventType)) return "past_due";
  if (CANCELLED_EVENTS.has(eventType)) return "cancelled";
  return "inactive";
}

async function resolveTenantIdFromAppUserId(
  appUserId: string,
): Promise<string> {
  const scopedId = parseScopedAppUserId(appUserId);
  if (scopedId) {
    const membership = await prisma.tenantMember.findFirst({
      where: {
        userId: scopedId.userId,
        tenantId: scopedId.tenantId,
        status: "active",
      },
      select: { tenantId: true },
    });

    if (membership) {
      return membership.tenantId;
    }
  }

  const matchedByBillingId = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM tenants
    WHERE billing_external_app_user_id = ${appUserId}
    LIMIT 1
  `;

  if (matchedByBillingId.length > 0) {
    return matchedByBillingId[0].id;
  }

  throw AppError.badRequest(
    "Unable to resolve tenant from billing identity",
    "BILLING_TENANT_NOT_RESOLVED",
  );
}

router.post(
  "/revenuecat/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    if (!env.REVENUECAT_WEBHOOK_SECRET) {
      throw AppError.internal(
        "RevenueCat webhook secret is not configured",
        "BILLING_CONFIG_MISSING",
      );
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token || token !== env.REVENUECAT_WEBHOOK_SECRET) {
      throw AppError.unauthorized(
        "Invalid billing webhook authorization",
        "BILLING_WEBHOOK_UNAUTHORIZED",
      );
    }

    const payload = req.body as RevenueCatWebhookPayload;
    const event = payload.event;
    if (!event?.app_user_id) {
      throw AppError.badRequest(
        "Invalid RevenueCat webhook payload",
        "BILLING_PAYLOAD_INVALID",
      );
    }

    const tenantId = await resolveTenantIdFromAppUserId(event.app_user_id);
    const tier = deriveSubscriptionTier(event);
    const status = deriveBillingStatus(event, tier);
    const currentPeriodEnd = toDateFromMillis(
      event.expiration_at_ms ?? event.expires_date_ms,
    );
    const eventTimestamp =
      toDateFromMillis(event.event_timestamp_ms) ?? new Date();

    await prisma.$executeRaw`
      UPDATE tenants
      SET
        subscription_tier = ${tier},
        billing_provider = ${"revenuecat"},
        billing_external_app_user_id = ${event.app_user_id},
        billing_external_customer_id = ${event.original_app_user_id ?? null},
        billing_external_subscription_id = ${event.product_id ?? null},
        billing_subscription_status = ${status},
        billing_current_period_end = ${currentPeriodEnd},
        billing_last_event_id = ${event.id ?? null},
        billing_last_event_at = ${eventTimestamp},
        updated_at = NOW()
      WHERE id = ${tenantId}
    `;

    logger.info("RevenueCat webhook processed", {
      tenantId,
      eventId: event.id,
      eventType: event.type,
      tier,
      status,
    });

    res.status(200).json({ received: true });
  }),
);

export { router as billingRouter };
