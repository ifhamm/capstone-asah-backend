const MLService = require('../services/ml.service');

class MLController {
  constructor() {
    this.mlService = new MLService();
  }

  async predict(req, res) {
    try {
      const clientData = req.body;
      const requiredFields = [
        'age', 'job', 'marital', 'education', 'default', 'housing', 'loan',
        'contact', 'month', 'day_of_week', 'campaign'
      ];
      const economicFields = [
        ['emp.var.rate', 'emp_var_rate'],
        ['cons.price.idx', 'cons_price_idx'],
        ['cons.conf.idx', 'cons_conf_idx'],
        ['euribor3m'],
        ['nr.employed', 'nr_employed']
      ];
      const missingFields = [];
      requiredFields.forEach(field => {
        if (!(field in clientData)) missingFields.push(field);
      });
      economicFields.forEach(alternatives => {
        const hasField = alternatives.some(field => field in clientData);
        if (!hasField) missingFields.push(alternatives[0]);
      });
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }
      const result = await this.mlService.predict(clientData);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'ML prediction failed',
          details: result.error
        });
      }
      return res.json({
        success: true,
        prediction: result.data.label,
        probability: result.data.probability,
        threshold: result.data.threshold,
        raw_prediction: result.data.prediction
      });
    } catch (error) {
      console.error('Prediction error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async predictBatch(req, res) {
    try {
      const { clients } = req.body;
      if (!Array.isArray(clients)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must contain "clients" array'
        });
      }
      if (clients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Clients array cannot be empty'
        });
      }
      const result = await this.mlService.predictBatch(clients);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'ML batch prediction failed',
          details: result.error
        });
      }
      return res.json({
        success: true,
        predictions: result.data.predictions,
        count: result.data.predictions.length
      });
    } catch (error) {
      console.error('Batch prediction error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async healthCheck(req, res) {
    try {
      const mlHealth = await this.mlService.healthCheck();
      const modelInfo = await this.mlService.getModelInfo();
      return res.json({
        status: 'healthy',
        backend: 'online',
        ml_api: mlHealth.success ? 'connected' : 'disconnected',
        ml_api_status: mlHealth.status || null,
        model_info: modelInfo.success ? modelInfo.info : null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = MLController;
