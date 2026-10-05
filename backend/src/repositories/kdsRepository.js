// backend/src/repositories/kdsRepository.js
const knex = require('../db');

class KDSRepository {
    // 1. ดึงรายการออเดอร์ที่อยู่ในครัว (เฉพาะของร้านค้านั้น)
    static async getPreparingOrders(merchantId) {
        return await knex('ORDERS')
            .select(
                'ORDERS.id', 'ORDERS.order_code', 'ORDERS.status', 'ORDERS.created_at',
                'ORDERS.delivery_room_number', 'CUSTOMERS.username as customer_name'
            )
            .join('CUSTOMERS', 'ORDERS.customer_id', 'CUSTOMERS.id')
            .where({
                'ORDERS.merchant_id': merchantId,
                'ORDERS.status': 'PREPARING'
            })
            .orderBy('ORDERS.created_at', 'asc');
    }

    // ดึงรายการอาหาร (items) ของแต่ละ Order พร้อมตัวเลือกเสริม (choices)
    static async getOrderItemsWithChoices(orderId) {
        const items = await knex('ORDER_ITEMS')
            .select(
                'ORDER_ITEMS.id', 'ORDER_ITEMS.quantity', 'ORDER_ITEMS.note', 
                'ORDER_ITEMS.is_completed', 'MENU_ITEMS.name as menu_name'
            )
            .join('MENU_ITEMS', 'ORDER_ITEMS.menu_item_id', 'MENU_ITEMS.id')
            .where('ORDER_ITEMS.order_id', orderId);

        // ดึง choices สำหรับแต่ละ item (ลดการ Query ซ้ำซ้อนด้วย WHERE IN)
        const itemIds = items.map(item => item.id);
        const allChoices = itemIds.length > 0 
            ? await knex('ORDER_ITEM_CHOICES')
                .select('order_item_id', 'choice_name')
                .whereIn('order_item_id', itemIds)
            : [];

        // แมป choices เข้ากับ items
        return items.map(item => {
            return {
                ...item,
                choices: allChoices
                    .filter(c => c.order_item_id === item.id)
                    .map(c => c.choice_name)
            };
        });
    }

    // 2. อัปเดตสถานะอาหาร 1 จาน
    static async markItemAsCompleted(orderId, itemId, trx = knex) {
        return await trx('ORDER_ITEMS')
            .where({ id: itemId, order_id: orderId })
            .update({ is_completed: true });
    }

    // นับจำนวนจานที่ยังไม่เสร็จใน Order
    static async countUncompletedItems(orderId, trx = knex) {
        const result = await trx('ORDER_ITEMS')
            .where({ order_id: orderId, is_completed: false })
            .count('id as count')
            .first();
        return parseInt(result.count);
    }

    // 3. อัปเดตทุกจานใน Order ให้เสร็จ (สำหรับการกด "เสร็จสิ้นทั้งหมด")
    static async markAllItemsAsCompleted(orderId, trx = knex) {
        return await trx('ORDER_ITEMS')
            .where({ order_id: orderId })
            .update({ is_completed: true });
    }
    
    // อัปเดตสถานะของ Order (สำหรับเรียกใช้ร่วมกับ State Machine)
    static async updateOrderStatus(orderId, newStatus, trx = knex) {
        return await trx('ORDERS')
            .where({ id: orderId })
            .update({ status: newStatus });
    }
    
    static async getOrderById(orderId, trx = knex) {
         return await trx('ORDERS').where({ id: orderId }).first();
    }
}

module.exports = KDSRepository;