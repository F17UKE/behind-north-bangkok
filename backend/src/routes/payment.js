// backend/src/routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const checkAuth = require('../middlewares/verifyToken');
const uploadMiddleware = require('../middlewares/upload');
const { paymentLimiter } = require('../middlewares/rateLimiter');

// GET /api/orders/:order_id/payment/qr
// สร้าง QR Code เพื่อจ่ายเงิน
router.get('/:order_id/payment/qr', paymentLimiter, checkAuth, paymentController.generatePromptPayQR);

// POST /api/orders/:order_id/payment/verify-slip
// อัปโหลดและตรวจสอบสลิป (รองรับทั้ง multipart/form-data และ JSON body)
router.post(
    '/:order_id/payment/verify-slip', 
    paymentLimiter,
    checkAuth, 
    uploadMiddleware.single('image'), 
    paymentController.uploadAndVerifySlip
);

module.exports = router;
