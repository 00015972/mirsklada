/**
 * Order Service
 * Business logic for orders with price calculation and stock management
 */
import { prisma, Prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";

// Simple weight rounding utility
const round2 = (n: number) => Math.round(n * 100) / 100;

export type OrderStatus = "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface OrderItemInput {
  productId: string;
  quantityKg: number;
  pricePerKg?: number;
}

export interface CreateOrderInput {
  clientId: string;
  items: OrderItemInput[];
  notes?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  notes?: string;
}

export interface OrderFilters {
  clientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

class OrderService {
  async findAll(tenantId: string, filters: OrderFilters = {}) {
    const where: Prisma.OrderWhereInput = { tenantId };

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async findById(tenantId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        client: {
          select: { id: true, name: true, phone: true, currentDebt: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
        createdBy: { select: { id: true, email: true } },
      },
    });

    if (!order) {
      throw AppError.notFound("Order not found", "ORDER_NOT_FOUND");
    }

    return order;
  }

  async create(tenantId: string, userId: string, data: CreateOrderInput) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });

    if (!client)
      throw AppError.notFound("Client not found", "CLIENT_NOT_FOUND");
    if (!client.isActive)
      throw AppError.badRequest("Client is inactive", "CLIENT_INACTIVE");

    const itemsWithPrices = await this.prepareOrderItems(
      tenantId,
      data.clientId,
      data.items,
    );
    const totalKg = itemsWithPrices.reduce((sum, i) => sum + i.quantityKg, 0);
    const totalAmount = itemsWithPrices.reduce(
      (sum, i) => sum + i.lineTotal,
      0,
    );
    const orderNumber = await this.generateOrderNumber(tenantId);

    return prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          tenantId,
          clientId: data.clientId,
          createdById: userId,
          orderNumber,
          status: "DRAFT",
          paymentStatus: "UNPAID",
          totalKg: round2(totalKg),
          totalAmount: Math.round(totalAmount),
          paidAmount: 0,
          notes: data.notes,
          items: {
            create: itemsWithPrices.map((item) => ({
              tenantId,
              productId: item.productId,
              quantityKg: item.quantityKg,
              pricePerKg: item.pricePerKg,
              lineTotal: Math.round(item.lineTotal),
            })),
          },
        },
        include: {
          client: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });
    });
  }

  async confirm(tenantId: string, userId: string, orderId: string) {
    const order = await this.findById(tenantId, orderId);

    if (order.status !== "DRAFT") {
      throw AppError.badRequest(
        `Cannot confirm order with status ${order.status}`,
        "INVALID_STATUS",
      );
    }

    return prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;

        const currentStock = product.currentStockKg.toNumber();
        const quantity = item.quantityKg.toNumber();

        if (quantity > currentStock) {
          throw AppError.badRequest(
            `Insufficient stock for ${product.name}. Available: ${currentStock} kg`,
            "INSUFFICIENT_STOCK",
          );
        }

        const newStock = round2(currentStock - quantity);

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStockKg: newStock },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: "OUT",
            quantityKg: -quantity,
            balanceAfterKg: newStock,
            reason: `Order ${order.orderNumber}`,
            reference: order.id,
            performedById: userId,
          },
        });
      }

      const totalAmount = order.totalAmount.toNumber();
      const paidAmount = order.paidAmount.toNumber();
      const debtIncrease = totalAmount - paidAmount;

      if (debtIncrease > 0) {
        const currentDebt = order.client.currentDebt.toNumber();
        const newDebt = currentDebt + debtIncrease;

        await tx.client.update({
          where: { id: order.clientId },
          data: { currentDebt: newDebt },
        });

        await tx.debtLedger.create({
          data: {
            tenantId,
            clientId: order.clientId,
            orderId: order.id,
            changeAmount: debtIncrease,
            balanceAfter: newDebt,
            description: `Order ${order.orderNumber}`,
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
        include: {
          client: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });
    });
  }

  async cancel(tenantId: string, orderId: string) {
    const order = await this.findById(tenantId, orderId);

    if (order.status === "COMPLETED") {
      throw AppError.badRequest(
        "Cannot cancel completed order",
        "CANNOT_CANCEL_COMPLETED",
      );
    }
    if (order.status === "CANCELLED") {
      throw AppError.badRequest(
        "Order is already cancelled",
        "ALREADY_CANCELLED",
      );
    }

    if (order.status === "CONFIRMED") {
      return prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const quantity = item.quantityKg.toNumber();
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStockKg: { increment: quantity } },
          });
        }

        const debtAmount =
          order.totalAmount.toNumber() - order.paidAmount.toNumber();
        if (debtAmount > 0) {
          await tx.client.update({
            where: { id: order.clientId },
            data: { currentDebt: { decrement: debtAmount } },
          });
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
      });
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }

  async update(tenantId: string, orderId: string, data: UpdateOrderInput) {
    const order = await this.findById(tenantId, orderId);

    if (order.status === "CANCELLED") {
      throw AppError.badRequest(
        "Cannot update cancelled order",
        "ORDER_CANCELLED",
      );
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { notes: data.notes },
    });
  }

  private async prepareOrderItems(
    tenantId: string,
    clientId: string,
    items: OrderItemInput[],
  ) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: { priceMatrix: { include: { items: true } } },
    });

    const priceMap = new Map<string, number>();
    if (client?.priceMatrix) {
      for (const item of client.priceMatrix.items) {
        priceMap.set(item.productId, item.customPriceKg.toNumber());
      }
    }

    const result: {
      productId: string;
      quantityKg: number;
      pricePerKg: number;
      lineTotal: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId },
      });

      if (!product)
        throw AppError.notFound(
          `Product not found: ${item.productId}`,
          "PRODUCT_NOT_FOUND",
        );
      if (!product.isActive)
        throw AppError.badRequest(
          `Product ${product.name} is inactive`,
          "PRODUCT_INACTIVE",
        );

      const pricePerKg =
        item.pricePerKg ??
        priceMap.get(item.productId) ??
        product.basePricePerKg.toNumber();
      const quantityKg = round2(item.quantityKg);
      const lineTotal = quantityKg * pricePerKg;

      result.push({
        productId: item.productId,
        quantityKg,
        pricePerKg,
        lineTotal,
      });
    }

    return result;
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    const lastOrder = await prisma.order.findFirst({
      where: { tenantId, orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
    });

    let sequence = 1;
    if (lastOrder?.orderNumber) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }
}

export const orderService = new OrderService();
