/**
 * Utilities Index
 * Exports all utility modules
 */

const priceCalculator = require('./price-calculator');
const stockManager = require('./stock-manager');
const pdfGenerator = require('./pdf-generator');

module.exports = {
  ...priceCalculator,
  ...stockManager,
  ...pdfGenerator,
};
