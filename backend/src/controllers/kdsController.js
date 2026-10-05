// backend/src/controllers/kdsController.js
const KDSRepository = require('../repositories/kdsRepository');
const knex = require('../db');
// สมมติว่าคุณมี StateMachine Utility อยู่ที่ src/utils/stateMachine.js ตามโครงสร้าง[cite: 5]
const stateMachine = require('../utils/stateMachine'); 

// 1. ดึงออเดอร์ในครัวพร้อมรายละเอียดอาหาร
const getKitchenOrders = async (req, res) => {
    try {
        const merchantId = req.user.id; // ดึงมาจาก Token middleware

        const orders = await KDSRepository.getPreparingOrders(merchantId);
        
        // แนบ Items เข้าไปในแต่ละ Order
        for (let order of orders) {
            order.items = await KDSRepository.getOrderItemsWithChoices(order.id);
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('KDS Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch kitchen orders' });
    }
};

// 2. ติ๊กอาหารเสร็จ 1 จาน (Item-level logic)
const completeSingleItem = async (req, res) => {
    const { orderId, itemId } = req.params;
    const merchantId = req.user.id;

    const trx = await knex.transaction();
    try {
        // ตรวจสอบสิทธิ์และสถานะออเดอร์
        const order = await KDSRepository.getOrderById(orderId, trx);
        
        if (!order || order.merchant_id !== merchantId) {
            await trx.rollback();
            return res.status(403).json({ error: 'Unauthorized to modify this order' });
        }
        
        // บังคับใช้ State Machine (ต้องเป็น PREPARING เท่านั้น)
        if (order.status !== 'PREPARING') {
            await trx.rollback();
            return res.status(400).json({ error: `Cannot complete item in status: ${order.status}` });
        }

        // อัปเดตจานนั้น
        await KDSRepository.markItemAsCompleted(orderId, itemId, trx);

        // KDS Logic: เช็คว่าครบทุกจานหรือยัง
        const uncompletedCount = await KDSRepository.countUncompletedItems(orderId, trx);
        let statusChanged = false;

        if (uncompletedCount === 0) {
            // ปรับสถานะเป็น READY_FOR_DELIVERY อัตโนมัติ[cite: 6]
            // หากคุณมี validateStateTransition ใน util ให้ใช้ก่อน
            await KDSRepository.updateOrderStatus(orderId, 'READY_FOR_DELIVERY', trx);
            statusChanged = true;
        }

        await trx.commit();
        
        // TODO: ยิง Socket.io อัปเดตสถานะไปที่ลูกค้า (และหน้า Rider) หาก statusChanged === true
        
        res.status(200).json({ 
            message: 'Item marked as completed',
            isOrderReady: statusChanged
        });

    } catch (error) {
        await trx.rollback();
        console.error('KDS Complete Item Error:', error);
        res.status(500).json({ error: 'Failed to update item status' });
    }
};

// 3. กด "เสร็จสิ้นทั้งหมด" ทีเดียวทั้งบิล (Order-level logic)
const completeEntireOrder = async (req, res) => {
    const { orderId } = req.params;
    const merchantId = req.user.id;

    const trx = await knex.transaction();
    try {
        const order = await KDSRepository.getOrderById(orderId, trx);
        
        if (!order || order.merchant_id !== merchantId) {
            await trx.rollback();
            return res.status(403).json({ error: 'Unauthorized to modify this order' });
        }

        if (order.status !== 'PREPARING') {
            await trx.rollback();
            return res.status(400).json({ error: `Cannot complete order in status: ${order.status}` });
        }

        // อัปเดตทุกจานเป็น true ทันที[cite: 6]
        await KDSRepository.markAllItemsAsCompleted(orderId, trx);
        
        // เปลี่ยนสถานะเป็น READY_FOR_DELIVERY
        await KDSRepository.updateOrderStatus(orderId, 'READY_FOR_DELIVERY', trx);

        await trx.commit();

        // TODO: ยิง Socket.io อัปเดตสถานะไปที่ลูกค้า

        res.status(200).json({ message: 'Entire order marked as ready for delivery' });

    } catch (error) {
        await trx.rollback();
        console.error('KDS Complete Order Error:', error);
        res.status(500).json({ error: 'Failed to complete entire order' });
    }
};

module.exports = {
    getKitchenOrders,
    completeSingleItem,
    completeEntireOrder
};