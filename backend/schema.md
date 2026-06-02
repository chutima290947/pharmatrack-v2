# 📋 PharmaTrack — Database Schema & API Reference

> **Base URL**: `http://localhost:3001/api`
> **Database**: PostgreSQL (Neon — ap-southeast-1)
> **Content-Type**: `application/json`
> **Authentication**: Bearer Token (JWT)

---

## 🔗 สิ่งที่ต้องการจาก iMed/HIS (Integration Requirements)

PharmaTrack ต้องการเชื่อมต่อกับ iMed ใน **3 จุดหลัก**:

---

### 1. 🔐 Pharmacist Authentication — Login ใช้อันเดียวกับ iMed
(ตอนนี้ใช้เป็น)
pharmacist id : admin
password      : password

เมื่อเภสัชกร login เข้า PharmaTrack → ระบบจะส่ง credentials ไปตรวจสอบกับ iMed

**PharmaTrack จะส่งไป:**
```json
POST {IMED_BASE_URL}/api/auth/login

{
  "username": "pharmacist01",
  "password": "••••••••"
}
```

**ต้องการ Response กลับมา:**
```json
{
  "success": true,
  "fullname": "ภก. ชาติชาย มีสุข",
  "role": "pharmacist",
  "token": "..."
}
```

| Field | Type | จำเป็น | คำอธิบาย |
|-------|------|--------|----------|
| `fullname` | string | ✅ | ชื่อ-นามสกุลเภสัชกร (แสดงในระบบ) |
| `role` | string | ✅ | ตำแหน่ง `pharmacist` |
| `token` | string | ❌ | Token สำหรับ request ถัดไป (ถ้ามี) |

> 📌 **Key ที่ใช้ match**: `username` = iMed username
เภสัชทุกคนสามารถเข้าใช้งานได้

---

### 2. 🔍 Patient Lookup — ดึงข้อมูลคนไข้จาก VN

เมื่อเภสัชกรกรอก VN ในหน้า **Add VN** → ระบบจะดึงข้อมูลคนไข้จาก iMed อัตโนมัติ
(ไม่ต้องกรอก HN, ชื่อ-นามสกุล, เบอร์โทร)

**PharmaTrack จะส่งไป:**
```
GET {IMED_BASE_URL}/api/patients?vn=VN6600001
```

