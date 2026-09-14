# DATABASE_SCHEMA.md

เอกสารข้อกำหนดเชิงเทคนิคของฐานข้อมูล (Technical Database Specification) สำหรับแพลตฟอร์ม Hyperlocal P2P Food Delivery ปรับปรุงล่าสุดเพื่อรองรับ:
1. การแยกบัญชีคนขับประจำร้าน (`MERCHANT_RIDERS`) ด้วยระบบรหัสผ่านเฉพาะทาง เพื่อป้องกันการเข้าถึงข้อมูลทางการเงินของร้าน
2. การมอบหมายคนส่งอาหารในคำสั่งซื้อ (`rider_id`)
3. การสลับ Role ผู้ส่งฝั่งร้านค้า (`sender_sub_role`: `STORE` หรือ `RIDER`) ภายใต้ระบบแชทแบบ 2-Sided Watermark
4. ระบบจัดเตรียมอาหารรายจาน (Kitchen Display System - KDS) ผ่านฟิลด์ `is_completed`

---

## 1. Architectural Design Principles

* **Role & Staff Separation:** แยกตารางบัญชีผู้ใช้หลัก `CUSTOMERS` และ `MERCHANTS` ขาดจากกัน และเพิ่มตารางลูก `MERCHANT_RIDERS` สำหรับพนักงานจัดส่งที่ร้านค้าสร้างขึ้น โดย Rider มี `username` และ `password_hash` ประจำตัวเพื่อเข้าสู่หน้ารับงานจัดส่งโดยเฉพาะ ไม่สามารถเข้าถึงแดชบอร์ดสรุปยอดขายหรือระบบแคตตาล็อกของร้านค้าได้
* **Third-party Authentication:** รองรับ Local Authentication ควบคู่กับ Social Logins (Google OAuth 2.0 และ LINE Login) ในฝั่งลูกค้า โดยอนุญาตให้ `password_hash` เป็น `NULL`
* **Snapshot Pattern (Data Freezing):** แช่แข็งราคาอาหาร (`unit_price`), ราคาตัวเลือกเสริม (`extra_price`), และค่าส่ง (`delivery_fee`) ลงในตาราง Transaction ทุกครั้ง เพื่อป้องกันยอดเงินในบิลย้อนหลังคลาดเคลื่อนเมื่อ Master Data ถูกแก้ไข
* **Order-level Rider Assignment:** เมื่ออาหารพร้อมส่ง ร้านค้าจะเลือกมอบหมายออเดอร์ให้คนขับผ่านคอลัมน์ `orders.rider_id` (FK -> `merchant_riders.id`)
* **Unified Merchant Chat & Sub-role Tagging:** รักษาโครงสร้างห้องแชทแบบ 2 ขั้ว (Customer vs. Merchant) ด้วยแฟล็ก `is_merchant_sender` พร้อมเพิ่ม `sender_sub_role` (`STORE` / `RIDER`) เพื่อให้ฝั่งร้านค้าหรือคนส่งอาหารพิมพ์คุยกับลูกค้าได้ภายใต้ห้องเดียวกันโดยไม่กระทบระบบ Watermark
* **Kitchen Display System (Item-level Tracking):** ใช้ฟิลด์ `is_completed` ใน `ORDER_ITEMS` เพื่อให้ห้องครัวสามารถติ๊กสถานะอาหารเสร็จทีละจาน และมี Logic ฝั่ง Backend ในการ Trigger สถานะของ `ORDERS` ให้เปลี่ยนเป็น `READY_FOR_DELIVERY` อัตโนมัติเมื่ออาหารในบิลเสร็จครบทุกจาน
* **Watermark Pattern (Read Receipts):** ใช้การติดตามตำแหน่งข้อความล่าสุดที่อ่านผ่าน `customer_last_read_message_id` และ `merchant_last_read_message_id` ในระดับห้องแชท (`ORDERS`) เพื่อประสิทธิภาพการอัปเดตแบบ $\mathcal{O}(1)$
* **Data Purging Policy (24-Hour TTL):** บันทึกเวลา `created_at` ในตาราง `MESSAGES` และ `PAYMENT_SLIPS` เพื่อรองรับ Scheduled Cron Job ในการลบข้อมูลที่อายุเกิน 24 ชั่วโมง

