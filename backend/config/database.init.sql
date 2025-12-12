-- Bank Marketing Database Schema
-- Run this SQL to create tables

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

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if exist and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_nasabah_updated_at ON nasabah;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nasabah_updated_at 
  BEFORE UPDATE ON nasabah 
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ BEGIN RAISE NOTICE 'Database schema created successfully!'; END $$;
