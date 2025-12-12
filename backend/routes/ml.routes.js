const express = require('express');
const MLController = require('../controllers/ml.controller');
const { validatePredictionInput } = require('../middleware/validation');

const router = express.Router();
const mlController = new MLController();

// Health check
router.get('/health', (req, res) => mlController.healthCheck(req, res));

// Single prediction (with validation)
router.post('/predict', validatePredictionInput, (req, res) => 
  mlController.predict(req, res)
);

// Batch prediction (no validation to keep it fast)
router.post('/predict/batch', (req, res) => 
  mlController.predictBatch(req, res)
);

module.exports = router;
