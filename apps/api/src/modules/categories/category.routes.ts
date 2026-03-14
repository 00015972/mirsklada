/**
 * Category Routes
 * Express router for category endpoints
 */
import { Router } from "express";
import { categoryController } from "./category.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryIdParamSchema,
} from "./category.schemas";

const router = Router();

// GET /categories - List all categories
router.get("/", asyncHandler(categoryController.findAll));

// GET /categories/:id - Get single category
router.get(
  "/:id",
  validate({ params: CategoryIdParamSchema }),
  asyncHandler(categoryController.findById),
);

// POST /categories - Create category
router.post(
  "/",
  validate({ body: CreateCategorySchema }),
  asyncHandler(categoryController.create),
);

// PATCH /categories/:id - Update category
router.patch(
  "/:id",
  validate({ params: CategoryIdParamSchema, body: UpdateCategorySchema }),
  asyncHandler(categoryController.update),
);

// DELETE /categories/:id - Delete category
router.delete(
  "/:id",
  validate({ params: CategoryIdParamSchema }),
  asyncHandler(categoryController.delete),
);

export const categoryRouter: Router = router;
