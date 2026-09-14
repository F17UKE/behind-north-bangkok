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