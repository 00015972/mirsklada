/**
 * Order Controller
 * HTTP request handlers for order endpoints
 */
import { Request, Response } from "express";
import { orderService, OrderStatus, PaymentStatus } from "./order.service";

class OrderController {
  /**
   * GET /orders
   */
  async findAll(req: Request, res: Response) {
    const filters = {
      clientId: req.query.clientId as string | undefined,
      status: req.query.status as OrderStatus | undefined,
      paymentStatus: req.query.paymentStatus as PaymentStatus | PaymentStatus[] | undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const orders = await orderService.findAll(req.tenantId!, filters);
    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  }

  /**
   * GET /orders/:id
   */
  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const order = await orderService.findById(req.tenantId!, id);
    res.json({
      success: true,
      data: order,
    });
  }

  /**
   * POST /orders
   */
  async create(req: Request, res: Response) {
    const order = await orderService.create(
      req.tenantId!,
      req.userId!,
      req.body,
    );
    res.status(201).json({
      success: true,
      data: order,
    });
  }

  /**
   * POST /orders/:id/confirm
   */
  async confirm(req: Request, res: Response) {
    const id = req.params.id as string;
    const order = await orderService.confirm(req.tenantId!, req.userId!, id);
    res.json({
      success: true,
      data: order,
    });
  }

  /**
   * POST /orders/:id/cancel
   */
  async cancel(req: Request, res: Response) {
    const id = req.params.id as string;
    const order = await orderService.cancel(req.tenantId!, id);
    res.json({
      success: true,
      data: order,
    });
  }

  /**
   * PATCH /orders/:id
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const order = await orderService.update(req.tenantId!, id, req.body);
    res.json({
      success: true,
      data: order,
    });
  }
}

export const orderController = new OrderController();
