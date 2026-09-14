# 📌 PROJECT CONTEXT: Hyperlocal P2P Food Delivery Web Application

> **วัตถุประสงค์ของเอกสารนี้:** ใช้เป็นบริบทตั้งต้นหลัก (Master Context) สำหรับการพัฒนาและป้อนให้ AI Assistant รับทราบขอบเขตทางธุรกิจ (Business Logic), สถาปัตยกรรมระบบ, สถานะกระบวนการ (State Machine), และข้อกำหนดทางเทคนิคทั้งหมด เพื่อให้การเขียนโค้ดและสร้าง API สอดคล้องกับมาตรฐานของระบบโดยสมบูรณ์[cite: 3]

---

## 1. Executive Summary & Problem Statement

* **ภาพรวมโปรเจกต์:** แพลตฟอร์มสั่งและจัดส่งอาหารแบบเรียลไทม์ภายในชุมชนเฉพาะส่วน (เช่น มหาวิทยาลัยหรือวิทยาเขต) ผ่าน Web Application[cite: 3]
* **ปัญหาเดิม (Pain Point):** ระบบเดิมใช้การสั่งอาหารผ่านกลุ่ม **Line OpenChat** ซึ่งก่อให้เกิดปัญหาสำคัญ:[cite: 3]
  1. เมื่อข้อความสะสมจำนวนมาก ตัวแอปพลิเคชันจะกระตุก หน่วง (Lag) หรือไม่ยอมโหลดข้อความ[cite: 3]
  2. การค้นหาร้านค้าและเมนูกระจัดกระจาย ไม่เป็นหมวดหมู่[cite: 3]
  3. ติดตามสถานะออเดอร์ลำบาก และเกิดความผิดพลาดในการยืนยันยอดโอนเงิน[cite: 3]
* **แนวทางแก้ไข (Solution):** พัฒนา Hyperlocal P2P Web Application ที่รวมศูนย์การค้นหา, ควบคุมสถานะคำสั่งซื้อผ่าน Finite State Machine, คำนวณค่าส่งตามระยะซอย/โซน, รองรับการปรับแต่งเมนู (Modifiers), เชื่อมต่อ Dynamic PromptPay QR Code, ตรวจสลิปอัตโนมัติ, ระบบครัว KDS, บัญชีคนขับพนักงาน (Merchant Rider Staff) พร้อมระบบแชทแบบ 1-on-1 ที่รองรับการสลับ Role ระหว่างร้านค้ากับคนส่งอาหาร ระบบอ่านแล้วแบบ Watermark และระบบล้างข้อมูลหมดอายุทุก 24 ชั่วโมง[cite: 3]

---

## 2. Core User Roles & Delivery Model

1. **Customer (ผู้ซื้อ):**[cite: 3]
   * ลงทะเบียนและเข้าสู่ระบบด้วย Username/Password ปกติ หรือผ่าน Social Logins (Google OAuth 2.0 / LINE Login)[cite: 3]
   * ค้นหาร้านค้า เมนูอาหาร พร้อมเลือกตัวเลือกเสริม (Modifiers: ระดับความเผ็ด, ท็อปปิ้ง, หมายเหตุ)[cite: 3]
   * ตรวจสอบค่าจัดส่งที่คำนวณตามซอย/หอพักปลายทางแบบไดนามิก[cite: 3]
   * สแกนจ่ายเงินผ่าน Dynamic PromptPay QR Code เมื่อร้านค้ารับออเดอร์ พร้อมอัปโหลดสลิปธนาคาร[cite: 3]
   * ยกเลิกคำสั่งซื้อได้เฉพาะขั้นตอน `PENDING_PAYMENT` เท่านั้น[cite: 3]
   * ติดตามสถานะอาหารแบบ Real-time, แชท และโทรคุยแบบ In-App Voice Call กับร้านค้าหรือคนส่งอาหาร[cite: 3]
2. **Merchant (ร้านค้า):**[cite: 3]
   * ลงทะเบียนร้านค้า ระบุ PromptPay ID, ตัวย่อร้าน (Prefix), ที่ตั้ง (Location) และอัปโหลดภาพหน้าร้าน[cite: 3]
   * ตั้งค่าเรทค่าจัดส่งแยกตามซอย (`delivery_fees`) หรือเปิดให้จัดส่งฟรี[cite: 3]
   * จัดการแคตตาล็อกเมนูอาหาร คำอธิบาย ราคา และกลุ่มตัวเลือกเสริม (`is_required`, `allow_multiple`)[cite: 3]
   * ตรวจสอบคำสั่งซื้อใหม่ผ่าน Merchant Dashboard (กดยืนยันหรือปฏิเสธ)[cite: 3]
   * ใช้งานระบบครัว (Kitchen Display System - KDS) เพื่อติ๊กเครื่องหมายเสร็จรายจาน (`is_completed`) หรือกดเสร็จสิ้นทั้งบิล[cite: 3]
   * **การจัดการพนักงานส่งอาหาร (Staff Rider Management):** ร้านค้าสามารถสร้างบัญชี Rider Staff ประจำร้านของตนเอง (`merchant_riders`) พร้อมตั้ง `username` และ `password` ให้คนขับได้ ร้านค้าเป็นผู้กดมอบหมายออเดอร์ (`rider_id`) ให้คนขับแต่ละคน[cite: 3]
