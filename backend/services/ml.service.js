const axios = require('axios');

class MLService {
  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';
    this.timeout = 10000;
  }

transformInput(data) {
  return {
    age: data.age,
    job: data.job,
    marital: data.marital,
    education: data.education,
    default: data.default,
    housing: data.housing,
    loan: data.loan,
    contact: data.contact,
    month: data.month,
    day_of_week: data.day_of_week,
    campaign: data.campaign,
    emp_var_rate: data["emp.var.rate"] ?? data.emp_var_rate,
    cons_price_idx: data["cons.price.idx"] ?? data.cons_price_idx,
    cons_conf_idx: data["cons.conf.idx"] ?? data.cons_conf_idx,
    euribor3m: data.euribor3m,
    nr_employed: data["nr.employed"] ?? data.nr_employed
  };
}


  async predict(clientData) {
    try {
      const transformedData = this.transformInput(clientData);
      const response = await axios.post(
        `${this.mlApiUrl}/predict`,
        { client: transformedData },
        { headers: { 'Content-Type': 'application/json' }, timeout: this.timeout }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('ML API Error:', error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
  async predictBatch(clientsData) {
    try {
      const transformedClients = clientsData.map(client => this.transformInput(client));
      const response = await axios.post(
        `${this.mlApiUrl}/predict/batch`,
        { clients: transformedClients },
        { headers: { 'Content-Type': 'application/json' }, timeout: this.timeout * 2 }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('ML API Batch Error:', error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
  async healthCheck() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/health`, { timeout: 3000 });
      return { success: true, status: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/model/info`, { timeout: 3000 });
      return { success: true, info: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = MLService;
