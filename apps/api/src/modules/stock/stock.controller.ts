/**
 * Stock Controller
 * HTTP request handlers for stock endpoints
 */
import { Request, Response } from "express";
import { stockService, MovementType } from "./stock.service";

class StockController {
  /**
   * GET /stock/movements
   */
  async getMovements(req: Request, res: Response) {
    const filters = {
      productId: req.query.productId as string | undefined,
      type: req.query.type as MovementType | undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const movements = await stockService.getMovements(req.tenantId!, filters);
    res.json({
      success: true,
      data: movements,
      count: movements.length,
    });
  }

  /**
   * GET /stock/movements/:id
   */
  async getMovementById(req: Request, res: Response) {
    const id = req.params.id as string;
    const movement = await stockService.getMovementById(req.tenantId!, id);
    res.json({
      success: true,
      data: movement,
    });
  }

  /**
   * POST /stock/movements
   */
  async recordMovement(req: Request, res: Response) {
    const result = await stockService.recordMovement(
      req.tenantId!,
      req.userId!,
      req.body,
    );
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /stock/bulk-intake
   */
  async bulkIntake(req: Request, res: Response) {
    const { items, reference } = req.body;
    const results = await stockService.bulkIntake(
      req.tenantId!,
      req.userId!,
      items,
      reference,
    );
    res.status(201).json({
      success: true,
      data: results,
      count: results.length,
    });
  }

  /**
   * GET /stock/levels
   */
  async getCurrentLevels(req: Request, res: Response) {
    const categoryId = req.query.categoryId as string | undefined;
    const levels = await stockService.getCurrentStockLevels(
      req.tenantId!,
      categoryId,
    );
    res.json({
      success: true,
      data: levels,
      count: levels.length,
    });
  }

  /**
   * GET /stock/summary/:productId
   */
  async getProductSummary(req: Request, res: Response) {
    const productId = req.params.productId as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const summary = await stockService.getProductMovementSummary(
      req.tenantId!,
      productId,
      startDate,
      endDate,
    );
    res.json({
      success: true,
      data: summary,
    });
  }
}

export const stockController = new StockController();
