// backend/src/controllers/orderController.js
const orderRepo = require('../repositories/orderRepository');
const knex = require('../db');
const { ORDER_STATES, canTransition } = require('../utils/stateMachine');

const createOrder = async (req, res) => {
  try {
    // req.user ได้มาจาก verifyToken middleware
    const orderData = { 
      ...req.body, 
      customer_id: req.user.id,
      customerId: req.user.id 
    };

    const newOrder = await orderRepo.createOrder(orderData);

    // ดึงข้อมูลเสริมสำหรับส่งผ่าน Socket.io ให้ร้านค้าและลูกค้า
    const io = req.app.get('io');
    if (io) {
      let customerName = 'นักศึกษา มจพ.';
      let dormName = '';
      try {
        const cust = await knex('CUSTOMERS').where('id', newOrder.customer_id).first();
        if (cust) customerName = cust.name;
        const dorm = await knex('DORMITORIES').where('id', newOrder.delivery_dormitory_id).first();
        if (dorm) dormName = dorm.name;
      } catch (e) {
        console.warn('Could not fetch customer/dorm info for socket broadcast:', e);
      }

      const enrichedOrder = {
        ...newOrder,
        customer_name: customerName,
        dormitory_name: dormName,
        total_amount: parseFloat(newOrder.total_amount || 0)
      };

      // ส่งสัญญาณแจ้งเตือนไปยังร้านค้าและ KDS
      io.to(`merchant_${newOrder.merchant_id}`).emit('NEW_ORDER_RECEIVED', {
        order: enrichedOrder
      });
      io.to(`merchant_${newOrder.merchant_id}_kds`).emit('NEW_ORDER_RECEIVED', {
        order: enrichedOrder
      });
      io.to(`customer_${newOrder.customer_id}`).emit('ORDER_STATUS_UPDATED', {
        order_id: Number(newOrder.id),
        status: newOrder.status,
        order: enrichedOrder
      });
    }

    return res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status: nextState, rider_id } = req.body;
    
    // ดึงข้อมูลผู้ใช้งานจาก JWT Token
    const userRole = req.user.role?.toUpperCase();
    const userId = req.user.id;

    // 1. ดึงข้อมูล Order เดิมเพื่อตรวจสอบสถานะและความเป็นเจ้าของ
    const order = await orderRepo.getOrderById(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderCustomerId = order.customer_id || order.customerId;
    const orderMerchantId = order.merchant_id || order.merchantId;
    const orderRiderId = order.rider_id || order.riderId;

    // 2. ล็อกความปลอดภัย: ห้ามเปลี่ยนเป็นสถานะ PAID ผ่าน Endpoint นี้โดยตรง
    // สถานะ PAID ต้องเกิดจากกระบวนการตรวจสลิป (Slip Verification API) เท่านั้น
    if (nextState === ORDER_STATES.PAID) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Status PAID can only be updated via slip verification process'
      });
    }

    // 3. State Machine Validation: ตรวจสอบความถูกต้องของลำดับสถานะ
    if (!canTransition(order.status, nextState)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from ${order.status} to ${nextState}`
      });
    }

    // 4. Role-Based Access Control (RBAC) & Ownership Validation
    switch (nextState) {
      // ----------------- ฝั่งลูกค้า -----------------
      case ORDER_STATES.CANCELLED_BY_CUSTOMER:
        if (userRole !== 'CUSTOMER') {
          return res.status(403).json({ success: false, message: 'Only customer can cancel order' });
        }
        if (orderCustomerId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not own this order' });
        }
        break;

      // ----------------- ฝั่งร้านค้า -----------------
      case ORDER_STATES.PENDING_PAYMENT:        // ร้านกดยอมรับออเดอร์
      case ORDER_STATES.REJECTED_BY_MERCHANT:   // ร้านกดปฏิเสธออเดอร์
      case ORDER_STATES.PREPARING:              // ร้านเริ่มปรุงอาหาร
      case ORDER_STATES.READY_FOR_DELIVERY:     // อาหารพร้อมส่ง/รอมอบหมายงาน
        if (userRole !== 'MERCHANT') {
          return res.status(403).json({ 
            success: false, 
            message: `Only merchant can update status to ${nextState}` 
          });
        }
        if (orderMerchantId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not own this store' });
        }
        break;

      // ----------------- ช่วงการจัดส่ง (ร้านค้าสามารถทำแทนคนส่งได้) -----------------
      case ORDER_STATES.IN_DELIVERY:            // กำลังจัดส่ง
        if (userRole !== 'RIDER' && userRole !== 'MERCHANT') {
          return res.status(403).json({ 
            success: false, 
            message: 'Only rider or merchant can start delivery' 
          });
        }
        // หากเป็นร้านค้า ต้องเป็นร้านเจ้าของออเดอร์
        if (userRole === 'MERCHANT' && orderMerchantId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not own this store' });
        }
        // หากเป็นคนส่ง ต้องเป็นคนที่ได้รับมอบหมายในออเดอร์นี้
        if (userRole === 'RIDER' && orderRiderId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this order' });
        }
        break;

      case ORDER_STATES.COMPLETED:              // จัดส่งสำเร็จ
        if (userRole !== 'RIDER' && userRole !== 'MERCHANT') {
          return res.status(403).json({ 
            success: false, 
            message: 'Only rider or merchant can complete order' 
          });
        }
        // ร้านค้าสามารถกดส่งสำเร็จแทนได้ (เช่น ร้านไปส่งเอง หรือคนขับแบตหมด/มีปัญหา)
        if (userRole === 'MERCHANT' && orderMerchantId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not own this store' });
        }
        // หากเป็นคนส่ง ต้องเป็นคนที่ได้รับมอบหมายในออเดอร์นี้
        if (userRole === 'RIDER' && orderRiderId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this order' });
        }
        break;

      default:
        return res.status(400).json({ success: false, message: `Unsupported target status: ${nextState}` });
    }

    // 5. จัดการ rider_id: อนุญาตให้ร้านค้ามอบหมายหรือปรับปรุง rider ได้
    // และคงค่าเดิมไว้หากไม่มีการส่ง rider_id ใหม่เข้ามา ป้องกันการถูกแทนที่ด้วย null
    let effectiveRiderId = orderRiderId;
    if (rider_id !== undefined) {
      if (userRole !== 'MERCHANT') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only merchant can assign or modify rider' 
        });
      }
      effectiveRiderId = rider_id;
    }

    // 6. อัปเดตสถานะและ rider_id ลงฐานข้อมูลผ่าน Repository
    const updatedOrder = await orderRepo.updateOrderStatus(order_id, nextState, effectiveRiderId);

    // 7. ส่งสัญญาณแจ้งเตือน Real-time ผ่าน Socket.io
    const io = req.app.get('io');
    if (io) {
      const payload = {
        order_id: Number(order_id),
        status: nextState,
        rider_id: effectiveRiderId,
        updated_by: userRole,
        updated_at: new Date()
      };
      io.to(`order_${order_id}`).emit('ORDER_STATUS_UPDATED', payload);
      if (orderMerchantId) {
        io.to(`merchant_${orderMerchantId}`).emit('ORDER_STATUS_UPDATED', payload);
      }
      if (orderCustomerId) {
        io.to(`customer_${orderCustomerId}`).emit('ORDER_STATUS_UPDATED', payload);
      }

      // หากมีการมอบหมาย Rider ให้แจ้งเตือนไปยัง Rider ห้องส่วนตัวด้วย
      if (nextState === ORDER_STATES.READY_FOR_DELIVERY && effectiveRiderId) {
        io.to(`rider_${effectiveRiderId}`).emit('RIDER_ORDER_ASSIGNED', {
          order_id: Number(order_id),
          status: nextState,
          rider_id: effectiveRiderId
        });
      }
    }

    return res.status(200).json({ success: true, data: updatedOrder });

  } catch (error) {
    console.error('Change Status Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  createOrder,
  changeOrderStatus
};
