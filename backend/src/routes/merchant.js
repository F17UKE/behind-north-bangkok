const express = require('express');
const router = express.Router();

// นำเข้า Controller และ Middleware
const riderAuth = require('../controllers/riderAuth');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const merchantController = require('../controllers/merchantController');

// [POST] /api/merchants/riders
// API สำหรับให้ร้านค้าสร้างบัญชี Rider
router.post('/riders', verifyToken, checkRole(['MERCHANT']), riderAuth.createRider);

// 1. ดึงรายการร้านค้าทั้งหมดที่เปิดอยู่
router.get('/', merchantController.getMerchants);

// 2. ดึงรายละเอียดร้านค้าตาม ID
router.get('/:merchant_id', merchantController.getMerchantById);

// 3. ดึงรายการเมนูอาหารทั้งหมดของร้านค้า
router.get('/:merchant_id/menu', merchantController.getMerchantMenu);
module.exports = router;