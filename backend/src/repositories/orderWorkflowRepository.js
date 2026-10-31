const db = require('../db');

class OrderWorkflowRepository {
  // ดึงรายละเอียดออเดอร์แบบเต็ม (Order + Items + Choices)
  async getOrderById(orderId) {
    const order = await db('ORDERS').where('id', orderId).first();
    if (!order) return null;

    const items = await db('ORDER_ITEMS').where('order_id', orderId);
    
    // ดึง Choices ของแต่ละ Item
    for (let item of items) {
      item.choices = await db('ORDER_ITEM_CHOICES').where('order_item_id', item.id);
    }
    order.items = items;
    return order;
  }

  // ดึงประวัติคำสั่งซื้อของลูกค้า
  async getOrdersByCustomerId(customerId) {
    return await db('ORDERS')
      .where('customer_id', customerId)
      .orderBy('created_at', 'desc');
  }

  // ดึงรายการคำสั่งซื้อของร้านค้า (Merchant Dashboard)
  async getOrdersByMerchantId(merchantId) {
    return await db('ORDERS')
      .where('merchant_id', merchantId)
      .orderBy('created_at', 'desc');
  }

  // อัปเดตสถานะคำสั่งซื้อ
  async updateOrderStatus(orderId, status) {
    return await db('ORDERS')
      .where('id', orderId)
      .update({ status })
      .returning(['id', 'status']);
  }

  // มอบหมาย Rider ให้กับออเดอร์
  async assignRider(orderId, rider_id) {
    return await db('ORDERS')
      .where('id', orderId)
      .update({ rider_id })
      .returning(['id', 'rider_id', 'status']);
  }
}

module.exports = new OrderWorkflowRepository();