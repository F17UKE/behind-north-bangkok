const express = require('express');
const router = express.Router();

// นำเข้า Controllers
const customerAuth = require('../controllers/customerAuth');
const merchantAuth = require('../controllers/merchantAuth');
const riderAuth = require('../controllers/riderAuth');
const adminAuth = require('../controllers/adminAuth');

// --- เส้นทางสำหรับลูกค้า (Customer) ---
router.post('/customer/register', customerAuth.register);
router.post('/customer/login', customerAuth.login);

// --- เส้นทางสำหรับร้านค้า (Merchant) ---
router.post('/merchant/login', merchantAuth.login);
router.post('/merchant/register', merchantAuth.register);

// --- เส้นทางสำหรับพนักงานส่งอาหาร (Rider) ---
router.post('/rider/login', riderAuth.login);

// --- เส้นทางสำหรับผู้ดูแลระบบ (Admin) ---
router.post('/admin/login', adminAuth.login);

module.exports = router;
