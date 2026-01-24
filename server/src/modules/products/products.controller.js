/**
 * Products Controller
 * Handles HTTP requests for product operations
 */

const productsService = require('./products.service');
const { createError } = require('../../middlewares');

const productsController = {
  /**
   * Get all products
   * GET /api/v1/products
   */
  getAll: async (req, res, next) => {
    try {
      const { page, limit, search, categoryId, isActive } = req.query;
      
      const result = await productsService.getAll(req.user.organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search,
        categoryId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      // Hide purchase price for salespersons
      if (req.hidePurchasePrice) {
        result.data = result.data.map(product => {
          const { purchase_price, ...rest } = product;
          return rest;
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product by ID
   * GET /api/v1/products/:id
   */
  getById: async (req, res, next) => {
    try {
      const product = await productsService.getById(
        req.user.organizationId,
        req.params.id
      );

      // Hide purchase price for salespersons
      if (req.hidePurchasePrice) {
        delete product.purchase_price;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create product
   * POST /api/v1/products
   */
  create: async (req, res, next) => {
    try {
      const product = await productsService.create(req.user.organizationId, req.body);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update product
   * PUT /api/v1/products/:id
   */
  update: async (req, res, next) => {
    try {
      const product = await productsService.update(
        req.user.organizationId,
        req.params.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete product
   * DELETE /api/v1/products/:id
   */
  delete: async (req, res, next) => {
    try {
      await productsService.delete(req.user.organizationId, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product units
   * GET /api/v1/products/:id/units
   */
  getProductUnits: async (req, res, next) => {
    try {
      const units = await productsService.getProductUnits(
        req.user.organizationId,
        req.params.id
      );

      res.status(200).json({
        success: true,
        data: units,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add product unit
   * POST /api/v1/products/:id/units
   */
  addProductUnit: async (req, res, next) => {
    try {
      const { unitId, conversionFactor, sellingPrice } = req.body;

      const productUnit = await productsService.addProductUnit(
        req.user.organizationId,
        req.params.id,
        { unitId, conversionFactor, sellingPrice }
      );

      res.status(201).json({
        success: true,
        data: productUnit,
        message: 'Product unit added successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove product unit
   * DELETE /api/v1/products/:id/units/:unitId
   */
  removeProductUnit: async (req, res, next) => {
    try {
      await productsService.removeProductUnit(
        req.user.organizationId,
        req.params.id,
        req.params.unitId
      );

      res.status(200).json({
        success: true,
        message: 'Product unit removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get low stock products
   * GET /api/v1/products/alerts/low-stock
   */
  getLowStock: async (req, res, next) => {
    try {
      const products = await productsService.getLowStock(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productsController;
