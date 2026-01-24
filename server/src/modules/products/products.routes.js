/**
 * Products Routes
 * @module products
 */

const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authMiddleware, managerAndAbove, anyRole, canViewPurchasePrice } = require('../../middlewares');

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/products - Get all products
router.get('/', anyRole, canViewPurchasePrice, productsController.getAll);

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', anyRole, canViewPurchasePrice, productsController.getById);

// POST /api/v1/products - Create product
router.post('/', managerAndAbove, productsController.create);

// PUT /api/v1/products/:id - Update product
router.put('/:id', managerAndAbove, productsController.update);

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', managerAndAbove, productsController.delete);

// GET /api/v1/products/:id/units - Get product units
router.get('/:id/units', anyRole, productsController.getProductUnits);

// POST /api/v1/products/:id/units - Add product unit
router.post('/:id/units', managerAndAbove, productsController.addProductUnit);

// DELETE /api/v1/products/:id/units/:unitId - Remove product unit
router.delete('/:id/units/:unitId', managerAndAbove, productsController.removeProductUnit);

// GET /api/v1/products/low-stock - Get low stock products
router.get('/alerts/low-stock', managerAndAbove, productsController.getLowStock);

module.exports = router;
