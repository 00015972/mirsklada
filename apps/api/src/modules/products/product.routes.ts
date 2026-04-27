/**
 * Product Routes
 * Express router for product endpoints
 */
import { Router } from "express";
import { productController } from "./product.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { requireAdmin } from "../../middleware/subscription.middleware";
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductIdParamSchema,
  ProductQuerySchema,
} from "./product.schemas";

const router = Router();

// GET /products - List all products
router.get(
  "/",
  validate({ query: ProductQuerySchema }),
  asyncHandler(productController.findAll),
);

// GET /products/low-stock - Get low stock products
router.get("/low-stock", asyncHandler(productController.getLowStock));

// GET /products/:id - Get single product
router.get(
  "/:id",
  validate({ params: ProductIdParamSchema }),
  asyncHandler(productController.findById),
);

// POST /products - Create product (admin only)
router.post(
  "/",
  requireAdmin,
  validate({ body: CreateProductSchema }),
  asyncHandler(productController.create),
);

// PATCH /products/:id - Update product (admin only)
router.patch(
  "/:id",
  requireAdmin,
  validate({ params: ProductIdParamSchema, body: UpdateProductSchema }),
  asyncHandler(productController.update),
);

// DELETE /products/:id - Soft delete product (admin only)
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: ProductIdParamSchema }),
  asyncHandler(productController.delete),
);

export const productRouter: Router = router;