**ต้องการ Response กลับมา:**
```json
{
  "vn": "VN6600001",
  "hn": "HN1234567",
  "patient_name": "สมชาย ใจดี",
  "phone": "0812345678"
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `vn` | TBD | string | ✅ | Visit Number |
| `hn` | TBD | string | ✅ | Hospital Number |
| `patient_name` | TBD | string | ✅ | ชื่อ-นามสกุลคนไข้ |
| `phone` | TBD | string | ✅ | เบอร์โทรศัพท์ |

> 📌 **Key ที่ใช้ match**: `vn` = Visit Number จาก iMed

---

### 3. 💊 Doctor Order — ดึงคำสั่งยาจากแพทย์

หลังดึงข้อมูลคนไข้แล้ว → ระบบจะดึงคำสั่งยา (PRN) และจำนวนขวดที่แพทย์สั่ง

**PharmaTrack จะส่งไป:**
```
GET {IMED_BASE_URL}/api/orders?vn=VN6600001
```

**ต้องการ Response กลับมา:**
```json
{
  "vn": "VN6600001",
  "orders": [
    {
      "medication_name": "PRN 5%",
      "total_bottles": 4,
    }
  ]
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `medication_name` | TBD | string | ✅ | ชื่อยาตรงช่อง PRN |
| `total_bottles` | TBD | integer | ✅ | จำนวนขวดที่แพทย์สั่ง |

> 📌 **Key ที่ใช้ match**: `vn` = Visit Number จาก iMed

---

## 🗄️ Database Tables (PharmaTrack)

### 1. `patients` — ข้อมูลคนไข้ที่กำลัง active

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | UUID | ✅ | NO | Primary key |
| `vn` | VARCHAR(100) | | NO | Visit Number **(unique — match กับ iMed)** |
| `hn` | VARCHAR(100) | | NO | Hospital Number **(match กับ iMed)** |
| `patient_name` | VARCHAR(255) | | NO | ชื่อ-นามสกุลคนไข้ |
| `phone` | VARCHAR(50) | | YES | เบอร์โทรศัพท์ |
| `medication` | VARCHAR(255) | | NO | ชื่อยา PRN |
| `total_bottles` | INTEGER | | NO | จำนวนขวดทั้งหมดต่อ cycle |
| `remaining_bottles` | INTEGER | | YES | จำนวนขวดที่เหลือ |
| `cycle_count` | INTEGER | | NO | cycle ที่เท่าไหร่ (เริ่มที่ 1) |
| `status` | VARCHAR(50) | | YES | สถานะ (ดู Status Flow) |
| `active_date` | DATE | | YES | วันที่แสดงบนปฏิทิน |
| `start_date` | DATE | | YES | วันเริ่มต้น cycle แรก |
| `followup_date` | DATE | | YES | วัน follow-up ถัดไป |
| `production_date` | DATE | | YES | วันผลิตยา |
| `created_at` | TIMESTAMPTZ | | YES | วันที่สร้าง |
| `created_by` | VARCHAR(100) | | YES | username เภสัชที่สร้าง |
| `updated_at` | TIMESTAMPTZ | | YES | วันที่แก้ไขล่าสุด |
| `updated_by` | VARCHAR(100) | | YES | username เภสัชที่แก้ไขล่าสุด |

#### Status Flow:
```
followup 🔴 → production 🟡 → ready 🔵 → dispensed 🟢
(ถ้าเหลือขวด → สร้าง followup ใหม่อัตโนมัติ +31 วัน)
```

---

### 2. `dispense_logs` — log การจ่ายยารายวัน

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | INTEGER | ✅ | NO | Primary key |
| `vn` | TEXT | | NO | Visit Number |
| `hn` | VARCHAR | | YES | Hospital Number |
| `patient_name` | TEXT | | YES | ชื่อ-นามสกุลคนไข้ |
| `medication` | TEXT | | YES | ชื่อยา |
| `bottle_number` | INTEGER | | YES | ขวดที่เท่าไหร่ที่จ่าย |
| `total_bottles` | INTEGER | | YES | จำนวนขวดทั้งหมด |
| `dispensed_date` | DATE | | YES | วันที่จ่ายยา |
| `pharmacist` | TEXT | | YES | ชื่อเภสัชกรที่จ่ายยา |
| `created_at` | TIMESTAMP | | YES | วันเวลาที่บันทึก |

> ⚠️ Append-only — ไม่มีการลบ record

---

### 3. `dispense_history` — ประวัติการจ่ายยาทั้งหมด

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | INTEGER | ✅ | NO | Primary key |
| `vn` | TEXT | | NO | Visit Number |
| `hn` | TEXT | | YES | Hospital Number |
| `patient_name` | TEXT | | NO | ชื่อ-นามสกุลคนไข้ |
| `phone` | TEXT | | YES | เบอร์โทรศัพท์ |
| `medication` | TEXT | | YES | ชื่อยา |
| `total_bottles` | INTEGER | | YES | จำนวนขวดทั้งหมด |
| `remaining_bottles` | INTEGER | | YES | จำนวนขวดที่เหลือ |
| `dispensed_date` | DATE | | YES | วันที่จ่ายยา |
| `cycle_count` | INTEGER | | YES | cycle ที่เท่าไหร่ |
| `created_at` | TIMESTAMP | | YES | วันเวลาที่บันทึก |

> ⚠️ Append-only — ไม่มีการลบ record

---

### 4. `users` — เภสัชกร

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | UUID | ✅ | NO | Primary key |
| `username` | VARCHAR(100) | | NO | Username **(match กับ iMed username)** |
| `password` | VARCHAR(255) | | NO | Password (bcrypt hash) |
| `fullname` | VARCHAR(255) | | NO | ชื่อ-นามสกุลจริง |
| `role` | VARCHAR(50) | | NO | `pharmacist` / `admin` |
| `created_at` | TIMESTAMPTZ | | NO | วันที่สร้าง |

> 📌 เมื่อ iMed พร้อม — table นี้จะไม่ถูกใช้แล้ว ระบบจะ authenticate ผ่าน iMed โดยตรง

---

## 🔌 PharmaTrack API Endpoints

### Authentication

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ | ❌ |
| POST | `/api/auth/logout` | ออกจากระบบ | ✅ |

---

### Patients

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/patients` | ดึงคนไข้ทั้งหมด | ✅ |
| GET | `/api/patients/search?q=` | ค้นหาด้วย VN / HN / ชื่อ | ✅ |
| GET | `/api/patients/:id` | ดึงคนไข้รายคน | ✅ |
| POST | `/api/patients` | เพิ่มคนไข้ใหม่ | ✅ |
| POST | `/api/patients/bulk` | เพิ่มหลายคนพร้อมกัน | ✅ |
| PUT | `/api/patients/:id` | อัปเดตข้อมูล / สถานะ | ✅ |
| DELETE | `/api/patients/:id` | ลบคนไข้ | ✅ |
| POST | `/api/patients/:id/dispense` | จ่ายยา | ✅ |

---

### Logs

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/logs` | ดึง log ล่าสุด 20 รายการ | ✅ |
| GET | `/api/logs?vn=VN001` | ดึง log ตาม VN | ✅ |

---

### Health Check

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/health` | ตรวจสอบ server status | ❌ |

---

## 📊 ER Diagram

```mermaid
erDiagram
    users ||--o{ patients : "created_by / updated_by"
    users ||--o{ dispense_logs : "pharmacist"
    patients ||--o{ dispense_logs : "vn"
    patients ||--o{ dispense_history : "vn"

    users {
        uuid id PK
        varchar username
        varchar fullname
        varchar role
    }

    patients {
        uuid id PK
        varchar vn
        varchar hn
        varchar patient_name
        varchar medication
        int total_bottles
        int remaining_bottles
        int cycle_count
        varchar status
        date active_date
        date start_date
        date followup_date
    }

    dispense_logs {
        int id PK
        text vn
        text hn
        text patient_name
        text medication
        int bottle_number
        int total_bottles
        date dispensed_date
        text pharmacist
    }

    dispense_history {
        int id PK
        text vn
        text hn
        text patient_name
        text medication
        int total_bottles
        date dispensed_date
        int cycle_count
    }
```

---

## ⚙️ Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Auth
JWT_SECRET=your_secret_key_here

# iMed — เพิ่มเมื่อได้รับ endpoint จากทีม iMed
# IMED_BASE_URL=https://imed.hospital.com
```

---

## 🚦 HTTP Status Codes

| Status | คำอธิบาย |
|--------|----------|
| `200` | สำเร็จ |
| `201` | สร้างข้อมูลสำเร็จ |
| `400` | ข้อมูลไม่ครบ / ไม่ถูกต้อง |
| `401` | ไม่ได้ login หรือ token หมดอายุ |
| `403` | ไม่มีสิทธิ์ |
| `404` | ไม่พบข้อมูล |
| `409` | VN ซ้ำในระบบ |
| `500` | Server error |

---
