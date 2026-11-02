const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { createOrderSchema, changeOrderStatusSchema } = require('../validations/orderValidation');

// นำ verifyToken มาใช้กับทุก Route ในไฟล์นี้
router.use(verifyToken);

/**
 * @route   POST /api/orders
 * @desc    สร้างออเดอร์ใหม่ (ตรวจสอบโครงสร้างตะกร้าและรายการอาหารด้วย Zod)
 */
router.post('/', validate(createOrderSchema), orderController.createOrder);

/**
 * @route   PUT /api/orders/:order_id/status
 * @desc    เปลี่ยนสถานะของออเดอร์ (ตามกฎของ State Machine)
 */
router.put('/:order_id/status', validate(changeOrderStatusSchema), orderController.changeOrderStatus);

module.exports = router;
