const express = require('express');
const router = express.Router();

// นำเข้า Controllers (ใช้ชื่อไฟล์แบบไม่มีจุดคั่นกลางแล้ว)
const customerAuth = require('../controllers/customerAuth');
const merchantAuth = require('../controllers/merchantAuth');
const riderAuth = require('../controllers/riderAuth');

// --- เส้นทางสำหรับลูกค้า (Customer) ---
router.post('/customer/register', customerAuth.register);
router.post('/customer/login', customerAuth.login);

// --- เส้นทางสำหรับร้านค้า (Merchant) ---
router.post('/merchant/login', merchantAuth.login);
router.post('/merchant/register', merchantAuth.register);

// --- เส้นทางสำหรับพนักงานส่งอาหาร (Rider) ---
// แยกระบบล็อกอินเฉพาะ เพื่อไม่ให้ Rider เข้าถึงข้อมูลร้านค้าได้[cite: 3]
router.post('/rider/login', riderAuth.login);

module.exports = router;