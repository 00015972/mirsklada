/**
 * Client Service
 * Business logic for clients with debt tracking
 */
import { prisma, Prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";

export interface CreateClientInput {
  name: string;
  phone?: string;
  telegramId?: string;
  address?: string;
  notes?: string;
}

export interface UpdateClientInput {
  name?: string;
  phone?: string | null;
  telegramId?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
  hasDebt?: boolean;
}

class ClientService {
  async findAll(tenantId: string, filters: ClientFilters = {}) {
    const where: Prisma.ClientWhereInput = { tenantId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (filters.hasDebt) {
      return clients.filter((c) => c.currentDebt.toNumber() > 0);
    }

    return clients;
  }

  async findById(tenantId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw AppError.notFound("Client not found", "CLIENT_NOT_FOUND");
    }

    return client;
  }

  async findByIdWithOrders(
    tenantId: string,
    clientId: string,
    limit: number = 10,
  ) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            items: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!client) {
      throw AppError.notFound("Client not found", "CLIENT_NOT_FOUND");
    }

    return client;
  }

  async create(tenantId: string, data: CreateClientInput) {
    if (data.phone) {
      const existingPhone = await prisma.client.findFirst({
        where: { tenantId, phone: data.phone },
      });
      if (existingPhone) {
        throw AppError.conflict(
          "Client with this phone already exists",
          "PHONE_EXISTS",
        );
      }
    }

    if (data.telegramId) {
      const existingTelegram = await prisma.client.findFirst({
        where: { tenantId, telegramId: data.telegramId },
      });
      if (existingTelegram) {
        throw AppError.conflict(
          "Client with this Telegram ID already exists",
          "TELEGRAM_EXISTS",
        );
      }
    }

    return prisma.client.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        telegramId: data.telegramId,
        address: data.address,
        notes: data.notes,
        currentDebt: 0,
      },
    });
  }

  async update(tenantId: string, clientId: string, data: UpdateClientInput) {
    await this.findById(tenantId, clientId);

    if (data.phone) {
      const existingPhone = await prisma.client.findFirst({
        where: { tenantId, phone: data.phone, id: { not: clientId } },
      });
      if (existingPhone) {
        throw AppError.conflict(
          "Client with this phone already exists",
          "PHONE_EXISTS",
        );
      }
    }

    if (data.telegramId) {
      const existingTelegram = await prisma.client.findFirst({
        where: { tenantId, telegramId: data.telegramId, id: { not: clientId } },
      });
      if (existingTelegram) {
        throw AppError.conflict(
          "Client with this Telegram ID already exists",
          "TELEGRAM_EXISTS",
        );
      }
    }

    return prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        phone: data.phone,
        telegramId: data.telegramId,
        address: data.address,
        notes: data.notes,
        isActive: data.isActive,
      },
    });
  }

  async delete(tenantId: string, clientId: string) {
    const client = await this.findById(tenantId, clientId);

    if (client.currentDebt.toNumber() > 0) {
      throw AppError.conflict(
        "Cannot delete client with outstanding debt",
        "CLIENT_HAS_DEBT",
      );
    }

    return prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });
  }

  async getDebtors(tenantId: string) {
    const clients = await prisma.client.findMany({
      where: { tenantId, isActive: true },
      orderBy: { currentDebt: "desc" },
    });

    return clients.filter((c) => c.currentDebt.toNumber() > 0);
  }

  async getTotalDebt(tenantId: string) {
    const result = await prisma.client.aggregate({
      where: { tenantId, isActive: true },
      _sum: { currentDebt: true },
    });

    return result._sum.currentDebt?.toNumber() ?? 0;
  }
}

export const clientService = new ClientService();
