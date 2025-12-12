# 🏦 Bank Marketing Prediction - Production Ready Guide

Panduan lengkap untuk menjalankan sistem Bank Marketing Prediction menggunakan Docker.

---

## 📋 Daftar Isi

1. [Arsitektur Sistem](#-arsitektur-sistem)
2. [Prerequisite](#-prerequisite)
3. [File Structure](#-file-structure)
4. [Setup Docker Files](#-setup-docker-files)
5. [Menjalankan dengan Docker Compose](#-menjalankan-dengan-docker-compose)
6. [Testing API](#-testing-api)
7. [API Reference](#-api-reference)
8. [Frontend Integration](#-frontend-integration)
9. [Troubleshooting](#-troubleshooting)
10. [Useful Commands](#-useful-commands)

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         DOCKER NETWORK                          │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│             │             │             │                       │
│  Frontend   │   Backend   │   ML API    │     PostgreSQL        │
│  (React)    │  (Express)  │  (FastAPI)  │                       │
│             │             │             │                       │
│  Port: ?  │  Port:3000  │  Port:8000  │     Port:5432         │
│             │      │      │      ▲      │          ▲            │
│             │      └──────┼──────┘      │          │            │
│             │             │             │          │            │
│             │      └──────┼─────────────┼──────────┘            │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

**Alur:**
1. Frontend → Backend (port 3000)
2. Backend → ML API (port 8000) untuk prediksi
3. Backend → PostgreSQL (port 5432) untuk simpan data

---

## 💻 Prerequisite

Pastikan sudah terinstall:

```bash
# Check Docker
docker --version        # Docker version 20.10+

# Check Docker Compose
docker compose version  # Docker Compose version v2.0+
```

**Install Docker (jika belum):**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout dan login kembali, lalu test
docker run hello-world
```

---

## 📁 File Structure

```
capstone_asah/
├── docker-compose.yml          # 🆕 Docker orchestration
├── .env                        # 🆕 Environment variables
├── production_ready.md         # 📖 File ini
│
├── ml-api/                     # Python ML API
│   ├── Dockerfile              # ✅ Sudah ada
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   ├── models/
│   └── src/
│
├── backend/                    # Node.js Backend
│   ├── Dockerfile              # 🆕 Buat baru
│   ├── .dockerignore           # 🆕 Buat baru
│   ├── app.js
│   ├── package.json
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── services/
│
└── database/                   # 🆕 Folder baru
    └── init.sql                # 🆕 Database initialization
```

---

## 🐳 Setup Docker Files

### Step 1: Buat `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run application
CMD ["node", "app.js"]
```

### Step 2: Buat `backend/.dockerignore`

```
node_modules
npm-debug.log
.env
.git
.gitignore
README*.md
*.md
```

### Step 3: Buat `database/init.sql`

```sql
-- Database initialization script
-- This runs automatically when PostgreSQL container starts

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

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_nasabah_updated_at ON nasabah;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nasabah_updated_at 
  BEFORE UPDATE ON nasabah 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Buat `.env` (root folder)

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=bank_marketing

# Backend
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bank_marketing
DB_USER=postgres
DB_PASSWORD=postgres123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ML_API_URL=http://ml-api:8000

# ML API
ML_API_PORT=8000
```

### Step 5: Buat `docker-compose.yml` (root folder)

```yaml
services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: bank_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DB: ${POSTGRES_DB:-bank_marketing}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bank_network

  # ============================================
  # ML API (FastAPI + LightGBM)
  # ============================================
  ml-api:
    build:
      context: ./ml-api
      dockerfile: dockerfile
    container_name: bank_ml_api
    restart: unless-stopped
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - bank_network

  # ============================================
  # Backend API (Express.js)
  # ============================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bank_backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: ${PORT:-3000}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB:-bank_marketing}
      DB_USER: ${POSTGRES_USER:-postgres}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-key}
      ML_API_URL: http://ml-api:8000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      ml-api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - bank_network

# ============================================
# Networks
# ============================================
networks:
  bank_network:
    driver: bridge

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
```

---

## 🚀 Menjalankan dengan Docker Compose

### Step 1: Buat semua file yang diperlukan

```bash
cd ~/Downloads/capstone_asah

# Buat folder database
mkdir -p database

# Buat file-file (copy content dari section di atas)
# - backend/Dockerfile
# - backend/.dockerignore
# - database/init.sql
# - .env
# - docker-compose.yml
```

### Step 2: Build dan Jalankan

```bash
# Build semua images
docker compose build

# Jalankan semua services
docker compose up -d

# Lihat logs
docker compose logs -f
```

### Step 3: Verifikasi Semua Berjalan

```bash
# Cek status containers
docker compose ps

# Expected output:
# NAME              STATUS                   PORTS
# bank_postgres     running (healthy)        0.0.0.0:5432->5432/tcp
# bank_ml_api       running (healthy)        0.0.0.0:8000->8000/tcp
# bank_backend      running (healthy)        0.0.0.0:3000->3000/tcp
```

### Step 4: Test Endpoints

```bash
# Test ML API
curl http://localhost:8000/health

# Test Backend
curl http://localhost:3000/api/health

# Test Prediction
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"age":35,"job":"admin","marital":"married","education":"university.degree","default":"no","housing":"yes","loan":"no","contact":"cellular","month":"may","day_of_week":"mon","campaign":1,"emp_var_rate":1.1,"cons_price_idx":93.994,"cons_conf_idx":-36.4,"euribor3m":4.857,"nr_employed":5191}'
```

---

## 🧪 Testing API

### 1. Health Check

```bash
# ML API
curl http://localhost:8000/health
# Response: {"status":"healthy","model_loaded":true,...}

# Backend
curl http://localhost:3000/api/health
# Response: {"success":true,"status":"healthy",...}
```

### 2. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "user_xxxxxxxxxxxx"
}
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_xxxxxxxxxxxx",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

**⚠️ SIMPAN TOKEN INI untuk request selanjutnya!**

### 4. Quick Predict (Tanpa Auth)

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 56,
    "job": "housemaid",
    "marital": "married",
    "education": "basic.4y",
    "default": "no",
    "housing": "no",
    "loan": "no",
    "contact": "telephone",
    "month": "may",
    "day_of_week": "mon",
    "campaign": 1,
    "emp_var_rate": 1.1,
    "cons_price_idx": 93.994,
    "cons_conf_idx": -36.4,
    "euribor3m": 4.857,
    "nr_employed": 5191
  }'
```

Response:
```json
{
  "success": true,
  "prediction": {
    "probability": 0.1234,
    "prediction": 0,
    "label": "NO",
    "threshold": 0.24
  }
}
```

### 5. Predict & Simpan Nasabah (Perlu Auth)

```bash
# Ganti YOUR_TOKEN dengan token dari login
curl -X POST http://localhost:3000/api/nasabah/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Budi Santoso",
    "phone": "08123456789",
    "age": 35,
    "job": "admin",
    "marital": "married",
    "education": "university.degree",
    "default_status": "no",
    "housing": "yes",
    "loan": "no",
    "contact": "cellular",
    "month": "may",
    "day_of_week": "mon",
    "campaign": 1,
    "emp_var_rate": 1.1,
    "cons_price_idx": 93.994,
    "cons_conf_idx": -36.4,
    "euribor3m": 4.857,
    "nr_employed": 5191
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "nasabahId": "cust_xxxxxxxxxxxx",
    "prediction": "YES",
    "probability": 0.4567,
    "timestamp": "2025-12-13T10:30:00.000Z"
  }
}
```

### 6. Get Dashboard Summary (Perlu Auth)

```bash
curl http://localhost:3000/api/admin/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "total_nasabah": 10,
    "prediction_summary": {
      "positive": 3,
      "negative": 7
    },
    "call_tracking_summary": {
      "pending": 8,
      "called": 2,
      "failed": 0,
      "not_interested": 0
    },
    "success_rate": "100.0%",
    "recent_activities": [...]
  }
}
```

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication
Semua endpoint dengan 🔐 memerlukan header:
```
Authorization: Bearer <token>
```

### Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/health` | ❌ | Health check |
| POST | `/predict` | ❌ | Quick prediction |
| POST | `/predict/batch` | ❌ | Batch prediction |
| POST | `/auth/register` | ❌ | Register user |
| POST | `/auth/login` | ❌ | Login |
| GET | `/auth/me` | 🔐 | Get current user |
| POST | `/nasabah/predict` | 🔐 | Predict & save |
| GET | `/nasabah` | 🔐 | List nasabah |
| GET | `/nasabah/:id` | 🔐 | Get nasabah by ID |
| PUT | `/nasabah/:id` | 🔐 | Update nasabah |
| DELETE | `/nasabah/:id` | 🔐 | Delete nasabah |
| PATCH | `/nasabah/:id/status` | 🔐 | Update call status |
| GET | `/admin/summary` | 🔐 | Dashboard summary |
| GET | `/admin/stats` | 🔐 | Statistics |

### Input Fields untuk Prediction

| Field | Type | Required | Example |
|-------|------|----------|---------|
| name | string | ✅ (nasabah) | "Budi Santoso" |
| phone | string | ❌ | "08123456789" |
| age | number | ✅ | 35 |
| job | string | ✅ | "admin" |
| marital | string | ✅ | "married" |
| education | string | ✅ | "university.degree" |
| default / default_status | string | ✅ | "no" |
| housing | string | ✅ | "yes" |
| loan | string | ✅ | "no" |
| contact | string | ✅ | "cellular" |
| month | string | ✅ | "may" |
| day_of_week | string | ✅ | "mon" |
| campaign | number | ✅ | 1 |
| emp_var_rate | number | ✅ | 1.1 |
| cons_price_idx | number | ✅ | 93.994 |
| cons_conf_idx | number | ✅ | -36.4 |
| euribor3m | number | ✅ | 4.857 |
| nr_employed | number | ✅ | 5191 |

### Valid Values

```javascript
const validValues = {
  job: ["admin", "blue-collar", "entrepreneur", "housemaid", "management", 
        "retired", "self-employed", "services", "student", "technician", 
        "unemployed", "unknown"],
  
  marital: ["divorced", "married", "single", "unknown"],
  
  education: ["basic.4y", "basic.6y", "basic.9y", "high.school", 
              "illiterate", "professional.course", "university.degree", "unknown"],
  
  default: ["no", "yes", "unknown"],
  housing: ["no", "yes", "unknown"],
  loan: ["no", "yes", "unknown"],
  
  contact: ["cellular", "telephone"],
  
  month: ["jan", "feb", "mar", "apr", "may", "jun", 
          "jul", "aug", "sep", "oct", "nov", "dec"],
  
  day_of_week: ["mon", "tue", "wed", "thu", "fri"],
  
  status_call: ["pending", "called", "failed", "not_interested"]
};
```

---

## 🎨 Frontend Integration

### Axios Setup

```javascript
// src/api/index.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Auth Service

```javascript
// src/services/auth.js
import api from '../api';

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};
```

### Nasabah Service

```javascript
// src/services/nasabah.js
import api from '../api';

export const nasabahService = {
  async predict(data) {
    const response = await api.post('/nasabah/predict', data);
    return response.data;
  },

  async getAll(page = 1, limit = 10, filters = {}) {
    const params = { page, limit, ...filters };
    const response = await api.get('/nasabah', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/nasabah/${id}`);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/nasabah/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/nasabah/${id}`);
    return response.data;
  },

  async updateStatus(id, status_call, notes = '') {
    const response = await api.patch(`/nasabah/${id}/status`, { status_call, notes });
    return response.data;
  }
};
```

### Dashboard Service

```javascript
// src/services/dashboard.js
import api from '../api';

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/admin/summary');
    return response.data;
  },

  async getStats(period = '7days') {
    const response = await api.get('/admin/stats', { params: { period } });
    return response.data;
  }
};
```

### React Component Example

```jsx
// src/pages/PredictForm.jsx
import { useState } from 'react';
import { nasabahService } from '../services/nasabah';

export default function PredictForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: 35,
    job: 'admin',
    marital: 'married',
    education: 'university.degree',
    default_status: 'no',
    housing: 'no',
    loan: 'no',
    contact: 'cellular',
    month: 'may',
    day_of_week: 'mon',
    campaign: 1,
    emp_var_rate: 1.1,
    cons_price_idx: 93.994,
    cons_conf_idx: -36.4,
    euribor3m: 4.857,
    nr_employed: 5191
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await nasabahService.predict(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
      <input name="age" type="number" value={formData.age} onChange={handleChange} />
      {/* ... other fields ... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Predict'}
      </button>

      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <h3>Prediction Result</h3>
          <p>Label: <strong>{result.prediction}</strong></p>
          <p>Probability: {(result.probability * 100).toFixed(2)}%</p>
        </div>
      )}
    </form>
  );
}
```

---

## ❗ Troubleshooting

### 1. Container tidak mau start

```bash
# Lihat logs
docker compose logs

# Lihat logs service tertentu
docker compose logs ml-api
docker compose logs backend
docker compose logs postgres
```

### 2. Port already in use

```bash
# Cek port yang digunakan
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# Kill process
sudo kill -9 <PID>

# Atau ganti port di .env dan docker-compose.yml
```

### 3. Database connection error

```bash
# Cek apakah postgres sudah ready
docker compose logs postgres

# Restart postgres
docker compose restart postgres

# Reset database (HATI-HATI: data akan hilang)
docker compose down -v
docker compose up -d
```

### 4. ML API tidak respond

```bash
# Cek logs ML API
docker compose logs ml-api

# Restart ML API
docker compose restart ml-api

# Rebuild ML API
docker compose build ml-api
docker compose up -d ml-api
```

### 5. Backend tidak bisa connect ke ML API

```bash
# Masuk ke container backend
docker compose exec backend sh

# Test koneksi ke ML API
wget -qO- http://ml-api:8000/health

# Keluar
exit
```

### 6. Reset semua dari awal

```bash
# Stop dan hapus semua containers, networks, volumes
docker compose down -v

# Hapus semua images
docker compose down --rmi all

# Build ulang
docker compose build --no-cache

# Jalankan
docker compose up -d
```

---

## 🛠️ Useful Commands

### Docker Compose

```bash
# Start semua services
docker compose up -d

# Stop semua services
docker compose down

# Restart semua services
docker compose restart

# Lihat status
docker compose ps

# Lihat logs (follow)
docker compose logs -f

# Lihat logs service tertentu
docker compose logs -f backend

# Rebuild dan restart
docker compose up -d --build

# Masuk ke container
docker compose exec backend sh
docker compose exec ml-api bash
docker compose exec postgres psql -U postgres -d bank_marketing
```

### Database

```bash
# Masuk ke PostgreSQL
docker compose exec postgres psql -U postgres -d bank_marketing

# Query contoh
SELECT * FROM users;
SELECT * FROM nasabah;
SELECT COUNT(*) FROM nasabah;

# Keluar
\q
```

### Monitoring

```bash
# CPU & Memory usage
docker stats

# Disk usage
docker system df
```

---

## 🎉 Quick Start Summary

```bash
# 1. Clone project
cd ~/Downloads/capstone_asah

# 2. Buat file-file yang diperlukan (lihat section Setup Docker Files)

# 3. Build & Run
docker compose up -d --build

# 4. Wait for healthy status
docker compose ps

# 5. Test
curl http://localhost:3000/api/health

# 6. Register & Login
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"123456"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# 7. Done! 🎉
```

---

**Happy Deploying! 🚀**
