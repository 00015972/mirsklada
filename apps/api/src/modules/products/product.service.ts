/**
 * Product Service
 * Business logic for products with weight-based calculations
 */
import { prisma, Prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";
import { roundWeight, TIER_LIMITS } from "@mirsklada/shared";

export interface CreateProductInput {
  categoryId?: string;
  name: string;
  description?: string;
  unit?: string;
  basePricePerKg: number;
  currentStockKg?: number;
  minStockKg?: number;
}

export interface UpdateProductInput {
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  unit?: string;
  basePricePerKg?: number;
  minStockKg?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

class ProductService {
  /**
   * Get all products for a tenant with optional filters
   */
  async findAll(tenantId: string, filters: ProductFilters = {}) {
    const where: Prisma.ProductWhereInput = { tenantId };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Default to showing only active products unless explicitly set to false
    if (filters.isActive === undefined) {
      where.isActive = true;
    } else if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // Filter low stock products if requested
    if (filters.lowStock) {
      return products.filter(
        (p) => p.currentStockKg.toNumber() <= p.minStockKg.toNumber(),
      );
    }

    return products;
  }

  /**
   * Get a single product by ID
   */
  async findById(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      throw AppError.notFound("Product not found", "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  /**
   * Create a new product
   */
  async create(
    tenantId: string,
    data: CreateProductInput,
    subscriptionTier: "basic" | "pro" = "basic",
  ) {
    const limit = TIER_LIMITS[subscriptionTier].maxProducts;
    if (isFinite(limit)) {
      const count = await prisma.product.count({
        where: { tenantId, isActive: true },
      });
      if (count >= limit) {
        throw AppError.forbidden(
          `Basic plan allows up to ${limit} products. Upgrade to Pro for unlimited products.`,
          "LIMIT_EXCEEDED",
        );
      }
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) {
        throw AppError.badRequest("Category not found", "INVALID_CATEGORY");
      }
    }

    // Check for duplicate name
    const existing = await prisma.product.findFirst({
      where: {
        tenantId,
        name: { equals: data.name, mode: "insensitive" },
      },
    });

    if (existing) {
      throw AppError.conflict(
        "Product with this name already exists",
        "PRODUCT_EXISTS",
      );
    }

    return prisma.product.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        unit: data.unit ?? "kg",
        basePricePerKg: data.basePricePerKg,
        currentStockKg: roundWeight(data.currentStockKg ?? 0),
        minStockKg: roundWeight(data.minStockKg ?? 0),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Update a product
   */
  async update(tenantId: string, productId: string, data: UpdateProductInput) {
    // Verify product exists
    await this.findById(tenantId, productId);

    // Validate category if updating
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) {
        throw AppError.badRequest("Category not found", "INVALID_CATEGORY");
      }
    }

    // Check for duplicate name if updating name
    if (data.name) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          name: { equals: data.name, mode: "insensitive" },
          id: { not: productId },
        },
      });

      if (existing) {
        throw AppError.conflict(
          "Product with this name already exists",
          "PRODUCT_EXISTS",
        );
      }
    }

    // Round weight values if provided
    const updateData: Prisma.ProductUpdateInput = { ...data };
    if (data.minStockKg !== undefined) {
      updateData.minStockKg = roundWeight(data.minStockKg);
    }

    return prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Delete a product (soft delete by setting isActive = false)
   */
  async delete(tenantId: string, productId: string) {
    await this.findById(tenantId, productId);

    // Soft delete - set isActive to false
    return prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete a product (permanent)
   */
  async hardDelete(tenantId: string, productId: string) {
    await this.findById(tenantId, productId);

    // Check for order items
    const orderItems = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderItems > 0) {
      throw AppError.conflict(
        `Cannot delete product with ${orderItems} order items. Use soft delete instead.`,
        "PRODUCT_HAS_ORDERS",
      );
    }

    return prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Get products with low stock
   */
  async getLowStock(tenantId: string) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return products.filter(
      (p) => p.currentStockKg.toNumber() <= p.minStockKg.toNumber(),
    );
  }
}

export const productService = new ProductService();
