// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// บังคับล็อกอินก่อนอัปโหลดไฟล์
router.use(verifyToken);

// 1. อัปโหลดสลิป (Customer)
router.post('/slip', uploadMiddleware.single('image'), uploadController.uploadSlip);

// 2. อัปโหลดรูปเมนูอาหาร (Merchant)
router.post('/menu-image', checkRole(['MERCHANT']), uploadMiddleware.single('image'), uploadController.uploadMenuImage);

// 3. อัปโหลดรูปภาพหน้าร้าน (Merchant)
router.post('/store-image', checkRole(['MERCHANT']), uploadMiddleware.single('image'), uploadController.uploadStoreImage);

module.exports = router;
