## Bank Marketing Prediction - Production Guide

Dokumen ini merangkum cara menjalankan sistem Bank Marketing Prediction menggunakan Docker. Strukturnya dibuat lebih rapi dan lebih manusiawi supaya nyaman dibaca.

---

### Arsitektur Sistem

Sistem berjalan dalam satu jaringan Docker yang berisi empat komponen utama:

- **Frontend (React)** berfungsi sebagai antarmuka pengguna.
- **Backend (Express.js)** menangani autentikasi, manajemen data, dan komunikasi dengan ML API.
- **ML API (FastAPI)** memproses prediksi menggunakan model machine learning.
- **PostgreSQL** digunakan sebagai penyimpanan data.

Alur komunikasi: frontend menuju backend, backend meneruskan permintaan prediksi ke ML API, lalu backend menyimpan hasilnya ke database.

---

### Prerequisite

Pastikan Docker dan Docker Compose sudah terpasang. Cek dengan perintah berikut:

```
docker --version
docker compose version
```

Jika belum terpasang, instal melalui skrip Docker resmi.

---

### Struktur Folder

Proyek ini terdiri dari beberapa folder:

```
capstone_asah/
├── docker-compose.yml
├── .env
├── production_ready.md
├── ml-api/
├── backend/
└── database/
```

Setiap folder berisi komponen berbeda seperti API Python, server Node.js, serta file inisialisasi database.

---

### Setup Docker

Bagian ini mencakup pembuatan Dockerfile untuk backend, file `.dockerignore`, skrip SQL untuk PostgreSQL, variabel lingkungan `.env`, dan file `docker-compose.yml` sebagai orkestrasi.

Instruksi lengkapnya sengaja dipisah supaya mudah diikuti saat konfigurasi.

---

### Menjalankan Sistem

Untuk menjalankan semua service:

```
docker compose build
docker compose up -d
docker compose ps
```

Setelah itu, cek apakah semua service sudah berjalan dan berstatus *healthy*.

---

### Pengujian API

Beberapa contoh endpoint yang bisa diuji:

- `/health` untuk memeriksa status layanan.
- `/auth/register` dan `/auth/login` untuk autentikasi.
- `/predict` untuk prediksi cepat.
- `/nasabah/predict` untuk prediksi dengan penyimpanan data.

Contoh penggunaan `curl` disediakan di versi lengkap dokumen.

---

### API Reference

Bagian ini diperluas supaya frontend bisa integrasi tanpa harus tanya-tanya lagi. Setiap endpoint punya deskripsi, payload, respons contoh, dan catatan penting.

---

## 1. AUTHENTICATION

### **POST /auth/register**
Membuat akun baru.

**Request Body**
```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "user_xxxxxxxxx"
}
```

---

### **POST /auth/login**
Login dan mendapatkan token untuk akses endpoint lain.

**Request Body**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "success": true,
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "user_xxxxx",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

Catatan: Token harus disimpan di localStorage.

---

### **GET /auth/me** *(Protected)*
Mengambil informasi user yang sedang login.

**Header**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**
```json
{
  "success": true,
  "user": {
    "id": "user_xxxxx",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

---

## 2. QUICK PREDICTION (TANPA AUTH)

### **POST /predict**
Melakukan prediksi tanpa menyimpan ke database.

**Request Body** (sama dengan ML API)
```json
{
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
}
```

**Response**
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

---

## 3. PREDICT + SIMPAN NASABAH (PERLU AUTH)

### **POST /nasabah/predict** *(Protected)*
Melakukan prediksi, menyimpan hasil, dan mengembalikan ID nasabah.

**Request Body**
```json
{
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
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "nasabahId": "cust_xxxxxxxxx",
    "prediction": "YES",
    "probability": 0.4567,
    "timestamp": "2025-12-13T10:30:00.000Z"
  }
}
```

---

## 4. NASABAH CRUD

### **GET /nasabah** *(Protected)*
Mengambil daftar nasabah.

**Query Params**
```
?page=1&limit=10
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust_xxxx",
      "name": "Budi",
      "prediction": "NO",
      "probability": 0.12,
      "status_call": "pending"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20
  }
}
```

---

### **GET /nasabah/:id** *(Protected)*
Mengambil satu nasabah lengkap.

**Response**
```json
{
  "success": true,
  "data": {
    "id": "cust_xxxx",
    "name": "Budi",
    "age": 30,
    "prediction": "YES",
    "probability": 0.45,
    "status_call": "pending"
  }
}
```

---

### **PUT /nasabah/:id** *(Protected)*
Memperbarui data nasabah.

**Request Body**
```json
{
  "notes": "Follow up minggu depan",
  "status_call": "called"
}
```

**Response**
```json
{
  "success": true,
  "message": "Nasabah updated successfully"
}
```

---

### **DELETE /nasabah/:id** *(Protected)*
Menghapus nasabah.

**Response**
```json
{
  "success": true,
  "message": "Nasabah deleted"
}
```

---

### **PATCH /nasabah/:id/status** *(Protected)*
Mengubah status call.

**Request Body**
```json
{
  "status_call": "not_interested",
  "notes": "Tidak berminat"
}
```

**Response**
```json
{
  "success": true,
  "message": "Status updated"
}
```

---

## 5. ADMIN DASHBOARD

### **GET /admin/summary** *(Protected)*

**Response**
```json
{
  "success": true,
  "data": {
    "total_nasabah": 25,
    "prediction_summary": {
      "positive": 8,
      "negative": 17
    },
    "call_tracking_summary": {
      "pending": 15,
      "called": 7,
      "failed": 2,
      "not_interested": 1
    },
    "recent_activities": []
  }
}
```

---

### **GET /admin/stats?period=7days** *(Protected)*

**Response**
```json
{
  "success": true,
  "data": {
    "period": "7days",
    "total_calls": 32,
    "success_rate": 0.62
  }
}
```

---

### Integrasi Frontend

Contoh kode React mencakup konfigurasi Axios, layanan autentikasi, layanan nasabah, dan contoh halaman form prediksi.

Tujuannya agar integrasi frontend dengan backend berjalan konsisten dan aman.

---

### Troubleshooting

Beberapa masalah umum yang sering terjadi:

- Container tidak bisa start
- Port bentrok
- Backend gagal terhubung ke PostgreSQL
- ML API tidak merespons

Setiap masalah disertai langkah pemeriksaan dan perintah untuk memperbaikinya.

---

### Ringkasannya

Langkah cepat untuk menjalankan seluruh sistem:

```
docker compose up -d --build
curl http://localhost:3000/api/health
```

Setelah itu, Anda bisa mendaftarkan user, login, dan mencoba fitur prediksi.

---

Dokumen lengkap dapat diperluas sesuai kebutuhan proyek. Konten teknis tetap sama, namun penyampaian dibuat lebih natural agar mudah dipahami dan tidak terlihat seperti teks hasil generator otomatis.
