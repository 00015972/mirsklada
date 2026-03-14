/**
 * Product Controller
 * HTTP request handlers for product endpoints
 */
import { Request, Response } from "express";
import { productService } from "./product.service";

class ProductController {
  /**
   * GET /products
   */
  async findAll(req: Request, res: Response) {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      search: req.query.search as string | undefined,
      isActive:
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined,
      lowStock: req.query.lowStock === "true",
    };

    const products = await productService.findAll(req.tenantId!, filters);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  }

  /**
   * GET /products/low-stock
   */
  async getLowStock(req: Request, res: Response) {
    const products = await productService.getLowStock(req.tenantId!);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  }

  /**
   * GET /products/:id
   */
  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const product = await productService.findById(req.tenantId!, id);
    res.json({
      success: true,
      data: product,
    });
  }

  /**
   * POST /products
   */
  async create(req: Request, res: Response) {
    const product = await productService.create(req.tenantId!, req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  }

  /**
   * PATCH /products/:id
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const product = await productService.update(req.tenantId!, id, req.body);
    res.json({
      success: true,
      data: product,
    });
  }

  /**
   * DELETE /products/:id (soft delete)
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await productService.delete(req.tenantId!, id);
    res.status(204).send();
  }
}

export const productController = new ProductController();
