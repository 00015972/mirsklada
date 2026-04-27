/**
 * Payment Routes
 * Express router for payment endpoints
 */
import { Router } from "express";
import { paymentController } from "./payment.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { requireAdmin } from "../../middleware/subscription.middleware";
import {
  RecordPaymentSchema,
  VoidPaymentSchema,
  PaymentIdParamSchema,
  ClientIdParamSchema,
  PaymentQuerySchema,
  SummaryQuerySchema,
} from "./payment.schemas";

const router = Router();

// All payment endpoints are admin-only
router.use(requireAdmin);

// GET /payments - List all payments
router.get(
  "/",
  validate({ query: PaymentQuerySchema }),
  asyncHandler(paymentController.findAll),
);

// GET /payments/summary - Get payment summary
router.get(
  "/summary",
  validate({ query: SummaryQuerySchema }),
  asyncHandler(paymentController.getSummary),
);

// GET /payments/ledger/:clientId - Get debt ledger for client
router.get(
  "/ledger/:clientId",
  validate({ params: ClientIdParamSchema, query: SummaryQuerySchema }),
  asyncHandler(paymentController.getDebtLedger),
);

// GET /payments/:id - Get single payment
router.get(
  "/:id",
  validate({ params: PaymentIdParamSchema }),
  asyncHandler(paymentController.findById),
);

// POST /payments - Record payment
router.post(
  "/",
  validate({ body: RecordPaymentSchema }),
  asyncHandler(paymentController.recordPayment),
);

// POST /payments/:id/void - Void a payment
router.post(
  "/:id/void",
  validate({ params: PaymentIdParamSchema, body: VoidPaymentSchema }),
  asyncHandler(paymentController.voidPayment),
);

export const paymentRouter: Router = router;
