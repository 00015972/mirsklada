import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  requireFeature,
  requirePro,
} from "@/middleware/subscription.middleware";
import { AppError } from "@/utils/app-error";

const makeReq = (tier: "basic" | "pro"): Request =>
  ({ subscriptionTier: tier }) as unknown as Request;

const makeRes = (): Response => ({}) as Response;

const makeNext = () => vi.fn() as unknown as NextFunction;

describe("requireFeature middleware", () => {
  it("allows pro users to access pro-only features", () => {
    const req = makeReq("pro");
    const next = makeNext();

    requireFeature("google_drive")(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it("blocks basic users from pro-only features with FEATURE_REQUIRES_PRO", () => {
    const req = makeReq("basic");
    const next = makeNext();

    expect(() => requireFeature("google_drive")(req, makeRes(), next)).toThrow(
      AppError,
    );

    // next should not be called when the guard throws
    expect(next).not.toHaveBeenCalled();
  });

  it("throws AppError with 403 status for basic tier", () => {
    const req = makeReq("basic");

    expect(() =>
      requireFeature("yandex_delivery")(req, makeRes(), makeNext()),
    ).toThrow(
      expect.objectContaining({
        statusCode: 403,
        code: "FEATURE_REQUIRES_PRO",
      }),
    );
  });

  it("blocks all known pro features for basic users", () => {
    const proFeatures = [
      "google_drive",
      "yandex_delivery",
      "reports_advanced",
      "reports_export",
      "price_matrices",
      "api_access",
    ] as const;

    for (const feature of proFeatures) {
      const req = makeReq("basic");
      expect(() => requireFeature(feature)(req, makeRes(), makeNext())).toThrow(
        AppError,
      );
    }
  });
});

describe("requirePro middleware", () => {
  it("allows pro users through", () => {
    const req = makeReq("pro");
    const next = makeNext();

    requirePro(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("blocks basic users with REQUIRES_PRO code", () => {
    const req = makeReq("basic");

    expect(() => requirePro(req, makeRes(), makeNext())).toThrow(
      expect.objectContaining({
        statusCode: 403,
        code: "REQUIRES_PRO",
      }),
    );
  });
});
