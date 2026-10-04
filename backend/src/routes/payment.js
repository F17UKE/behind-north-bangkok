// backend/src/routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// นำเข้า middleware ถ้าคุณมี (แนะนำให้ล็อกอินก่อนค่อยดู QR หรือจ่ายเงินได้)
const checkAuth = require('../middlewares/verifyToken');

// GET /api/orders/:order_id/payment/qr
// สร้าง QR Code เพื่อจ่ายเงิน
router.get('/:order_id/payment/qr', checkAuth, paymentController.generatePromptPayQR);

// POST /api/orders/:order_id/payment/verify-slip
// อัปโหลดและตรวจสอบสลิป
router.post('/:order_id/payment/verify-slip', checkAuth, paymentController.uploadAndVerifySlip);

module.exports = router;