// backend/src/services/orderTimeoutService.js
const knex = require('../db');
const { ORDER_STATES } = require('../utils/stateMachine');

// ตั้งค่าเวลาหมดอายุ (นาที)
const PENDING_ACCEPT_TIMEOUT_MINUTES = 10;   // ร้านไม่กดรับภายใน 10 นาที
const PENDING_PAYMENT_TIMEOUT_MINUTES = 15;  // ลูกค้าไม่ชำระเงินภายใน 15 นาที

/**
 * ตรวจสอบและยกเลิกออเดอร์ที่ค้างเกินเวลาโดยอัตโนมัติ
 * @param {import('socket.io').Server} io 
 */
const checkAndCancelTimedOutOrders = async (io) => {
    try {
        const now = new Date();
        const acceptCutoff = new Date(now.getTime() - (PENDING_ACCEPT_TIMEOUT_MINUTES * 60 * 1000));
        const paymentCutoff = new Date(now.getTime() - (PENDING_PAYMENT_TIMEOUT_MINUTES * 60 * 1000));

        // 1. ค้นหาออเดอร์ PENDING_ACCEPT ที่เกิน 10 นาที
        const expiredPendingAcceptOrders = await knex('ORDERS')
            .where('status', ORDER_STATES.PENDING_ACCEPT)
            .where('created_at', '<', acceptCutoff)
            .select('id', 'merchant_id', 'customer_id', 'order_code');

        // 2. ค้นหาออเดอร์ PENDING_PAYMENT ที่เกิน 15 นาที
        // ใช้ updated_at หากมี หรือ fallback ไปที่ created_at
        const expiredPendingPaymentOrders = await knex('ORDERS')
            .where('status', ORDER_STATES.PENDING_PAYMENT)
            .where(function() {
                this.whereRaw('COALESCE(updated_at, created_at) < ?', [paymentCutoff]);
            })
            .select('id', 'merchant_id', 'customer_id', 'order_code');

        const allExpiredOrders = [
            ...expiredPendingAcceptOrders.map(o => ({ ...o, fromState: ORDER_STATES.PENDING_ACCEPT })),
            ...expiredPendingPaymentOrders.map(o => ({ ...o, fromState: ORDER_STATES.PENDING_PAYMENT }))
        ];

        if (allExpiredOrders.length === 0) {
            return 0;
        }

        console.log(`[Order Timeout] Found ${allExpiredOrders.length} timed out orders.`);

        // อัปเดตสถานะและกระจายแจ้งเตือน Real-time
        for (const order of allExpiredOrders) {
            await knex('ORDERS')
                .where('id', order.id)
                .update({
                    status: ORDER_STATES.CANCELLED_BY_TIMEOUT
                });

            if (io) {
                // แจ้งเตือนห้องออเดอร์
                io.to(`order_${order.id}`).emit('ORDER_STATUS_UPDATED', {
                    order_id: order.id,
                    order_code: order.order_code,
                    status: ORDER_STATES.CANCELLED_BY_TIMEOUT,
                    reason: order.fromState === ORDER_STATES.PENDING_ACCEPT 
                        ? 'Store did not accept order within 10 minutes.' 
                        : 'Payment was not completed within 15 minutes.',
                    updated_at: new Date()
                });

                // แจ้งเตือนร้านค้า
                io.to(`merchant_${order.merchant_id}`).emit('ORDER_STATUS_UPDATED', {
                    order_id: order.id,
                    order_code: order.order_code,
                    status: ORDER_STATES.CANCELLED_BY_TIMEOUT
                });
            }
        }

        return allExpiredOrders.length;

    } catch (error) {
        console.error('[Order Timeout] Error checking timed out orders:', error);
        return 0;
    }
};

module.exports = {
    checkAndCancelTimedOutOrders,
    PENDING_ACCEPT_TIMEOUT_MINUTES,
    PENDING_PAYMENT_TIMEOUT_MINUTES
};
