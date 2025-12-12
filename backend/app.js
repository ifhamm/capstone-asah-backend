require('dotenv').config();
const express = require('express');
const mlRoutes = require('./routes/ml.routes');
const authRoutes = require('./routes/auth.routes');
const nasabahRoutes = require('./routes/nasabah.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api', mlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/nasabah', nasabahRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Bank Marketing Prediction API - Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      predict: 'POST /api/predict',
      batch: 'POST /api/predict/batch',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      nasabah: {
        predict: 'POST /api/nasabah/predict',
        list: 'GET /api/nasabah',
        detail: 'GET /api/nasabah/:id',
        update: 'PUT /api/nasabah/:id',
        delete: 'DELETE /api/nasabah/:id',
        status: 'PATCH /api/nasabah/:id/status'
      },
      admin: {
        summary: 'GET /api/admin/summary',
        stats: 'GET /api/admin/stats'
      }
    },
    ml_api_url: process.env.ML_API_URL || 'http://localhost:8000'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server Running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   ML API: ${process.env.ML_API_URL || 'http://localhost:8000'}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   POST http://localhost:${PORT}/api/predict`);
  console.log(`   POST http://localhost:${PORT}/api/predict/batch`);
  console.log(`\n🔐 Auth Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`\n👥 Nasabah Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/nasabah/predict`);
  console.log(`   GET  http://localhost:${PORT}/api/nasabah`);
  console.log(`   GET  http://localhost:${PORT}/api/nasabah/:id`);
  console.log(`   PUT  http://localhost:${PORT}/api/nasabah/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/nasabah/:id`);
  console.log(`   PATCH http://localhost:${PORT}/api/nasabah/:id/status`);
  console.log(`\n📊 Admin Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/summary`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/stats`);
  console.log(`\n💡 Tip: Test with curl http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
