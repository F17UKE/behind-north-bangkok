const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/unread-messages-count', chatController.getUnreadCount);
router.get('/:order_id/messages', chatController.getChatHistory);
router.post('/:order_id/messages', chatController.sendMessage);
router.put('/:order_id/messages/read', chatController.updateWatermark);
// บันทึกประวัติการโทร
router.post('/:order_id/calls/log', chatController.logCall);

module.exports = router;
