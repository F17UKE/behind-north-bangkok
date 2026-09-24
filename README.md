# 🍔 Behind North Bangkok

Hyperlocal P2P Food Delivery Web Application สำหรับชาว มจพ.

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
behind-north-bangkok/
├── docs/                       # เอกสารสเปก ระบบ และฐานข้อมูลสำหรับทีมและ AI
│   ├── PROJECT_CONTEXT.md      # กฎเกณฑ์ทางธุรกิจ และ Order State Machine
│   └── DATABASE_SCHEMA.md      # โครงสร้างตาราง (DDL) และ Data Dictionary
│
├── backend/                    # Core RESTful API และ Socket Server (Node.js/Express)
│   └── src/
│       ├── config/             # ค่าตั้งค่า Database และ Service ต่างๆ
│       ├── database/           # Knex Migrations & Seeds
│       ├── middlewares/        # Auth, Role Guard (Rider/Store), Error Handler
│       ├── modules/            # แยก Business Logic รายฟีเจอร์ (orders, payments, etc.)
│       ├── sockets/            # ตัวคุม Real-time (Chat, Order status, KDS)
│       └── jobs/               # Cron Job ลบแชท/สลิป 24 ชม.
│
└── frontend/                   # ส่วนติดต่อผู้ใช้ PWA (React + Vite)
    └── src/
        ├── api/                # ตัวยิง HTTP Request (Axios)
        ├── context/            # Global State (Auth, Cart, Socket)
        ├── components/         # คอมโพเนนต์ส่วนกลาง (Navbar, ChatBox, Modal)
        └── pages/              # แยกหน้าตาม Role (customer, merchant, rider)

```
## 📦 Installation & Dependencies (สำหรับทีมพัฒนา)

เพื่อให้ทุกคนในทีมใช้ Module และเวอร์ชันเดียวกัน 100% โปรเจคนี้จะถูกควบคุมเวอร์ชันด้วย `package.json` และ `package-lock.json` 

**ขั้นตอนการติดตั้ง (รันเมื่อ Clone โปรเจคครั้งแรก หรือเมื่อมีการดึงโค้ดใหม่)**

เปิด Terminal ที่โฟลเดอร์ Root (`behind-north-bangkok`) แล้วรันคำสั่งตามลำดับต่อไปนี้:

1. **ติดตั้งเครื่องมือรันโปรเจครวม (Root):**
```bash
npm install
```

2. **ติดตั้ง Dependencies ฝั่ง Backend:**
```bash
cd backend
npm install
```


3. **ติดตั้ง Dependencies ฝั่ง Frontend:**
```bash
cd ../frontend
npm install
```

> ⚠️ **กฎสำคัญสำหรับทีม:**
> * **ห้าม** ลบไฟล์ `package-lock.json` เด็ดขาด เพราะเป็นไฟล์ที่ล็อคเวอร์ชันของไลบรารีให้ตรงกันทั้งทีม
> * ห้ามอัปโหลดโฟลเดอร์ `node_modules` ขึ้น GitHub (เช็คให้แน่ใจว่าอยู่ใน `.gitignore` แล้ว)
> 
> 

---

### 🛠️ Core Libraries (ไลบรารีหลักที่ใช้ในโปรเจค)

**Frontend (Next.js)**

* `next`, `react`, `react-dom`: Core Framework สำหรับทำ UI และ SSR
* `tailwindcss`: สำหรับจัดการ CSS และหน้าตาเว็บ
* `lucide-react`: ชุดไอคอนมาตรฐานของโปรเจค

**Backend (Node.js + Express)**

* `express`: Framework สำหรับสร้าง RESTful API
* `pg`: ไดรเวอร์สำหรับเชื่อมต่อฐานข้อมูล PostgreSQL
* `knex`: Query Builder สำหรับจัดการ Database Schema และ Migration
* `socket.io`: สำหรับระบบ Real-time (แชท และ อัปเดตสถานะออเดอร์)
* `promptpay-qr`: สำหรับสร้าง Dynamic PromptPay QR Code
* `cors`, `dotenv`: สำหรับจัดการความปลอดภัยและตัวแปร Environment
* `nodemon` *(Dev)*: สำหรับรีสตาร์ทเซิร์ฟเวอร์อัตโนมัติเมื่อมีการแก้โค้ด
