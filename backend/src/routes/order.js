const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/verifyToken'); // Middleware สำหรับเช็ค JWT Token

// นำ verifyToken มาใช้กับทุก Route ในไฟล์นี้ เพื่อยืนยันตัวตนก่อนทำงาน
router.use(verifyToken);

/**
 * @route   POST /api/orders
 * @desc    สร้างออเดอร์ใหม่ (สถานะเริ่มต้นจะเป็น PENDING_ACCEPT)
 * @access  Private (เฉพาะ Customer ที่ Login แล้ว)
 */
router.post('/', orderController.createOrder);

/**
 * @route   PUT /api/orders/:order_id/status
 * @desc    เปลี่ยนสถานะของออเดอร์ (ตามกฎของ State Machine)
 * @access  Private (Customer, Merchant, Rider ขึ้นอยู่กับสถานะที่ต้องการเปลี่ยน)
 */
router.put('/:order_id/status', orderController.changeOrderStatus);

// (เตรียมไว้สำหรับอนาคต)
// router.get('/:order_id', orderController.getOrderDetails);
// router.put('/:order_id/items/:item_id/complete', orderController.completeOrderItem); // สำหรับ KDS

module.exports = router;