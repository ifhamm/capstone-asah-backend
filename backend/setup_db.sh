#!/bin/bash

# Bank Marketing Backend - Quick Setup Script
# ============================================

echo "🚀 Bank Marketing Backend - Setup"
echo "=================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Start PostgreSQL service
echo "📦 Starting PostgreSQL..."
sudo pg_ctlcluster 16 main start 2>/dev/null || sudo service postgresql start 2>/dev/null

# Wait for PostgreSQL to start
sleep 2

# Create database and user
echo "🗄️ Setting up database..."
sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE bank_marketing' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bank_marketing')\gexec

-- Set password for postgres user
ALTER USER postgres PASSWORD 'postgres';

-- Connect to database and create tables
\c bank_marketing

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nasabah (Customers) table
CREATE TABLE IF NOT EXISTS nasabah (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  age INTEGER NOT NULL,
  job VARCHAR(50) NOT NULL,
  marital VARCHAR(20) NOT NULL,
  education VARCHAR(50) NOT NULL,
  default_status VARCHAR(10) NOT NULL,
  housing VARCHAR(10) NOT NULL,
  loan VARCHAR(10) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  month VARCHAR(10) NOT NULL,
  day_of_week VARCHAR(10) NOT NULL,
  campaign INTEGER NOT NULL,
  emp_var_rate DECIMAL(10,3) NOT NULL,
  cons_price_idx DECIMAL(10,3) NOT NULL,
  cons_conf_idx DECIMAL(10,3) NOT NULL,
  euribor3m DECIMAL(10,3) NOT NULL,
  nr_employed DECIMAL(10,1) NOT NULL,
  prediction VARCHAR(10),
  probability DECIMAL(10,6),
  status_call VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nasabah_user_id ON nasabah(user_id);
CREATE INDEX IF NOT EXISTS idx_nasabah_status_call ON nasabah(status_call);
CREATE INDEX IF NOT EXISTS idx_nasabah_prediction ON nasabah(prediction);
CREATE INDEX IF NOT EXISTS idx_nasabah_created_at ON nasabah(created_at);
EOF

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start ML API:    cd ../ml-api && python main.py"
echo "   2. Start Backend:   npm start"
echo "   3. Register user:   curl -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{\"name\":\"Admin\",\"email\":\"admin@example.com\",\"password\":\"password123\"}'"
echo ""
