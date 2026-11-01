const repo = require('../repositories/riderBoardRepository');

exports.getOrders = async (req, res) => {
  try {
    const riderId = req.user.id; 
    const orders = await repo.getRiderOrders(riderId);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { order_id } = req.params;
    const { status } = req.body; // IN_DELIVERY หรือ COMPLETED

    // 1. ตรวจสอบว่าออเดอร์นี้ถูกมอบหมายให้ Rider คนนี้จริงๆ
    const order = await repo.getOrderByIdAndRider(order_id, riderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }

    // 2. State Machine Validation สำหรับ Rider
    if (status === 'IN_DELIVERY' && order.status !== 'READY_FOR_DELIVERY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be READY_FOR_DELIVERY before updating to IN_DELIVERY' 
      });
    }
    if (status === 'COMPLETED' && order.status !== 'IN_DELIVERY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be IN_DELIVERY before updating to COMPLETED' 
      });
    }
    
    // ป้องกันการส่ง Status อื่นๆ เข้ามา
    if (!['IN_DELIVERY', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update for rider' });
    }

    // 3. อัปเดตสถานะ
    const updated = await repo.updateOrderStatus(order_id, status);

    // 4. ส่งสัญญาณแจ้งเตือน Real-time ให้ลูกค้าและร้านค้าทราบ
    const io = req.app.get('io');
    if (io) {
      const payload = {
        order_id: Number(order_id),
        status: status,
        rider_id: riderId,
        updated_by: 'RIDER',
        updated_at: new Date()
      };
      io.to(`order_${order_id}`).emit('ORDER_STATUS_UPDATED', payload);
      if (order.merchant_id) {
        io.to(`merchant_${order.merchant_id}`).emit('ORDER_STATUS_UPDATED', payload);
      }
      if (order.customer_id) {
        io.to(`customer_${order.customer_id}`).emit('ORDER_STATUS_UPDATED', payload);
      }
    }

    res.status(200).json({ success: true, data: updated[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
