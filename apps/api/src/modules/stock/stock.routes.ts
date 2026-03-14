/**
 * Stock Routes
 * Express router for stock management endpoints
 */
import { Router } from "express";
import { stockController } from "./stock.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateStockMovementSchema,
  BulkIntakeSchema,
  MovementIdParamSchema,
  ProductIdParamSchema,
  MovementQuerySchema,
  StockLevelsQuerySchema,
  SummaryQuerySchema,
} from "./stock.schemas";

const router = Router();

// GET /stock/levels - Get current stock levels
router.get(
  "/levels",
  validate({ query: StockLevelsQuerySchema }),
  asyncHandler(stockController.getCurrentLevels),
);

// GET /stock/movements - List stock movements
router.get(
  "/movements",
  validate({ query: MovementQuerySchema }),
  asyncHandler(stockController.getMovements),
);

// GET /stock/movements/:id - Get single movement
router.get(
  "/movements/:id",
  validate({ params: MovementIdParamSchema }),
  asyncHandler(stockController.getMovementById),
);

// POST /stock/movements - Record a stock movement
router.post(
  "/movements",
  validate({ body: CreateStockMovementSchema }),
  asyncHandler(stockController.recordMovement),
);

// POST /stock/bulk-intake - Bulk stock intake
router.post(
  "/bulk-intake",
  validate({ body: BulkIntakeSchema }),
  asyncHandler(stockController.bulkIntake),
);

// GET /stock/summary/:productId - Get product movement summary
router.get(
  "/summary/:productId",
  validate({ params: ProductIdParamSchema, query: SummaryQuerySchema }),
  asyncHandler(stockController.getProductSummary),
);

export const stockRouter: Router = router;
