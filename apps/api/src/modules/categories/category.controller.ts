/**
 * Category Controller
 * HTTP request handlers for category endpoints
 */
import { Request, Response } from "express";
import { categoryService } from "./category.service";

class CategoryController {
  /**
   * GET /categories
   */
  async findAll(req: Request, res: Response) {
    const categories = await categoryService.findAll(req.tenantId!);
    res.json({
      success: true,
      data: categories,
    });
  }

  /**
   * GET /categories/:id
   */
  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const category = await categoryService.findById(req.tenantId!, id);
    res.json({
      success: true,
      data: category,
    });
  }

  /**
   * POST /categories
   */
  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.tenantId!, req.body);
    res.status(201).json({
      success: true,
      data: category,
    });
  }

  /**
   * PATCH /categories/:id
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const category = await categoryService.update(req.tenantId!, id, req.body);
    res.json({
      success: true,
      data: category,
    });
  }

  /**
   * DELETE /categories/:id
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await categoryService.delete(req.tenantId!, id);
    res.status(204).send();
  }
}

export const categoryController = new CategoryController();