3. **Merchant Rider (คนส่งอาหารประจำร้าน):**[cite: 3]
   * เข้าสู่ระบบผ่านหน้าล็อกอินเฉพาะ (`/rider-login`) ด้วย Username และ Password ที่ร้านค้าสร้างให้[cite: 3]
   * เข้าถึงเฉพาะหน้า **Rider Dispatch Board** เพื่อดูคิวออเดอร์ที่ตนได้รับมอบหมาย (`WHERE rider_id = :id`)[cite: 3]
   * มีสิทธิ์กดเปลี่ยนสถานะเป็น `IN_DELIVERY` และ `COMPLETED`[cite: 3]
   * มีสิทธิ์โทรและแชทกับลูกค้าผ่านห้องแชทของออเดอร์นั้น[cite: 3]
   * **ข้อจำกัดสิทธิ์ (Security Isolation):** ไม่สามารถเปิดดูยอดขายรวม, บัญชีรายได้, เมนูหลังบ้าน หรือข้อมูลส่วนตัวของร้านค้าได้[cite: 3]
4. **Admin (ผู้ดูแลระบบ):**[cite: 3]
   * ตรวจสอบความถูกต้องและอนุมัติร้านค้าใหม่เข้าสู่ระบบ[cite: 3]

---

## 3. Tech Stack & System Architecture

### Frontend (User Interface & Client)
* **Core Framework:** Next.js (App Router) สำหรับการพัฒนา UI, ทำ Server-Side Rendering (SSR) และ Client-Side Routing
* **Styling:** Tailwind CSS สำหรับจัดการความสวยงามและ Responsive Web Application / Progressive Web App (PWA)
* **UI Components & Icons:** Lucide React สำหรับชุดไอคอน
* **Language:** JavaScript / JSX

### Backend & Real-time Processing
* **Core Backend:** Node.js (Express.js) - RESTful API Architecture[cite: 3]
* **Real-time Engine:** WebSockets (Socket.io) รองรับการแจ้งเตือนสถานะ, ห้องแชท, ข้อความอ่านแล้ว (Watermark) และ Voice Call Signaling (WebRTC)[cite: 3]
* **Architecture Pattern:** Repository Pattern เพื่อการจัดการข้อมูลที่เป็นระบบและยืดหยุ่น

### Database & External Integration
* **Database Management:** Relational Database (PostgreSQL จัดการผ่าน Knex.js Migration & Query Builder)[cite: 3]
* **Payment Integration:** Dynamic PromptPay QR Generator (`promptpay-qr` library)[cite: 3]
* **Verification Engine:** Slip Verification API (SlipOK หรือ EasySlip API) สำหรับตรวจสอบความถูกต้องของสลิปแบบอัตโนมัติ[cite: 3]
* **Asset Storage:** จัดเก็บรูปภาพ (สลิป, โปรไฟล์, เมนู) บน Object Storage (AWS S3 / Cloudinary) และบันทึกเฉพาะ URL ลงฐานข้อมูล[cite: 3]

---

## 4. Key Workflows & Business Logic

### 4.1 Order State Machine (วงจรสถานะออเดอร์)
สถานะของคำสั่งซื้อในตาราง `orders` ต้องดำเนินไปตามลำดับอย่างเคร่งครัด:[cite: 3]

