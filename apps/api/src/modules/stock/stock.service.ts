/**
 * Stock Service
 * Business logic for stock movements with transactions
 */
import { prisma, Prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";

// Simple weight rounding utility - avoids Decimal type issues
const round2 = (n: number) => Math.round(n * 100) / 100;

export type MovementType = "IN" | "OUT" | "ADJUST";

export interface CreateStockMovementInput {
  productId: string;
  type: MovementType;
  quantityKg: number;
  reason?: string;
  reference?: string;
}

export interface StockMovementFilters {
  productId?: string;
  type?: MovementType;
  startDate?: Date;
  endDate?: Date;
}

class StockService {
  async getMovements(tenantId: string, filters: StockMovementFilters = {}) {
    const where: Prisma.StockMovementWhereInput = { tenantId };

    if (filters.productId) where.productId = filters.productId;
    if (filters.type) where.type = filters.type;

    if (filters.startDate || filters.endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (filters.startDate) createdAt.gte = filters.startDate;
      if (filters.endDate) createdAt.lte = filters.endDate;
      where.createdAt = createdAt;
    }

    return prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        performedBy: { select: { id: true, email: true } },
      },
    });
  }

  async getMovementById(tenantId: string, movementId: string) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id: movementId, tenantId },
      include: {
        product: {
          select: { id: true, name: true, unit: true, currentStockKg: true },
        },
        performedBy: { select: { id: true, email: true } },
      },
    });

    if (!movement) {
      throw AppError.notFound("Stock movement not found", "MOVEMENT_NOT_FOUND");
    }

    return movement;
  }

  async recordMovement(
    tenantId: string,
    userId: string,
    data: CreateStockMovementInput,
  ) {
    const inputQuantity = round2(data.quantityKg);

    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId },
    });

    if (!product) {
      throw AppError.notFound("Product not found", "PRODUCT_NOT_FOUND");
    }

    const currentStock = product.currentStockKg.toNumber();
    let newStock: number;
    let movementQuantity: number;

    switch (data.type) {
      case "IN":
        newStock = round2(currentStock + inputQuantity);
        movementQuantity = inputQuantity;
        break;
      case "OUT":
        if (inputQuantity > currentStock) {
          throw AppError.badRequest(
            `Insufficient stock. Available: ${currentStock} kg`,
            "INSUFFICIENT_STOCK",
          );
        }
        newStock = round2(currentStock - inputQuantity);
        movementQuantity = -inputQuantity;
        break;
      case "ADJUST":
        newStock = inputQuantity;
        movementQuantity = round2(inputQuantity - currentStock);
        break;
      default:
        throw AppError.badRequest(
          "Invalid movement type",
          "INVALID_MOVEMENT_TYPE",
        );
    }

    return prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: { currentStockKg: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          type: data.type,
          quantityKg: movementQuantity,
          balanceAfterKg: newStock,
          reason: data.reason,
          reference: data.reference,
          performedById: userId,
        },
        include: { product: { select: { id: true, name: true, unit: true } } },
      });

      return { movement, product: updatedProduct };
    });
  }

  async bulkIntake(
    tenantId: string,
    userId: string,
    items: { productId: string; quantityKg: number }[],
    reference?: string,
  ) {
    const results = [];

    for (const item of items) {
      const result = await this.recordMovement(tenantId, userId, {
        productId: item.productId,
        type: "IN",
        quantityKg: item.quantityKg,
        reason: "Bulk intake",
        reference,
      });
      results.push(result);
    }

    return results;
  }

  async getCurrentStockLevels(tenantId: string, categoryId?: string) {
    const where: Prisma.ProductWhereInput = { tenantId, isActive: true };
    if (categoryId) where.categoryId = categoryId;

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        unit: true,
        currentStockKg: true,
        minStockKg: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });
  }

  async getProductMovementSummary(
    tenantId: string,
    productId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.StockMovementWhereInput = { tenantId, productId };

    if (startDate || endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      select: { type: true, quantityKg: true },
    });

    let totalIn = 0;
    let totalOut = 0;
    let adjustments = 0;

    for (const m of movements) {
      const qty = m.quantityKg.toNumber();
      switch (m.type) {
        case "IN":
          totalIn += qty;
          break;
        case "OUT":
          totalOut += Math.abs(qty);
          break;
        case "ADJUST":
          adjustments += qty;
          break;
      }
    }

    return {
      totalIn: round2(totalIn),
      totalOut: round2(totalOut),
      adjustments: round2(adjustments),
      netChange: round2(totalIn - totalOut + adjustments),
      movementCount: movements.length,
    };
  }
}

export const stockService = new StockService();
