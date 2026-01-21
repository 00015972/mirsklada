/**
 * Order Routes
 * Express router for order endpoints
 */
import { Router } from "express";
import { orderController } from "./order.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderIdParamSchema,
  OrderQuerySchema,
} from "./order.schemas";

const router = Router();

// GET /orders - List all orders
router.get(
  "/",
  validate({ query: OrderQuerySchema }),
  asyncHandler(orderController.findAll),
);

// GET /orders/:id - Get single order
router.get(
  "/:id",
  validate({ params: OrderIdParamSchema }),
  asyncHandler(orderController.findById),
);

// POST /orders - Create order
router.post(
  "/",
  validate({ body: CreateOrderSchema }),
  asyncHandler(orderController.create),
);

// POST /orders/:id/confirm - Confirm order (deduct stock)
router.post(
  "/:id/confirm",
  validate({ params: OrderIdParamSchema }),
  asyncHandler(orderController.confirm),
);

// POST /orders/:id/cancel - Cancel order
router.post(
  "/:id/cancel",
  validate({ params: OrderIdParamSchema }),
  asyncHandler(orderController.cancel),
);

// PATCH /orders/:id - Update order
router.patch(
  "/:id",
  validate({ params: OrderIdParamSchema, body: UpdateOrderSchema }),
  asyncHandler(orderController.update),
);

export const orderRouter: Router = router;
