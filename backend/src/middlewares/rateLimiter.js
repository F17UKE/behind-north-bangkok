// backend/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 1. จำกัดการเข้าสู่ระบบ/สมัครสมาชิก (ป้องกัน Brute Force Attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 30, // จำกัดไม่เกิน 30 ครั้งต่อ 15 นาทีต่อ IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication requests from this IP, please try again after 15 minutes'
    }
});

// 2. จำกัดการสร้าง QR Code และตรวจสลิป (ป้องกันการยิงสแปมเซิร์ฟเวอร์การเงิน)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many payment requests, please try again after 15 minutes'
    }
});

// 3. จำกัดคำขอทั่วไปในระบบ
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600, // จำกัด 600 คำขอต่อ 15 นาที (เฉลี่ย 40 คำขอ/นาที)
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
