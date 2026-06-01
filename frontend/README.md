# PharmaTrack
**ระบบบันทึกและติดตามการจ่ายยา**
Bangkok Hospital Siriroj · Clinical Pharmacy Unit · Version 1.0 · May 2026

---

## 1. ภาพรวมระบบ

PharmaTrack เป็นระบบบริหารจัดการการจ่ายยาสำหรับห้องยาโรงพยาบาล พัฒนาด้วย React + Vite ช่วยให้เภสัชกรสามารถติดตามการจ่ายยาผู้ป่วยแต่ละรายได้อย่างเป็นระบบ

**จุดเด่นของระบบ**
- ปฏิทินแสดงตารางนัดจ่ายยาของผู้ป่วยแบบ Real-time
- ติดตาม workflow การจ่ายยาครบ 4 ขั้นตอน (Follow-up → Production → Ready → Dispensed)
- บันทึกประวัติการรับยาแต่ละขวดพร้อมชื่อเภสัชกรผู้จ่าย
- Dashboard แสดงภาพรวมและสรุปการจ่ายยาประจำวัน
- รองรับการดึงข้อมูลจากระบบ iMed

---

## 2. เทคโนโลยีที่ใช้

| Layer | Technology | หน้าที่ |
|-------|-----------|---------|
| Frontend | React + Vite + Tailwind CSS | UI / User Interface |
| State | localStorage | เก็บข้อมูลผู้ป่วยและประวัติ |
| Routing | useState (Client-side) | เปลี่ยนหน้าโดยไม่ reload |
| Styling | Tailwind CSS v3 | Utility-first CSS framework |

---

## 3. โครงสร้างโปรเจกต์

```
pharmatrack-vite/
└── pharmatrack/
    ├── src/
    │   ├── components/
    │   │   ├── Drawer.jsx          # Panel แสดงรายละเอียดผู้ป่วย
    │   │   ├── Sidebar.jsx         # เมนูด้านซ้าย
    │   │   ├── TopBar.jsx          # Header + Search
    │   │   └── Toast.jsx           # แจ้งเตือน
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── CalendarPage.jsx
    │   │   ├── AddPatientPage.jsx
    │   │   └── DashboardPage.jsx
    │   ├── utils/
    │   │   └── storage.js          # localStorage helpers
    │   ├── App.jsx                 # Router หลัก
    │   └── main.jsx                # Entry point
    ├── index.html
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 4. หน้าในระบบ

| หน้า | ไฟล์ | ฟังก์ชัน |
|------|------|---------|
| Login | `LoginPage.jsx` | เข้าสู่ระบบ บันทึกชื่อเภสัชกร |
| Calendar | `CalendarPage.jsx` | ปฏิทินแสดง event การจ่ายยา |
| Add VN | `AddPatientPage.jsx` | เพิ่มผู้ป่วยและข้อมูลยา |
| Dashboard | `DashboardPage.jsx` | ภาพรวมและประวัติการรับยา |

---

## 5. Workflow การจ่ายยา

### 5.1 สถานะและสีของ Event บนปฏิทิน

| สี | สถานะ | ความหมาย |
|----|-------|---------|
| 🔴 แดง | Follow-up Call | วันที่ต้องโทรติดตามผู้ป่วย |
| 🟡 เหลือง | Appointment/Production | วันที่นัดและเตรียมยา |
| 🔵 น้ำเงิน | Checked/Ready | ยาผลิตเสร็จแล้ว รอจ่าย |
| 🟢 เขียว | Dispensed | จ่ายยาให้ผู้ป่วยสำเร็จ |

### 5.2 ขั้นตอนการใช้งาน

1. **Login** — Personnel ID และ Password
2. **Add VN** — เพิ่มผู้ป่วยใหม่พร้อมข้อมูลยาและจำนวนขวด
3. ระบบสร้าง Event 🔴 Follow-up บนปฏิทินวัน startDate อัตโนมัติ
4. เภสัชกรกดที่ Event → เปลี่ยนสถานะตาม workflow
5. เมื่อกด Dispensed → ยาลดลง 1 ขวด → สร้าง Event 🔴 ใหม่ +31 วันจากวันสีเหลือง
6. เมื่อยาครบ 0 ขวด → ผู้ป่วยออกจากปฏิทิน → บันทึกใน Dashboard

### 5.3 การคำนวณวันนัด

- Follow-up ครั้งแรก = **Start Date**
- Follow-up ครั้งถัดไป = **วันที่กด Production + 31 วัน**
- ระบบคำนวณและสร้าง Event ใหม่อัตโนมัติทุกครั้งที่จ่ายยา

---

## 6. การจัดเก็บข้อมูล (localStorage)

### 6.1 Keys ที่ใช้

| Key | เก็บอะไร |
|-----|---------|
| `pharmatrack_patients` | ข้อมูลผู้ป่วยที่อยู่ในปฏิทิน |
| `pharmatrack_logs` | บันทึกการจ่ายยาแต่ละขวด (พร้อมชื่อเภสัช) |
| `pharmatrack_history` | ประวัติการจ่ายยาแต่ละรอบ |
| `pharmatrack_pharmacist` | ชื่อเภสัชกรที่ login อยู่ |

### 6.2 โครงสร้าง Patient Record

```js
{
  id, vn, hn, patientName, phone,
  medication, totalBottles, remainingBottles,
  status, activeDate, startDate,
  followupDate, productionDate, cycleCount
}
```

### 6.3 โครงสร้าง Dispense Log

```js
{
  id, vn, hn, patient_name, medication,
  total_bottles, bottle_number,
  dispensed_date, pharmacist
}
```

---

## 7. การติดตั้งและรันระบบ

### 7.1 Requirements

- Node.js v18 ขึ้นไป
- npm v9 ขึ้นไป
- Browser: Chrome หรือ Edge รุ่นล่าสุด

### 7.2 วิธีรัน

```bash
cd pharmatrack-vite/pharmatrack
npm install
npm run dev
```

เปิด Browser ไปที่: **http://localhost:5173**

### 7.3 Build สำหรับ Production

```bash
npm run build
```

ไฟล์ที่ build แล้วจะอยู่ที่โฟลเดอร์ `dist/`

---

## 8. แผนการพัฒนาในอนาคต

### 8.1 Integration กับ iMed

ระบบถูกออกแบบให้รองรับการเชื่อมต่อกับ iMed API โดย:
- ทีม iMed จัดเตรียม REST API endpoint สำหรับดึงข้อมูลผู้ป่วย
- PharmaTrack จะดึงข้อมูล VN/HN, ชื่อผู้ป่วย, ชื่อยา PRN และจำนวนยาอัตโนมัติ
- เภสัชกรไม่ต้องกรอกข้อมูลซ้ำ

### 8.2 Database (MySQL)

- เปลี่ยนจาก localStorage เป็น MySQL + Express API
- รองรับการใช้งานหลายเครื่องพร้อมกัน
- มี backup และ data recovery

### 8.3 ฟีเจอร์เพิ่มเติม

- ระบบ Login จริงเชื่อมกับ iMed credentials
- Export รายงานเป็น Excel/PDF
- แจ้งเตือน LINE/Email เมื่อถึงวัน Follow-up
- รองรับหลาย ward/หน่วยงาน

---

*PharmaTrack v1.0 · Bangkok Hospital Siriroj · Clinical Pharmacy Unit · May 2026*