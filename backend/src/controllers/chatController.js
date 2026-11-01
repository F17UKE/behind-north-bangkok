const chatRepository = require('../repositories/chatRepository');
const knex = require('../db');

// Helper ตรวจสอบสิทธิ์ว่าผู้ใช้เกี่ยวข้องกับออเดอร์นี้หรือไม่
const checkOrderAccess = async (orderId, user) => {
  const order = await knex('ORDERS').where('id', orderId).first();
  if (!order) return { allowed: false, notFound: true };

  if (user.role === 'ADMIN') return { allowed: true, order };
  if (user.role === 'CUSTOMER' && order.customer_id === user.id) return { allowed: true, order };
  if (user.role === 'MERCHANT' && order.merchant_id === user.id) return { allowed: true, order };
  if (user.role === 'RIDER' && (order.rider_id === user.id || user.merchant_id === order.merchant_id)) return { allowed: true, order };

  return { allowed: false, notFound: false };
};

// GET /api/orders/:order_id/messages
exports.getChatHistory = async (req, res) => {
  try {
    const { order_id } = req.params;
    const access = await checkOrderAccess(order_id, req.user);
    if (access.notFound) return res.status(404).json({ error: 'Order not found' });
    if (!access.allowed) return res.status(403).json({ error: 'Unauthorized to access this chat' });

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
    
    const access = await checkOrderAccess(order_id, req.user);
    if (access.notFound) return res.status(404).json({ error: 'Order not found' });
    if (!access.allowed) return res.status(403).json({ error: 'Unauthorized' });

    const role = req.user.role; // 'CUSTOMER' หรือ 'MERCHANT'/'RIDER'

    await chatRepository.updateReadWatermark(order_id, role, message_id);

    // ส่งสัญญาณ Real-time ไปให้คู่สนทนาในห้องทราบว่าอ่านแล้ว
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order_id}`).emit('watermark_updated', {
        orderId: Number(order_id),
        role,
        messageId: Number(message_id)
      });
    }

    res.status(200).json({ message: 'Watermark updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
};

// POST /api/orders/:order_id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { messageType, contentText, callDurationSeconds } = req.body;

    const access = await checkOrderAccess(order_id, req.user);
    if (access.notFound) return res.status(404).json({ error: 'Order not found' });
    if (!access.allowed) return res.status(403).json({ error: 'Unauthorized to send message to this order' });

    // กำหนดบทบาทผู้ส่งอย่างปลอดภัยจาก req.user.role
    let isMerchantSender = false;
    let senderSubRole = null;

    if (req.user.role === 'MERCHANT') {
      isMerchantSender = true;
      senderSubRole = 'STORE';
    } else if (req.user.role === 'RIDER') {
      isMerchantSender = true;
      senderSubRole = 'RIDER';
    }

    const newMessage = await chatRepository.saveMessage({
      isMerchantSender,
      senderSubRole,
      messageType: messageType || 'TEXT',
      contentText: contentText,
      callDurationSeconds: callDurationSeconds || 0,
      orderId: order_id
    });

    // ส่ง Socket.io กระจายข้อความไปในห้อง
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order_id}`).emit('new_message', {
        ...newMessage,
        role: senderSubRole || (isMerchantSender ? 'STORE' : 'CUSTOMER')
      });
      const recipientRoom = isMerchantSender
        ? `customer_${access.order.customer_id}`
        : `merchant_${access.order.merchant_id}`;
      io.to(recipientRoom).emit('NEW_CHAT_MESSAGE', {
        orderId: Number(order_id),
        message: newMessage
      });
    }

    res.status(201).json({
      message: 'Message sent successfully via API',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// POST /api/orders/:order_id/calls/log
exports.logCall = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { callStatus, callDurationSeconds } = req.body;

    const access = await checkOrderAccess(order_id, req.user);
    if (access.notFound) return res.status(404).json({ error: 'Order not found' });
    if (!access.allowed) return res.status(403).json({ error: 'Unauthorized' });

    let isMerchantSender = req.user.role === 'MERCHANT' || req.user.role === 'RIDER';
    let senderSubRole = req.user.role === 'RIDER' ? 'RIDER' : (req.user.role === 'MERCHANT' ? 'STORE' : null);

    const newCallLog = await chatRepository.saveMessage({
      isMerchantSender,
      senderSubRole,
      messageType: callStatus || 'CALL_ENDED',
      contentText: `Call log: ${callStatus}`,
      callDurationSeconds: callDurationSeconds || 0,
      orderId: order_id
    });

    res.status(201).json({ success: true, data: newCallLog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
