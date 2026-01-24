/**
 * Reports Routes - Stub
 */
const express = require('express');
const router = express.Router();
const { authMiddleware, managerAndAbove, ownerOnly } = require('../../middlewares');

router.use(authMiddleware);

// TODO: Implement report routes
router.get('/daily-sales', ownerOnly, (req, res) => {
  res.json({ success: true, message: 'Daily sales report - Coming soon' });
});

router.get('/low-stock', managerAndAbove, (req, res) => {
  res.json({ success: true, message: 'Low stock report - Coming soon' });
});

router.get('/client-debt', ownerOnly, (req, res) => {
  res.json({ success: true, message: 'Client debt report - Coming soon' });
});

router.get('/profit-margin', ownerOnly, (req, res) => {
  res.json({ success: true, message: 'Profit margin report - Coming soon' });
});

module.exports = router;
