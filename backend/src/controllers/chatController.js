const chatRepository = require('../repositories/chatRepository');
const knex = require('../db');

// Helper ตรวจสอบสิทธิ์ว่าผู้ใช้เกี่ยวข้องกับออเดอร์นี้หรือไม่
const checkOrderAccess = async (orderId, user) => {
  const cleanId = String(orderId).replace(/^#/, '');
  const numId = Number(cleanId);
  let order = null;

  if (!isNaN(numId) && numId > 0) {
    order = await knex('ORDERS').where('id', numId).first();
  }
  if (!order) {
    order = await knex('ORDERS').where('order_code', cleanId).first();
  }
  if (!order) {
    const rawNum = Number(cleanId.replace(/\D/g, ''));
    if (rawNum > 0) {
      order = await knex('ORDERS').where('id', rawNum).first();
    }
  }

  if (!order) return { allowed: false, notFound: true };

  if (user.role === 'ADMIN') return { allowed: true, order };
  if (user.role === 'CUSTOMER' && Number(order.customer_id) === Number(user.id)) return { allowed: true, order };
  if (user.role === 'MERCHANT' && Number(order.merchant_id) === Number(user.id)) return { allowed: true, order };
  if (user.role === 'RIDER') {
    const isAssigned = order.rider_id && Number(order.rider_id) === Number(user.id);
    const isStoreRider = user.merchant_id && Number(order.merchant_id) === Number(user.merchant_id);
    const isDeliveryState = ['READY_FOR_DELIVERY', 'IN_DELIVERY', 'COMPLETED'].includes(order.status);
    if (isAssigned || isStoreRider || isDeliveryState || !order.rider_id) {
      return { allowed: true, order };
    }
  }

  return { allowed: false, notFound: false };
};

// GET /api/orders/unread-messages-count
exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    let orders = [];

    if (user.role === 'CUSTOMER') {
      orders = await knex('ORDERS')
        .where('customer_id', user.id)
        .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_TIMEOUT', 'REJECTED_BY_MERCHANT'])
        .select('id', 'customer_last_read_message_id');
    } else if (user.role === 'MERCHANT') {
      orders = await knex('ORDERS')
        .where('merchant_id', user.id)
        .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_TIMEOUT', 'REJECTED_BY_MERCHANT'])
        .select('id', 'merchant_last_read_message_id');
    } else if (user.role === 'RIDER') {
      orders = await knex('ORDERS')
        .where('rider_id', user.id)
        .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_TIMEOUT', 'REJECTED_BY_MERCHANT'])
        .select('id', 'merchant_last_read_message_id');
    }

    if (orders.length === 0) {
      return res.status(200).json({ success: true, totalUnread: 0, byOrder: {} });
    }

    const orderIds = orders.map(o => o.id);
    const messages = await knex('MESSAGES')
      .whereIn('order_id', orderIds)
      .select('id', 'order_id', 'is_merchant_sender', 'sender_sub_role');

    const byOrder = {};
    let totalUnread = 0;

    for (const order of orders) {
      const orderMsgs = messages.filter(m => m.order_id === order.id);
      let unreadInOrder = 0;

      if (user.role === 'CUSTOMER') {
        const lastRead = order.customer_last_read_message_id || 0;
        unreadInOrder = orderMsgs.filter(m => m.is_merchant_sender && m.id > lastRead).length;
      } else if (user.role === 'MERCHANT') {
        const lastRead = order.merchant_last_read_message_id || 0;
        unreadInOrder = orderMsgs.filter(m => !m.is_merchant_sender && m.id > lastRead).length;
      } else if (user.role === 'RIDER') {
        const lastRead = order.merchant_last_read_message_id || 0;
        unreadInOrder = orderMsgs.filter(m => m.sender_sub_role !== 'RIDER' && m.id > lastRead).length;
      }

      if (unreadInOrder > 0) {
        byOrder[order.id] = unreadInOrder;
        totalUnread += unreadInOrder;
      }
    }

    res.status(200).json({ success: true, totalUnread, byOrder });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};

// GET /api/orders/:order_id/messages
exports.getChatHistory = async (req, res) => {
  try {
    const { order_id } = req.params;
    const access = await checkOrderAccess(order_id, req.user);
    if (access.notFound) return res.status(404).json({ error: 'Order not found' });
    if (!access.allowed) return res.status(403).json({ error: 'Unauthorized to access this chat' });

    const messages = await chatRepository.getMessagesByOrderId(access.order.id);
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

    const realOrderId = access.order.id;
    await chatRepository.updateReadWatermark(realOrderId, role, message_id);

    // ส่งสัญญาณ Real-time ไปให้คู่สนทนาในห้องทราบว่าอ่านแล้ว
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${realOrderId}`).emit('watermark_updated', {
        orderId: Number(realOrderId),
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
    const realOrderId = access.order.id;

    if (req.user.role === 'MERCHANT') {
      isMerchantSender = true;
      senderSubRole = 'STORE';
    } else if (req.user.role === 'RIDER') {
      isMerchantSender = true;
      senderSubRole = 'RIDER';
      if (!access.order.rider_id) {
        await knex('ORDERS').where('id', realOrderId).update({ rider_id: req.user.id });
        access.order.rider_id = req.user.id;
      }
    }

    const newMessage = await chatRepository.saveMessage({
      isMerchantSender,
      senderSubRole,
      messageType: messageType || 'TEXT',
      contentText: contentText,
      callDurationSeconds: callDurationSeconds || 0,
      orderId: realOrderId
    });

    // ส่ง Socket.io กระจายข้อความไปในห้อง และส่ง Notification ไปยังผู้รับ
    const io = req.app.get('io');
    if (io) {
      const messagePayload = {
        ...newMessage,
        orderId: Number(realOrderId),
        order_id: Number(realOrderId),
        role: senderSubRole || (isMerchantSender ? 'STORE' : 'CUSTOMER')
      };
      io.to(`order_${realOrderId}`).emit('new_message', messagePayload);
      io.to(`order_${realOrderId}`).emit('NEW_CHAT_MESSAGE', messagePayload);
      // ส่งการแจ้งเตือนเฉพาะผู้รับ (ไม่ส่งเตือนกลับไปยังผู้ที่เพิ่งพิมพ์ข้อความ)
      if (access.order?.merchant_id && req.user.role !== 'MERCHANT') {
        io.to(`merchant_${access.order.merchant_id}`).emit('NEW_CHAT_MESSAGE', messagePayload);
      }
      if (access.order?.customer_id && req.user.role !== 'CUSTOMER') {
        io.to(`customer_${access.order.customer_id}`).emit('NEW_CHAT_MESSAGE', messagePayload);
      }
      if (access.order?.rider_id && req.user.role !== 'RIDER') {
        io.to(`rider_${access.order.rider_id}`).emit('NEW_CHAT_MESSAGE', messagePayload);
      }
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
