// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// ป้องกันทุก Route ในนี้: ต้องเป็น Admin เท่านั้น
router.use(verifyToken);
router.use(checkRole('ADMIN'));

// 1. ดึงรายการร้านค้าที่รอการอนุมัติ
router.get('/merchants/pending', adminController.getPendingMerchants);

// 2. ดึงรายการร้านค้าทั้งหมด
router.get('/merchants', adminController.getAllMerchants);

// 3. อนุมัติร้านค้า
router.patch('/merchants/:merchant_id/approve', adminController.approveMerchant);

// 4. ปฏิเสธ/ระงับร้านค้า
router.patch('/merchants/:merchant_id/reject', adminController.rejectMerchant);

module.exports = router;
