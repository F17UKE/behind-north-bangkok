// backend/src/routes/kds.js
const express = require('express');
const router = express.Router();
const kdsController = require('../controllers/kdsController');
// สมมติว่ามี middleware เหล่านี้จากโค้ดของคุณ[cite: 5]
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole'); 

// บังคับให้เฉพาะ Merchant เท่านั้นที่เรียก API หมวดนี้ได้
router.use(verifyToken, checkRole(['MERCHANT']));

// ดึงออเดอร์ทั้งหมดในครัว
router.get('/orders', kdsController.getKitchenOrders);

// ติ๊กเสร็จรายจาน
router.put('/orders/:orderId/items/:itemId/complete', kdsController.completeSingleItem);

// ติ๊กเสร็จทั้งบิล (ลัดไป READY_FOR_DELIVERY ทันที)
router.put('/orders/:orderId/complete-all', kdsController.completeEntireOrder);

module.exports = router;