/**
 * PDF Generator Utility
 * Generates PDF receipts for orders
 */

const PDFDocument = require('pdfkit');
const { formatPrice } = require('./price-calculator');

/**
 * Generate order receipt PDF
 * 
 * @param {Object} order - Order data with items and client
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateOrderReceipt = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('RECEIPT', { align: 'center' });
      doc.moveDown();

      // Order info
      doc.fontSize(12);
      doc.text(`Order #: ${order.order_number}`);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.moveDown();

      // Client info
      if (order.client) {
        doc.text('Client Information:', { underline: true });
        doc.text(`Name: ${order.client.name}`);
        if (order.client.phone) doc.text(`Phone: ${order.client.phone}`);
        if (order.delivery_address) doc.text(`Delivery: ${order.delivery_address}`);
        doc.moveDown();
      }

      // Items table header
      doc.text('Order Items:', { underline: true });
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.text('Product', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Unit', 300, tableTop);
      doc.text('Price', 370, tableTop);
      doc.text('Total', 450, tableTop);
      
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      // Items
      let y = tableTop + 25;
      for (const item of order.items || []) {
        doc.text(item.product?.name || 'Product', 50, y, { width: 190 });
        doc.text(item.quantity.toString(), 250, y);
        doc.text(item.unit?.abbreviation || '-', 300, y);
        doc.text(formatPrice(item.unit_price), 370, y);
        doc.text(formatPrice(item.total_price), 450, y);
        y += 20;
      }

      // Totals
      doc.moveTo(50, y + 5)
         .lineTo(550, y + 5)
         .stroke();
      
      y += 15;
      doc.text('Subtotal:', 370, y);
      doc.text(formatPrice(order.subtotal), 450, y);
      
      y += 20;
      doc.fontSize(14).text('TOTAL:', 370, y, { bold: true });
      doc.text(formatPrice(order.total_amount), 450, y);

      y += 30;
      doc.fontSize(12);
      doc.text(`Paid: ${formatPrice(order.paid_amount)}`, 370, y);
      y += 15;
      const balance = order.total_amount - order.paid_amount;
      doc.text(`Balance: ${formatPrice(balance)}`, 370, y);

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
      doc.text('MirSklada Inventory Management System', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate daily sales report PDF
 * 
 * @param {Object} data - Report data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateDailySalesReport = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(18).text('Daily Sales Report', { align: 'center' });
      doc.fontSize(12).text(`Date: ${data.date}`, { align: 'center' });
      doc.moveDown();

      // Summary
      doc.text('Summary:', { underline: true });
      doc.text(`Total Orders: ${data.totalOrders}`);
      doc.text(`Total Sales: ${formatPrice(data.totalSales)}`);
      doc.text(`Total Paid: ${formatPrice(data.totalPaid)}`);
      doc.text(`Outstanding: ${formatPrice(data.totalOutstanding)}`);
      doc.moveDown();

      // Orders list
      doc.text('Orders:', { underline: true });
      for (const order of data.orders || []) {
        doc.text(`• ${order.order_number} - ${order.client_name}: ${formatPrice(order.total_amount)}`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateOrderReceipt,
  generateDailySalesReport,
};
