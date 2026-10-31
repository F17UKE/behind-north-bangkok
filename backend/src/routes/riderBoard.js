const express = require('express');
const router = express.Router();
const controller = require('../controllers/riderBoardController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

router.use(verifyToken);
// สมมติว่าใน JWT ของ Rider ถูกเซ็ต role ไว้เป็น 'RIDER' หรือ 'MERCHANT_RIDER'
router.use(checkRole('RIDER')); 

router.get('/orders', controller.getOrders);
router.put('/orders/:order_id/status', controller.updateOrderStatus);

module.exports = router;