/**
 * Orders Routes - Stub
 */
const express = require('express');
const router = express.Router();
const { authMiddleware, anyRole, filterOwnOrders } = require('../../middlewares');

router.use(authMiddleware);
router.use(anyRole);

// TODO: Implement order routes
router.get('/', filterOwnOrders, (req, res) => {
  res.json({ success: true, message: 'Orders module - Coming soon' });
});

module.exports = router;
