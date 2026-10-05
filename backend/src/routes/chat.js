const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const verifyToken = require('../middlewares/verifyToken');

router.use(verifyToken);

router.get('/orders/:order_id/messages', chatController.getChatHistory);
router.post('/:order_id/messages', chatController.sendMessage);
router.put('/orders/:order_id/messages/read', chatController.updateWatermark);

module.exports = router;