1. **`PENDING_ACCEPT` (รอร้านรับออเดอร์):** ลูกค้ากดยืนยันตะกร้า -> ส่งข้อมูลเข้ากระดานร้านค้าเพื่อตรวจสอบวัตถุดิบ[cite: 3]
2. **`REJECTED_BY_MERCHANT` (ร้านปฏิเสธ):** ร้านค้ากดปฏิเสธเนื่องจากวัตถุดิบหมดหรือไม่พร้อมจำหน่าย (สิ้นสุดกระบวนการ)[cite: 3]
3. **`PENDING_PAYMENT` (รอชำระเงิน):** ร้านค้ากดยอมรับ -> ระบบดึง PromptPay ID และยอดสุทธิมาสร้าง Dynamic QR Code *(ลูกค้ายกเลิกคำสั่งซื้อได้เฉพาะในสถานะนี้เท่านั้น)*[cite: 3]
4. **`CANCELLED_BY_CUSTOMER` (ลูกค้ายกเลิก):** ลูกค้ากดยกเลิกคำสั่งซื้อก่อนการชำระเงิน (สิ้นสุดกระบวนการ)[cite: 3]
5. **`PAID` (ชำระเงินแล้ว):** สลิปผ่านการตรวจสอบจาก Slip Verification API อัตโนมัติ *(ระบบล็อก ห้ามลูกค้ายกเลิกคำสั่งซื้อหลังจากขั้นตอนนี้)*[cite: 3]
6. **`PREPARING` (กำลังทำอาหาร):** ร้านค้ารับทราบยอดเงินและเริ่มปรุงอาหาร[cite: 3]
7. **`READY_FOR_DELIVERY` (อาหารเสร็จสิ้น/รอมอบหมายงาน):** เกิดขึ้นเมื่อติ๊กรายการอาหารใน KDS ครบทุกจาน หรือร้านค้ากดเปลี่ยนสถานะที่ตัวการ์ดออเดอร์ ร้านค้าจะเลือกมอบหมาย Rider ประจำร้าน (`rider_id`) ในขั้นตอนนี้[cite: 3]
8. **`IN_DELIVERY` (กำลังจัดส่ง):** Rider กดรับงานบน Dispatch Board แล้วนำอาหารออกเดินทางไปยังหอพักปลายทาง[cite: 3]
9. **`COMPLETED` (จัดส่งสำเร็จ):** Rider หรือร้านค้ากดยืนยันส่งมอบอาหารให้ลูกค้าเรียบร้อย (สิ้นสุดกระบวนการ)[cite: 3]

### 4.2 Dynamic Payment & Verification Pipeline
1. เมื่อออเดอร์เปลี่ยนเป็น `PENDING_PAYMENT` ระบบจะนำ PromptPay ID ของร้านค้า + `total_amount` ของออเดอร์นั้นมาสร้างเป็น Dynamic PromptPay QR Code[cite: 3]
2. ลูกค้าสแกนและอัปโหลดรูปภาพสลิปโอนเงินเข้าสู่ระบบ[cite: 3]
3. ระบบส่งรูปภาพสลิปไปยัง Slip Verification API เพื่อตรวจสอบเงื่อนไข 3 ด้าน:[cite: 3]
   * ยอดเงินที่โอนตรงกับ `total_amount` ของออเดอร์หรือไม่[cite: 3]
   * บัญชีหรือเบอร์พร้อมเพย์ผู้รับ ตรงกับ `promptpay_id` ของร้านค้านั้นหรือไม่[cite: 3]
   * รหัสอ้างอิงธุรกรรมธนาคาร (`ref_number`) ต้องไม่เคยบันทึกสำเร็จในระบบมาก่อน (ป้องกันการเวียนใช้สลิปซ้ำ)[cite: 3]
4. หากผ่านเงื่อนไข ระบบจะบันทึกลง `payment_slips`, ปรับสถานะออเดอร์เป็น `PAID` และส่งสัญญาณ Socket.io แจ้งเตือนห้องครัวทันที[cite: 3]

### 4.3 Kitchen Display System (KDS) Logic
* ตาราง `order_items` มีฟิลด์ `is_completed` (Boolean) เพื่อระบุสถานะรายจาน[cite: 3]
* **การทำงานระดับจาน:** เมื่อพ่อครัวทำอาหารเสร็จ 1 รายการ สามารถยิง API อัปเดต `is_completed = true` ได้ทันที ระบบจะตรวจสอบจำนวนจานที่เหลือ หากเสร็จครบทุกจาน (`COUNT(is_completed = false) === 0`) จะปรับสถานะออเดอร์ใน `orders` เป็น `READY_FOR_DELIVERY` โดยอัตโนมัติ[cite: 3]
* **การทำงานระดับบิล:** ร้านค้าสามารถกดปุ่ม "เสร็จสิ้นทั้งหมด" ที่ตัว Card เพื่อปรับสถานะออเดอร์เป็น `READY_FOR_DELIVERY` ได้ทันที ซึ่งระบบจะสั่งอัปเดต `is_completed = true` ให้กับทุกรายการในบิลนั้นโดยอัตโนมัติ[cite: 3]

