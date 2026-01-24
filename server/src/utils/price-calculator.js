/**
 * Price Calculator Utility
 * Handles complex price calculations with unit conversions
 */

const Decimal = require('decimal.js');

/**
 * Get the effective price for a product
 * Priority: 1. Client price, 2. Product unit price, 3. Base product price
 * 
 * @param {Object} product - Product object
 * @param {Object} options - Options
 * @param {string} options.clientId - Client ID for custom pricing
 * @param {string} options.unitId - Unit ID
 * @param {Array} options.clientPrices - Client-specific prices
 * @param {Array} options.productUnits - Product units with prices
 * @returns {Decimal} Price per unit
 */
const getEffectivePrice = (product, options = {}) => {
  const { clientId, unitId, clientPrices = [], productUnits = [] } = options;

  // 1. Check for client-specific price
  if (clientId && clientPrices.length > 0) {
    const clientPrice = clientPrices.find(
      cp => cp.client_id === clientId && 
           cp.product_id === product.id && 
           cp.unit_id === unitId
    );
    if (clientPrice) {
      return new Decimal(clientPrice.custom_price);
    }
  }

  // 2. Check for product unit price
  if (unitId && unitId !== product.base_unit_id && productUnits.length > 0) {
    const productUnit = productUnits.find(
      pu => pu.product_id === product.id && pu.unit_id === unitId
    );
    if (productUnit && productUnit.selling_price) {
      return new Decimal(productUnit.selling_price);
    }
  }

  // 3. Return base product selling price
  return new Decimal(product.selling_price);
};

/**
 * Calculate line item total
 * 
 * @param {number} quantity - Quantity ordered
 * @param {number} unitPrice - Price per unit
 * @returns {Decimal} Total price
 */
const calculateLineTotal = (quantity, unitPrice) => {
  const qty = new Decimal(quantity);
  const price = new Decimal(unitPrice);
  return qty.times(price).toDecimalPlaces(2);
};

/**
 * Calculate order subtotal
 * 
 * @param {Array} items - Order items with quantity and unitPrice
 * @returns {Decimal} Subtotal
 */
const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => {
    const lineTotal = calculateLineTotal(item.quantity, item.unit_price);
    return sum.plus(lineTotal);
  }, new Decimal(0)).toDecimalPlaces(2);
};

/**
 * Convert quantity to base unit
 * 
 * @param {number} quantity - Quantity in source unit
 * @param {number} conversionFactor - Conversion factor to base unit
 * @returns {Decimal} Quantity in base units
 */
const convertToBaseUnit = (quantity, conversionFactor) => {
  const qty = new Decimal(quantity);
  const factor = new Decimal(conversionFactor);
  return qty.times(factor).toDecimalPlaces(2);
};

/**
 * Calculate profit margin
 * 
 * @param {number} purchasePrice - Cost price
 * @param {number} sellingPrice - Selling price
 * @returns {Object} Profit amount and percentage
 */
const calculateProfitMargin = (purchasePrice, sellingPrice) => {
  const cost = new Decimal(purchasePrice);
  const sell = new Decimal(sellingPrice);
  
  const profit = sell.minus(cost);
  const marginPercent = cost.isZero() 
    ? new Decimal(100) 
    : profit.dividedBy(cost).times(100).toDecimalPlaces(2);

  return {
    profit: profit.toNumber(),
    marginPercent: marginPercent.toNumber(),
  };
};

/**
 * Format price for display (UZS)
 * 
 * @param {number} amount - Amount to format
 * @returns {string} Formatted price
 */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' UZS';
};

module.exports = {
  getEffectivePrice,
  calculateLineTotal,
  calculateSubtotal,
  convertToBaseUnit,
  calculateProfitMargin,
  formatPrice,
};
