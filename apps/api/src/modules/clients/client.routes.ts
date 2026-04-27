/**
 * Client Routes
 * Express router for client endpoints
 */
import { Router } from "express";
import { clientController } from "./client.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { requireAdmin } from "../../middleware/subscription.middleware";
import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientIdParamSchema,
  ClientQuerySchema,
  ClientOrdersQuerySchema,
} from "./client.schemas";

const router = Router();

// GET /clients - List all clients
router.get(
  "/",
  validate({ query: ClientQuerySchema }),
  asyncHandler(clientController.findAll),
);

// GET /clients/debtors - Get clients with outstanding debt
router.get("/debtors", asyncHandler(clientController.getDebtors));

// GET /clients/:id - Get single client
router.get(
  "/:id",
  validate({ params: ClientIdParamSchema }),
  asyncHandler(clientController.findById),
);

// GET /clients/:id/with-orders - Get client with order history
router.get(
  "/:id/with-orders",
  validate({ params: ClientIdParamSchema, query: ClientOrdersQuerySchema }),
  asyncHandler(clientController.findByIdWithOrders),
);

// POST /clients - Create client (admin only)
router.post(
  "/",
  requireAdmin,
  validate({ body: CreateClientSchema }),
  asyncHandler(clientController.create),
);

// PATCH /clients/:id - Update client (admin only)
router.patch(
  "/:id",
  requireAdmin,
  validate({ params: ClientIdParamSchema, body: UpdateClientSchema }),
  asyncHandler(clientController.update),
);

// DELETE /clients/:id - Soft delete client (admin only)
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: ClientIdParamSchema }),
  asyncHandler(clientController.delete),
);

export const clientRouter: Router = router;
