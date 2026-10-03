// backend/src/controllers/orderController.js
const orderRepo = require('../repositories/orderRepository');
const { ORDER_STATES, canTransition } = require('../utils/stateMachine');

const createOrder = async (req, res) => {
    try {
        // req.user ได้มาจาก verifyToken middleware
        const orderData = { ...req.body, customerId: req.user.id };
        const newOrder = await orderRepo.createOrder(orderData);
        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const changeOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status: nextState, rider_id } = req.body;
        const userRole = req.user.role; // สมมติว่า middleware แปะ role มาให้ (customer, merchant, rider)

        const order = await orderRepo.getOrderById(order_id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // 1. State Machine Validation[cite: 6]
        if (!canTransition(order.status, nextState)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid state transition from \({order.status} to\){nextState}` 
            });
        }

        // 2. Role-Based Access Control (RBAC) Validation
        // แก้ไข string เป็นตัวพิมพ์ใหญ่ให้ตรงกับ jwt.js
        if (nextState === ORDER_STATES.CANCELLED_BY_CUSTOMER && userRole !== 'CUSTOMER') {
            return res.status(403).json({ success: false, message: 'Only customer can cancel' });
        }
        if (nextState === ORDER_STATES.PENDING_PAYMENT && userRole !== 'MERCHANT') {
            return res.status(403).json({ success: false, message: 'Only merchant can accept order' });
        }
        if (nextState === ORDER_STATES.IN_DELIVERY && userRole !== 'RIDER' && userRole !== 'MERCHANT') {
            return res.status(403).json({ success: false, message: 'Only rider or merchant can start delivery' });
        }

        // 3. Update Status
        const updatedOrder = await orderRepo.updateOrderStatus(order_id, nextState, rider_id);
        
        // ตรงนี้สามารถเพิ่มโค้ดเพื่อส่ง Socket.io แจ้งเตือนไปยัง Client ได้
        
        res.status(200).json({ success: true, data: updatedOrder });

    } catch (error) {
        console.error('Change Status Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    createOrder,
    changeOrderStatus
};