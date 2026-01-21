/**
 * Category Service
 * Business logic for product categories
 */
import { prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";

export interface CreateCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  sortOrder?: number;
}

class CategoryService {
  /**
   * Get all categories for a tenant
   */
  async findAll(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Get a single category by ID
   */
  async findById(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw AppError.notFound("Category not found", "CATEGORY_NOT_FOUND");
    }

    return category;
  }

  /**
   * Create a new category
   */
  async create(tenantId: string, data: CreateCategoryInput) {
    // Check for duplicate name
    const existing = await prisma.category.findFirst({
      where: {
        tenantId,
        name: { equals: data.name, mode: "insensitive" },
      },
    });

    if (existing) {
      throw AppError.conflict(
        "Category with this name already exists",
        "CATEGORY_EXISTS",
      );
    }

    return prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  /**
   * Update a category
   */
  async update(
    tenantId: string,
    categoryId: string,
    data: UpdateCategoryInput,
  ) {
    // Verify category exists and belongs to tenant
    await this.findById(tenantId, categoryId);

    // Check for duplicate name if updating name
    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          tenantId,
          name: { equals: data.name, mode: "insensitive" },
          id: { not: categoryId },
        },
      });

      if (existing) {
        throw AppError.conflict(
          "Category with this name already exists",
          "CATEGORY_EXISTS",
        );
      }
    }

    return prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  /**
   * Delete a category
   */
  async delete(tenantId: string, categoryId: string) {
    // Verify category exists
    const category = await this.findById(tenantId, categoryId);

    // Check if category has products
    if (category._count.products > 0) {
      throw AppError.conflict(
        `Cannot delete category with ${category._count.products} products. Move or delete products first.`,
        "CATEGORY_HAS_PRODUCTS",
      );
    }

    return prisma.category.delete({
      where: { id: categoryId },
    });
  }
}

export const categoryService = new CategoryService();
