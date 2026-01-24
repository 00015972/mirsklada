/**
 * Suppliers Routes - Stub
 */
const express = require('express');
const router = express.Router();
const { authMiddleware, managerAndAbove } = require('../../middlewares');

router.use(authMiddleware);
router.use(managerAndAbove);

// TODO: Implement supplier routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Suppliers module - Coming soon' });
});

module.exports = router;
