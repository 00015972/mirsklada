/**
 * Clients Routes - Stub
 */
const express = require('express');
const router = express.Router();
const { authMiddleware, anyRole } = require('../../middlewares');

router.use(authMiddleware);
router.use(anyRole);

// TODO: Implement client routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Clients module - Coming soon' });
});

module.exports = router;
