const repo = require('../repositories/orderWorkflowRepository');

// Helper สำหรับยิง Socket Event
const emitOrderStatus = (req, order, status, extra = {}) => {
  const io = req.app.get('io');
  if (io) {
    const orderId = Number(order.id);
    const payload = {
      order_id: orderId,
      status,
      updated_by: req.user?.role,
      updated_at: new Date(),
      ...extra
    };
    io.to(`order_${orderId}`).emit('ORDER_STATUS_UPDATED', {
      ...payload
    });
    io.to(`merchant_${order.merchant_id}`).emit('ORDER_STATUS_UPDATED', payload);
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
    
    // ลูกค้ายกเลิกได้เฉพาะตอนรอชำระเงิน (PENDING_PAYMENT) เท่านั้น
    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ success: false, message: 'Can only cancel order in PENDING_PAYMENT state' });
    }

    const updated = await repo.updateOrderStatus(order_id, 'CANCELLED_BY_CUSTOMER');
    emitOrderStatus(req, order, 'CANCELLED_BY_CUSTOMER');

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

    // ร้านค้ารับออเดอร์ได้เฉพาะตอน PENDING_ACCEPT เท่านั้น
    if (order.status !== 'PENDING_ACCEPT') {
      return res.status(400).json({ success: false, message: 'Order is not in PENDING_ACCEPT state' });
    }

    const updated = await repo.updateOrderStatus(order_id, 'PENDING_PAYMENT');
    emitOrderStatus(req, order, 'PENDING_PAYMENT');

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

    if (order.status !== 'PENDING_ACCEPT') {
      return res.status(400).json({ success: false, message: 'Order is not in PENDING_ACCEPT state' });
    }

    const updated = await repo.updateOrderStatus(order_id, 'REJECTED_BY_MERCHANT');
    emitOrderStatus(req, order, 'REJECTED_BY_MERCHANT');

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ร้านค้าเริ่มปรุงอาหาร (PAID -> PREPARING)
exports.startPreparing = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await repo.getOrderById(order_id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.merchant_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (order.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Order must be in PAID state to start preparing' });
    }

    const updated = await repo.updateOrderStatus(order_id, 'PREPARING');
    emitOrderStatus(req, order, 'PREPARING');

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
    emitOrderStatus(req, order, 'READY_FOR_DELIVERY', { rider_id });

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
