/**
 * Payment Controller
 * HTTP request handlers for payment endpoints
 */
import { Request, Response } from "express";
import { paymentService, PaymentMethod } from "./payment.service";

class PaymentController {
  /**
   * GET /payments
   */
  async findAll(req: Request, res: Response) {
    const filters = {
      clientId: req.query.clientId as string | undefined,
      orderId: req.query.orderId as string | undefined,
      method: req.query.method as PaymentMethod | undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const payments = await paymentService.findAll(req.tenantId!, filters);
    res.json({
      success: true,
      data: payments,
      count: payments.length,
    });
  }

  /**
   * GET /payments/:id
   */
  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const payment = await paymentService.findById(req.tenantId!, id);
    res.json({
      success: true,
      data: payment,
    });
  }

  /**
   * POST /payments
   */
  async recordPayment(req: Request, res: Response) {
    const payment = await paymentService.recordPayment(
      req.tenantId!,
      req.userId!,
      req.body,
    );
    res.status(201).json({
      success: true,
      data: payment,
    });
  }

  /**
   * POST /payments/:id/void
   */
  async voidPayment(req: Request, res: Response) {
    const id = req.params.id as string;
    const { reason } = req.body;
    const voidRecord = await paymentService.voidPayment(
      req.tenantId!,
      id,
      reason,
    );
    res.json({
      success: true,
      data: voidRecord,
    });
  }

  /**
   * GET /payments/summary
   */
  async getSummary(req: Request, res: Response) {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const summary = await paymentService.getPaymentSummary(
      req.tenantId!,
      startDate,
      endDate,
    );
    res.json({
      success: true,
      data: summary,
    });
  }

  /**
   * GET /payments/ledger/:clientId
   */
  async getDebtLedger(req: Request, res: Response) {
    const clientId = req.params.clientId as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const ledger = await paymentService.getDebtLedger(
      req.tenantId!,
      clientId,
      startDate,
      endDate,
    );
    res.json({
      success: true,
      data: ledger,
      count: ledger.length,
    });
  }
}

export const paymentController = new PaymentController();
