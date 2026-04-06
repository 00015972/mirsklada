/**
 * Payment Service
 * Business logic for payments and debt management
 */
import { prisma, Prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "CLICK" | "PAYME";

export interface RecordPaymentInput {
  orderId?: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentFilters {
  clientId?: string;
  orderId?: string;
  method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
}

class PaymentService {
  async findAll(tenantId: string, filters: PaymentFilters = {}) {
    const where: Prisma.PaymentWhereInput = { tenantId };

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.method) where.method = filters.method;

    if (filters.startDate || filters.endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (filters.startDate) createdAt.gte = filters.startDate;
      if (filters.endDate) createdAt.lte = filters.endDate;
      where.createdAt = createdAt;
    }

    return prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
        receivedBy: { select: { id: true, email: true } },
      },
    });
  }

  async findById(tenantId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        client: { select: { id: true, name: true, currentDebt: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
        receivedBy: { select: { id: true, email: true } },
      },
    });

    if (!payment) {
      throw AppError.notFound("Payment not found", "PAYMENT_NOT_FOUND");
    }

    return payment;
  }

  async recordPayment(
    tenantId: string,
    userId: string,
    data: RecordPaymentInput,
  ) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });

    if (!client)
      throw AppError.notFound("Client not found", "CLIENT_NOT_FOUND");

    let order = null;
    if (data.orderId) {
      order = await prisma.order.findFirst({
        where: { id: data.orderId, tenantId, clientId: data.clientId },
      });

      if (!order) throw AppError.notFound("Order not found", "ORDER_NOT_FOUND");
      if (order.status === "CANCELLED") {
        throw AppError.badRequest(
          "Cannot pay for cancelled order",
          "ORDER_CANCELLED",
        );
      }
    }

    const amount = Math.round(data.amount);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          clientId: data.clientId,
          orderId: data.orderId,
          amount,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
          receivedById: userId,
        },
        include: {
          client: { select: { id: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
        },
      });

      if (order) {
        const newPaidAmount = order.paidAmount.toNumber() + amount;
        const totalAmount = order.totalAmount.toNumber();

        let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
        if (newPaidAmount >= totalAmount) {
          paymentStatus = "PAID";
        } else if (newPaidAmount > 0) {
          paymentStatus = "PARTIAL";
        }

        await tx.order.update({
          where: { id: order.id },
          data: { paidAmount: newPaidAmount, paymentStatus },
        });
      }

      const currentDebt = client.currentDebt.toNumber();
      const newDebt = Math.max(0, currentDebt - amount);

      await tx.client.update({
        where: { id: data.clientId },
        data: { currentDebt: newDebt },
      });

      await tx.debtLedger.create({
        data: {
          tenantId,
          clientId: data.clientId,
          paymentId: payment.id,
          changeAmount: -amount,
          balanceAfter: newDebt,
          description: data.orderId
            ? `Payment for order ${order?.orderNumber}`
            : "General payment",
        },
      });

      return payment;
    });
  }

  async getDebtLedger(
    tenantId: string,
    clientId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.DebtLedgerWhereInput = { tenantId, clientId };

    if (startDate || endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    return prisma.debtLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, orderNumber: true } },
        payment: { select: { id: true, method: true } },
      },
    });
  }

  async getPaymentSummary(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.PaymentWhereInput = { tenantId };

    if (startDate || endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    const payments = await prisma.payment.findMany({
      where,
      select: { method: true, amount: true },
    });

    const byMethod: Record<string, number> = {};
    let total = 0;

    for (const p of payments) {
      const amount = p.amount.toNumber();
      total += amount;
      const method = p.method || "UNKNOWN";
      byMethod[method] = (byMethod[method] || 0) + amount;
    }

    return { total, byMethod, count: payments.length };
  }

  async voidPayment(tenantId: string, paymentId: string, reason: string) {
    const payment = await this.findById(tenantId, paymentId);

    const existingVoid = await prisma.payment.findFirst({
      where: { tenantId, reference: `VOID:${paymentId}` },
    });

    if (existingVoid) {
      throw AppError.conflict(
        "Payment has already been voided",
        "ALREADY_VOIDED",
      );
    }

    const amount = payment.amount.toNumber();

    return prisma.$transaction(async (tx) => {
      const voidRecord = await tx.payment.create({
        data: {
          tenantId,
          clientId: payment.clientId,
          orderId: payment.orderId,
          amount: -amount,
          method: payment.method,
          reference: `VOID:${paymentId}`,
          notes: `Voided: ${reason}`,
          receivedById: payment.receivedById,
        },
      });

      if (payment.orderId && payment.order) {
        const newPaidAmount = payment.order.paidAmount.toNumber() - amount;
        const totalAmount = payment.order.totalAmount.toNumber();

        let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
        if (newPaidAmount >= totalAmount) {
          paymentStatus = "PAID";
        } else if (newPaidAmount > 0) {
          paymentStatus = "PARTIAL";
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paidAmount: Math.max(0, newPaidAmount), paymentStatus },
        });
      }

      const newDebt = payment.client.currentDebt.toNumber() + amount;

      await tx.client.update({
        where: { id: payment.clientId },
        data: { currentDebt: newDebt },
      });

      await tx.debtLedger.create({
        data: {
          tenantId,
          clientId: payment.clientId,
          paymentId: voidRecord.id,
          changeAmount: amount,
          balanceAfter: newDebt,
          description: `Payment void: ${reason}`,
        },
      });

      return voidRecord;
    });
  }
}

export const paymentService = new PaymentService();
