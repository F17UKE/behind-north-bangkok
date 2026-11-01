const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderWorkflowController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const validate = require('../middlewares/validate');
const { assignRiderSchema } = require('../validations/orderValidation');

router.use(verifyToken); // บังคับ Login ทุก Endpoint

// --- Routes สำหรับลูกค้า (Customer) ---
router.get('/customer/orders', checkRole('CUSTOMER'), controller.getCustomerOrders);
router.put('/orders/:order_id/cancel', checkRole('CUSTOMER'), controller.cancelOrder);

// --- Routes สำหรับร้านค้า (Merchant) ---
router.get('/merchants/orders', checkRole('MERCHANT'), controller.getMerchantOrders);
router.put('/orders/:order_id/accept', checkRole('MERCHANT'), controller.acceptOrder);
router.put('/orders/:order_id/reject', checkRole('MERCHANT'), controller.rejectOrder);
router.put('/orders/:order_id/start-preparing', checkRole('MERCHANT'), controller.startPreparing);
router.put('/orders/:order_id/assign-rider', checkRole('MERCHANT'), validate(assignRiderSchema), controller.assignRider);

module.exports = router;
