// backend/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 1. จำกัดการเข้าสู่ระบบ/สมัครสมาชิก (ป้องกัน Brute Force Attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // ปรับให้เพียงพอสำหรับการทดสอบระบบ
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication requests from this IP, please try again after 15 minutes'
    }
});

// 2. จำกัดการสร้าง QR Code และตรวจสลิป (ป้องกันการยิงสแปมเซิร์ฟเวอร์การเงิน)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000, // ขยายลิมิตไม่ให้บล็อกการสร้าง QR และตรวจสลิประหว่างการสั่งอาหาร
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many payment requests, please try again after 15 minutes'
    }
});

// 3. จำกัดคำขอทั่วไปในระบบ
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // ขยายเพื่อรองรับ polling และ real-time updates
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests from this IP, please try again later'
    }
});

module.exports = {
    authLimiter,
    paymentLimiter,
    apiLimiter
};