### 4.4 Real-time Chat, Multi-Role Messaging & Read Receipts
* **Order-based Room:** สร้างห้องแชทแยกตามรายออเดอร์ (1 คำสั่งซื้อ = 1 ห้อง)[cite: 3]
* **Unified Merchant Chat & Role Toggling:** ระบบแชทยึดโครงสร้าง 2 ฝั่ง (`is_merchant_sender: true/false`) แต่ฝั่งร้านค้า/คนส่งสามารถเลือกสลับบทบาท (`sender_sub_role`) ขณะพิมพ์ส่งข้อความได้:[cite: 3]
  * `STORE`: พิมพ์ในฐานะร้านค้า (เช่น แจ้งเรื่องวัตถุดิบหรือการปรุงอาหาร)[cite: 3]
  * `RIDER`: พิมพ์ในฐานะคนส่งอาหาร (เช่น แจ้งว่าถึงใต้หอพักแล้ว) โดยระบบจะแสดง Badge หรือระบุชื่อ Rider ให้ลูกค้าเห็นชัดเจน[cite: 3]
* **Read Receipts (Watermark Pattern):** ใช้การบันทึก ID ของข้อความล่าสุดที่เปิดอ่านลงใน `customer_last_read_message_id` และ `merchant_last_read_message_id` ในตาราง `orders` การแสดงผลสถานะ "อ่านแล้ว" จะคำนวณผ่านเงื่อนไข `message.id <= last_read_message_id` เสมอ[cite: 3]
* **In-App Telephony Logs:** รองรับการบันทึกประเภทข้อความการโทร (`CALL_STARTED`, `CALL_ENDED`, `CALL_MISSED`) พร้อมระยะเวลาโทร (`call_duration_seconds`) โดยไม่มีการบันทึกไฟล์เสียงสนทนา[cite: 3]

### 4.5 Data Purging Policy (24h Retention)
* ระบบเบื้องหลังจะรัน Scheduled Cron Job เพื่อตรวจสอบและล้างข้อมูลข้อความแชท (`messages`) รวมถึงหลักฐานการชำระเงิน (`payment_slips`) ที่มีอายุเกิน 24 ชั่วโมง นับจาก `created_at` ออกจากฐานข้อมูลและพื้นที่จัดเก็บ[cite: 3]
* ข้อมูลทางประวัติศาสตร์ของคำสั่งซื้อ (`orders`, `order_items`, `order_item_choices`) จะคงอยู่ถาวรเพื่อการทำบัญชีและตรวจสอบย้อนหลัง[cite: 3]

---

## 5. Architectural & Database Design Rules

1. **Snapshot Pattern (แช่แข็งข้อมูล):** ข้อมูลราคาและที่อยู่จัดส่งต้องคัดลอกมาเก็บไว้ในตาราง Transaction เสมอ ได้แก่ `orders.delivery_fee`, `orders.delivery_dormitory_id`, `orders.delivery_room_number`, `order_items.unit_price`, `order_item_choices.choice_name` และ `order_item_choices.extra_price` ห้ามพึ่งพาการ JOIN ไปยัง Master Data สำหรับการคำนวณบิลย้อนหลัง[cite: 3]
2. **Surrogate Key Priority:** ใช้ `id` (Serial/Auto-increment Integer) เป็น Primary Key ของทุกตารางเสมอ สำหรับ `username` ให้ควบคุมด้วย `UNIQUE` Constraint แทนการนำมาเป็น PK เพื่อป้องกันปัญหา Cascading Updates[cite: 3]
3. **Database Schema Reference:** โครงสร้าง DDL, Data Dictionary, และความสัมพันธ์เชิงลึก ให้ยึดถือตามเอกสาร **`DATABASE_SCHEMA.md`** เป็นหลัก[cite: 3]

---

## 6. AI Development Guidelines

เมื่อนำเอกสารนี้ไปใช้ในการ Prompt สั่งงาน ให้ AI ปฏิบัติตามมาตรฐานต่อไปนี้:[cite: 3]

* **Environment Alignment:** เขียนโค้ด Backend ด้วย Node.js (Express.js) ร่วมกับ Knex.js Query Builder และ Socket.io เป็นหลัก[cite: 3]
* **Strict State Transition:** ทุกฟังก์ชันหรือ API Route ที่เกี่ยวข้องกับการปรับสถานะออเดอร์ ต้องดักตรวจสอบสถานะตั้งต้นตาม Order State Machine เสมอ ห้ามข้ามขั้นตอน[cite: 3]
* **Security & Validation:** ตรวจสอบความถูกต้องของ Input เสมอ และบังคับใช้ Role-Based Access Control (RBAC) เพื่อกั้นไม่ให้ Rider เข้าถึง API ข้อมูลทางการเงินหรือการตั้งค่าของร้านค้า[cite: 3]
* **High Performance Querying:** คำนึงถึงดัชนี (Indexes) และเขียนคำสั่ง Query ให้อยู่ในรูปแบบที่ประหยัด I/O ของ Database เสมอ[cite: 3]