const express = require('express');
const router = express.Router();
const nasabahController = require('../controllers/nasabah.controller');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.post('/predict', nasabahController.predictAndCreate.bind(nasabahController));
router.get('/', nasabahController.getAll.bind(nasabahController));
router.get('/:id', nasabahController.getById.bind(nasabahController));
router.put('/:id', nasabahController.update.bind(nasabahController));
router.delete('/:id', nasabahController.delete.bind(nasabahController));
router.patch('/:id/status', nasabahController.updateStatus.bind(nasabahController));

module.exports = router;
