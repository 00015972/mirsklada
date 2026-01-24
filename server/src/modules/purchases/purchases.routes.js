/**
 * Purchases Routes - Stub
 */
const express = require('express');
const router = express.Router();
const { authMiddleware, managerAndAbove } = require('../../middlewares');

router.use(authMiddleware);
router.use(managerAndAbove);

// TODO: Implement purchase routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Purchases module - Coming soon' });
});

module.exports = router;
