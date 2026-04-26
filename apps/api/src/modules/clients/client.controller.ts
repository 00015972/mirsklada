/**
 * Client Controller
 * HTTP request handlers for client endpoints
 */
import { Request, Response } from "express";
import { clientService } from "./client.service";

class ClientController {
  /**
   * GET /clients
   */
  async findAll(req: Request, res: Response) {
    const filters = {
      search: req.query.search as string | undefined,
      isActive:
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined,
      hasDebt: req.query.hasDebt === "true",
    };

    const clients = await clientService.findAll(req.tenantId!, filters);
    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  }

  /**
   * GET /clients/debtors
   */
  async getDebtors(req: Request, res: Response) {
    const clients = await clientService.getDebtors(req.tenantId!);
    const totalDebt = await clientService.getTotalDebt(req.tenantId!);

    res.json({
      success: true,
      data: clients,
      count: clients.length,
      totalDebt,
    });
  }

  /**
   * GET /clients/:id
   */
  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const client = await clientService.findById(req.tenantId!, id);
    res.json({
      success: true,
      data: client,
    });
  }

  /**
   * GET /clients/:id/with-orders
   */
  async findByIdWithOrders(req: Request, res: Response) {
    const id = req.params.id as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const client = await clientService.findByIdWithOrders(
      req.tenantId!,
      id,
      limit,
    );
    res.json({
      success: true,
      data: client,
    });
  }

  /**
   * POST /clients
   */
  async create(req: Request, res: Response) {
    const client = await clientService.create(
      req.tenantId!,
      req.body,
      req.subscriptionTier ?? "basic",
    );
    res.status(201).json({
      success: true,
      data: client,
    });
  }

  /**
   * PATCH /clients/:id
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const client = await clientService.update(req.tenantId!, id, req.body);
    res.json({
      success: true,
      data: client,
    });
  }

  /**
   * DELETE /clients/:id
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await clientService.delete(req.tenantId!, id);
    res.status(204).send();
  }
}

export const clientController = new ClientController();