---

## 2. Entity Relationship Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    SOIS ||--o{ DORMITORIES : "has"
    SOIS ||--o{ DELIVERY_FEES : "configures"
    MERCHANTS ||--o{ DELIVERY_FEES : "sets"
    MERCHANTS ||--o{ MERCHANT_RIDERS : "employs"
    DORMITORIES ||--o{ CUSTOMERS : "locates"
    DORMITORIES ||--o{ ORDERS : "delivers_to"

    CUSTOMERS ||--o{ ORDERS : "places"
    MERCHANTS ||--o{ ORDERS : "fulfills"
    MERCHANTS ||--o{ MENU_ITEMS : "owns"
    MERCHANT_RIDERS ||--o{ ORDERS : "delivers"

    MENU_ITEMS ||--o{ MENU_OPTION_GROUPS : "contains"
    MENU_OPTION_GROUPS ||--o{ MENU_OPTION_CHOICES : "lists"

    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDER_ITEMS ||--o{ ORDER_ITEM_CHOICES : "customized_with"
    MENU_OPTION_CHOICES ||--o{ ORDER_ITEM_CHOICES : "references"

    ORDERS ||--o| PAYMENT_SLIPS : "verifies_with"
    ORDERS ||--o{ MESSAGES : "includes"

    SOIS {
        int id PK
        varchar name
    }
    DORMITORIES {
        int id PK
        varchar name
        text location
        int soi_id FK
    }
    CUSTOMERS {
        int id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar google_id UK
        varchar line_id UK
        varchar phone
        varchar room_number
        varchar profile_image_url
        int dormitory_id FK
    }
    MERCHANTS {
        int id PK
        varchar username UK
        varchar password_hash
        varchar store_name
        varchar promptpay_id
        varchar prefix
        int last_order_number
        boolean is_open
        text location
        varchar store_image_url
    }
    MERCHANT_RIDERS {
        int id PK
        varchar username UK
        varchar password_hash
        varchar full_name
        varchar phone
        boolean is_active
        int merchant_id FK
    }
    DELIVERY_FEES {
        int id PK
        decimal fee
        int merchant_id FK
        int soi_id FK
    }
    MENU_ITEMS {
        int id PK
        varchar name
        text description
        decimal price
        boolean is_available
        varchar image_url
        int merchant_id FK
    }
    MENU_OPTION_GROUPS {
        int id PK
        varchar name
        boolean is_required
        boolean allow_multiple
        int menu_item_id FK
    }
    MENU_OPTION_CHOICES {
        int id PK
        varchar name
        decimal extra_price
        int option_group_id FK
    }
    ORDERS {
        int id PK
        varchar order_code UK
        int merchant_order_number
        decimal total_amount
        decimal delivery_fee
        varchar status
        int customer_last_read_message_id
        int merchant_last_read_message_id
        varchar delivery_room_number
        timestamp created_at
        int customer_id FK
        int merchant_id FK
        int delivery_dormitory_id FK
        int rider_id FK
    }
    ORDER_ITEMS {
        int id PK
        int quantity
        decimal unit_price
        varchar note
        boolean is_completed
        int order_id FK
        int menu_item_id FK
    }
    ORDER_ITEM_CHOICES {
        int id PK
        varchar choice_name
        decimal extra_price
        int order_item_id FK
        int menu_option_choice_id FK
    }
    PAYMENT_SLIPS {
        int id PK
        varchar image_url
        varchar ref_number UK
        boolean is_verified
        timestamp created_at
        int order_id FK
    }
    MESSAGES {
        int id PK
        boolean is_merchant_sender
        varchar sender_sub_role
        varchar message_type
        text content_text
        int call_duration_seconds
        timestamp created_at
        int order_id FK
    }