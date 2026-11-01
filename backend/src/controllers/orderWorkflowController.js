const repo = require('../repositories/orderWorkflowRepository');

// Helper สำหรับยิง Socket Event ไปยัง Order Room, Merchant Room และ Customer Room พร้อมกัน
const emitOrderStatus = (req, orderId, status, extra = {}, merchantId = null, customerId = null) => {
  const io = req.app.get('io');
  if (io) {
    const payload = {
      order_id: Number(orderId),
      status,
      updated_by: req.user?.role,
      updated_at: new Date(),
      ...extra
    };
    io.to(`order_${orderId}`).emit('ORDER_STATUS_UPDATED', payload);
    if (merchantId) io.to(`merchant_${merchantId}`).emit('ORDER_STATUS_UPDATED', payload);
    if (customerId) io.to(`customer_${customerId}`).emit('ORDER_STATUS_UPDATED', payload);
  }
};

// --- ฝั่งลูกค้า (Customer) ---
exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await repo.getOrdersByCustomerId(customerId);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    // ลูกค้ายกเลิกได้เฉพาะตอนรอชำระเงิน (PENDING_PAYMENT หรือ PENDING_ACCEPT) เท่านั้น
    if (!['PENDING_PAYMENT', 'PENDING_ACCEPT'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Can only cancel order before payment/preparation' });
    }

    const updated = await repo.updateOrderStatus(order_id, 'CANCELLED_BY_CUSTOMER');
    emitOrderStatus(req, order_id, 'CANCELLED_BY_CUSTOMER', {}, order.merchant_id, order.customer_id);

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- ฝั่งร้านค้า (Merchant) ---
exports.getMerchantOrders = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const orders = await repo.getOrdersByMerchantId(merchantId);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // หากอยู่ใน PENDING_ACCEPT ปรับเป็น PENDING_PAYMENT (หรือถ้าลูกค้าจ่ายแล้วก็ไปต่อได้)
    const nextStatus = order.status === 'PENDING_ACCEPT' ? 'PENDING_PAYMENT' : order.status;
    const updated = await repo.updateOrderStatus(order_id, nextStatus);
    emitOrderStatus(req, order_id, nextStatus, {}, order.merchant_id, order.customer_id);

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const updated = await repo.updateOrderStatus(order_id, 'REJECTED_BY_MERCHANT');
    emitOrderStatus(req, order_id, 'REJECTED_BY_MERCHANT', {}, order.merchant_id, order.customer_id);

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ร้านค้าเริ่มปรุงอาหาร (PAID, PENDING_PAYMENT, PENDING_ACCEPT -> PREPARING)
exports.startPreparing = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const allowed = ['PAID', 'PENDING_PAYMENT', 'PENDING_ACCEPT'];
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot start preparing from status: ${order.status}` });
    }

    const updated = await repo.updateOrderStatus(order_id, 'PREPARING');
    emitOrderStatus(req, order_id, 'PREPARING', {}, order.merchant_id, order.customer_id);

    // แจ้งเตือนไปยังหน้าจอครัว KDS
    const io = req.app.get('io');
    if (io) {
      io.to(`merchant_${req.user.id}_kds`).emit('NEW_KITCHEN_ORDER', {
        order_id: Number(order_id)
      });
    }

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ร้านค้าทำอาหารเสร็จ พร้อมส่ง (PREPARING -> READY_FOR_DELIVERY)
exports.markReadyForDelivery = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const updated = await repo.updateOrderStatus(order_id, 'READY_FOR_DELIVERY');
    emitOrderStatus(req, order_id, 'READY_FOR_DELIVERY', {}, order.merchant_id, order.customer_id);

    // แจ้งเตือนไปยังหน้าจอครัว KDS
    const io = req.app.get('io');
    if (io) {
      io.to(`merchant_${req.user.id}_kds`).emit('KDS_ORDER_COMPLETED', {
        order_id: Number(order_id),
        status: 'READY_FOR_DELIVERY'
      });
    }

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignRider = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { rider_id } = req.body;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // มอบหมายคนขับได้ในขั้นตอน READY_FOR_DELIVERY เท่านั้น
    if (order.status !== 'READY_FOR_DELIVERY') {
      return res.status(400).json({ success: false, message: 'Food must be READY_FOR_DELIVERY to assign rider' });
    }

    const updated = await repo.assignRider(order_id, rider_id);
    emitOrderStatus(req, order_id, 'READY_FOR_DELIVERY', { rider_id }, order.merchant_id, order.customer_id);

    // แจ้งเตือนไปยัง Dispatch Board ของ Rider โดยเฉพาะ
    const io = req.app.get('io');
    if (io) {
      io.to(`rider_${rider_id}`).emit('RIDER_ORDER_ASSIGNED', {
        order_id: Number(order_id),
        status: 'READY_FOR_DELIVERY',
        rider_id
      });
    }

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ร้านค้าเลือกส่งเอง (self-deliver)
exports.selfDeliver = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await repo.assignRider(order_id, null);
    const updated = await repo.updateOrderStatus(order_id, 'IN_DELIVERY');
    emitOrderStatus(req, order_id, 'IN_DELIVERY', { delivery_by: 'MERCHANT' }, order.merchant_id, order.customer_id);

    res.status(200).json({ success: true, message: 'Merchant self delivering', data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ร้านค้าทำรายการจัดส่งสำเร็จ (complete)
exports.completeOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const updated = await repo.updateOrderStatus(order_id, 'COMPLETED');
    emitOrderStatus(req, order_id, 'COMPLETED', {}, order.merchant_id, order.customer_id);

    res.status(200).json({ success: true, message: 'Order completed', data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
