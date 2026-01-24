/**
 * Stock Manager Utility
 * Handles stock updates and audit trail
 */

const { supabaseAdmin } = require('../config/database');
const { STOCK_MOVEMENT_TYPES } = require('../config/constants');
const { createError } = require('../middlewares');
const Decimal = require('decimal.js');

/**
 * Update stock quantity for a product
 * 
 * @param {Object} options - Options
 * @param {string} options.organizationId - Organization ID
 * @param {string} options.productId - Product ID
 * @param {number} options.quantity - Quantity to add (positive) or subtract (negative)
 * @param {string} options.movementType - Type of movement (purchase_in, sale_out, adjustment)
 * @param {string} options.referenceType - Reference type (purchase, order, adjustment)
 * @param {string} options.referenceId - Reference ID (purchase_id, order_id)
 * @param {string} options.userId - User performing the action
 * @param {string} options.notes - Optional notes
 * @returns {Object} Updated product
 */
const updateStock = async (options) => {
  const {
    organizationId,
    productId,
    quantity,
    movementType,
    referenceType,
    referenceId,
    userId,
    notes,
  } = options;

  // Get current stock
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('stock_quantity, name')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !product) {
    throw createError.notFound('Product');
  }

  const currentStock = new Decimal(product.stock_quantity);
  const changeQty = new Decimal(quantity);
  const newStock = currentStock.plus(changeQty);

  // Prevent negative stock
  if (newStock.isNegative()) {
    throw createError.insufficientStock(
      product.name,
      currentStock.toNumber(),
      Math.abs(quantity)
    );
  }

  // Update stock
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('products')
    .update({ stock_quantity: newStock.toNumber() })
    .eq('id', productId)
    .select()
    .single();

  if (updateError) {
    throw createError.internal('Failed to update stock');
  }

  // Record movement in audit trail
  await recordStockMovement({
    organizationId,
    productId,
    movementType,
    quantity,
    quantityBefore: currentStock.toNumber(),
    quantityAfter: newStock.toNumber(),
    referenceType,
    referenceId,
    userId,
    notes,
  });

  return updated;
};

/**
 * Record stock movement for audit trail
 */
const recordStockMovement = async (options) => {
  const {
    organizationId,
    productId,
    movementType,
    quantity,
    quantityBefore,
    quantityAfter,
    referenceType,
    referenceId,
    userId,
    notes,
  } = options;

  const { error } = await supabaseAdmin
    .from('stock_movements')
    .insert({
      organization_id: organizationId,
      product_id: productId,
      movement_type: movementType,
      quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      created_by: userId,
      notes,
    });

  if (error) {
    console.error('Failed to record stock movement:', error);
    // Don't throw - stock is already updated, logging failure shouldn't fail the operation
  }
};

/**
 * Process stock for purchase items (increase stock)
 * 
 * @param {string} organizationId - Organization ID
 * @param {string} purchaseId - Purchase ID
 * @param {Array} items - Purchase items
 * @param {string} userId - User ID
 */
const processStockForPurchase = async (organizationId, purchaseId, items, userId) => {
  for (const item of items) {
    // Get conversion factor if not base unit
    let quantity = new Decimal(item.quantity);
    
    if (item.unit_id && item.product) {
      const productUnit = item.product.product_units?.find(
        pu => pu.unit_id === item.unit_id
      );
      if (productUnit) {
        quantity = quantity.times(productUnit.conversion_factor);
      }
    }

    await updateStock({
      organizationId,
      productId: item.product_id,
      quantity: quantity.toNumber(), // Positive for purchase
      movementType: STOCK_MOVEMENT_TYPES.PURCHASE_IN,
      referenceType: 'purchase',
      referenceId: purchaseId,
      userId,
      notes: `Purchase #${purchaseId}`,
    });
  }
};

/**
 * Process stock for order items (decrease stock)
 * 
 * @param {string} organizationId - Organization ID
 * @param {string} orderId - Order ID
 * @param {Array} items - Order items
 * @param {string} userId - User ID
 */
const processStockForOrder = async (organizationId, orderId, items, userId) => {
  for (const item of items) {
    // Get conversion factor if not base unit
    let quantity = new Decimal(item.quantity);
    
    if (item.unit_id && item.product) {
      const productUnit = item.product.product_units?.find(
        pu => pu.unit_id === item.unit_id
      );
      if (productUnit) {
        quantity = quantity.times(productUnit.conversion_factor);
      }
    }

    await updateStock({
      organizationId,
      productId: item.product_id,
      quantity: quantity.negated().toNumber(), // Negative for sale
      movementType: STOCK_MOVEMENT_TYPES.SALE_OUT,
      referenceType: 'order',
      referenceId: orderId,
      userId,
      notes: `Order #${orderId}`,
    });
  }
};

/**
 * Manual stock adjustment
 * 
 * @param {string} organizationId - Organization ID
 * @param {string} productId - Product ID
 * @param {number} newQuantity - New stock quantity
 * @param {string} reason - Reason for adjustment
 * @param {string} userId - User ID
 */
const adjustStock = async (organizationId, productId, newQuantity, reason, userId) => {
  // Get current stock
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .single();

  if (!product) {
    throw createError.notFound('Product');
  }

  const currentStock = new Decimal(product.stock_quantity);
  const newStock = new Decimal(newQuantity);
  const difference = newStock.minus(currentStock);

  return updateStock({
    organizationId,
    productId,
    quantity: difference.toNumber(),
    movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
    referenceType: 'adjustment',
    referenceId: null,
    userId,
    notes: reason,
  });
};

module.exports = {
  updateStock,
  recordStockMovement,
  processStockForPurchase,
  processStockForOrder,
  adjustStock,
};
