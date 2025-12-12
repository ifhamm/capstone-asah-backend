const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/summary', adminController.getSummary.bind(adminController));
router.get('/stats', adminController.getStats.bind(adminController));

module.exports = router;
