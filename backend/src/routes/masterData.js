const express = require('express');
const router = express.Router();
const controller = require('../controllers/masterDataController');

// ข้อมูล Master Data
router.get('/sois', controller.getSois);
router.get('/dormitories', controller.getDormitories);

// คำนวณค่าจัดส่ง (เอาไปรวมไว้กับ Route ร้านค้าหรือ Master Data ก็ได้)
router.get('/merchants/:merchant_id/delivery-fee', controller.calculateDeliveryFee);

module.exports = router;