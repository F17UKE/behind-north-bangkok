const chatRepository = require('../repositories/chatRepository');

// GET /api/orders/:order_id/messages
exports.getChatHistory = async (req, res) => {
  try {
    const { order_id } = req.params;
    const messages = await chatRepository.getMessagesByOrderId(order_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// PUT /api/orders/:order_id/messages/read
exports.updateWatermark = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { message_id } = req.body;
    
    // สมมติว่า req.user ถูก decode มาจาก JWT middleware
    const role = req.user.role; // 'CUSTOMER' หรือ 'MERCHANT'/'RIDER'

    await chatRepository.updateReadWatermark(order_id, role, message_id);
    res.status(200).json({ message: 'Watermark updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
};

// POST /api/orders/:order_id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { isMerchantSender, senderSubRole, messageType, contentText, callDurationSeconds } = req.body;

    // นำเข้า chatRepository หากยังไม่ได้ประกาศที่หัวไฟล์
    const chatRepository = require('../repositories/chatRepository');

    const newMessage = await chatRepository.saveMessage({
      isMerchantSender: isMerchantSender, // true (ร้านค้า/คนขับ) หรือ false (ลูกค้า)[cite: 7]
      senderSubRole: senderSubRole,       // 'STORE' หรือ 'RIDER' (ถ้าลูกค้าส่งให้ปล่อยว่าง หรือ null)[cite: 6, 7]
      messageType: messageType || 'TEXT', // 'TEXT', 'CALL_STARTED', 'CALL_ENDED', 'CALL_MISSED'[cite: 6, 7]
      contentText: contentText,
      callDurationSeconds: callDurationSeconds || 0,
      orderId: order_id
    });

    res.status(201).json({
      message: 'Message sent successfully via API',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};