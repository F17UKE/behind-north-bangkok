const db = require('../db');

class OrderWorkflowRepository {
  // Helper สำหรับดึงและแนบรายการอาหารพร้อมตัวเลือกเสริม
  async _attachItemsToOrders(orders) {
    if (!orders || orders.length === 0) return orders;

    const orderIds = orders.map(o => o.id);
    const allItems = await db('ORDER_ITEMS')
      .leftJoin('MENU_ITEMS', 'ORDER_ITEMS.menu_item_id', 'MENU_ITEMS.id')
      .select(
        'ORDER_ITEMS.id',
        'ORDER_ITEMS.order_id',
        'ORDER_ITEMS.quantity',
        'ORDER_ITEMS.unit_price',
        'ORDER_ITEMS.note',
        'ORDER_ITEMS.is_completed',
        'ORDER_ITEMS.menu_item_id',
        'MENU_ITEMS.name',
        'MENU_ITEMS.image_url'
      )
      .whereIn('ORDER_ITEMS.order_id', orderIds);

    const itemIds = allItems.map(it => it.id);
    const allChoices = itemIds.length > 0
      ? await db('ORDER_ITEM_CHOICES')
          .select('id', 'order_item_id', 'choice_name', 'extra_price')
          .whereIn('order_item_id', itemIds)
      : [];

    const itemsByOrderId = {};
    for (const item of allItems) {
      const choices = allChoices
        .filter(c => c.order_item_id === item.id)
        .map(c => c.choice_name);
      
      const itemWithChoices = {
        ...item,
        choices
      };

      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(itemWithChoices);
    }

    for (const order of orders) {
      order.items = itemsByOrderId[order.id] || [];
      // สร้างคำบรรยายรายการอาหารแบบย่อ เช่น "ข้าวกะเพราหมูสับ x1, ไข่ดาว x1"
      order.items_summary = order.items.map(it => {
        const choiceStr = it.choices && it.choices.length > 0 ? ` (${it.choices.join(', ')})` : '';
        return `${it.name || 'อาหาร'}${choiceStr} x${it.quantity || 1}`;
      });
    }

    return orders;
  }

  // ดึงรายละเอียดออเดอร์แบบเต็ม (Order + Items + Choices + Customer + Store + Dorm)
  async getOrderById(orderId) {
    const orders = await db('ORDERS')
      .leftJoin('CUSTOMERS', 'ORDERS.customer_id', 'CUSTOMERS.id')
      .leftJoin('MERCHANTS', 'ORDERS.merchant_id', 'MERCHANTS.id')
      .leftJoin('DORMITORIES', 'ORDERS.delivery_dormitory_id', 'DORMITORIES.id')
      .leftJoin('SOIS', 'DORMITORIES.soi_id', 'SOIS.id')
      .leftJoin('MERCHANT_RIDERS', 'ORDERS.rider_id', 'MERCHANT_RIDERS.id')
      .select(
        'ORDERS.*',
        'CUSTOMERS.username as customer_name',
        'CUSTOMERS.phone as customer_phone',
        'MERCHANTS.store_name',
        'MERCHANTS.prefix as store_prefix',
        'MERCHANTS.promptpay_id',
        'DORMITORIES.name as dormitory_name',
        'SOIS.name as soi_name',
        'MERCHANT_RIDERS.full_name as rider_name',
        'MERCHANT_RIDERS.phone as rider_phone'
      )
      .where('ORDERS.id', orderId);

    if (!orders || orders.length === 0) return null;

    const enriched = await this._attachItemsToOrders(orders);
    return enriched[0];
  }

  // ดึงประวัติคำสั่งซื้อของลูกค้า
  async getOrdersByCustomerId(customerId) {
    const orders = await db('ORDERS')
      .leftJoin('MERCHANTS', 'ORDERS.merchant_id', 'MERCHANTS.id')
      .leftJoin('DORMITORIES', 'ORDERS.delivery_dormitory_id', 'DORMITORIES.id')
      .leftJoin('SOIS', 'DORMITORIES.soi_id', 'SOIS.id')
      .leftJoin('MERCHANT_RIDERS', 'ORDERS.rider_id', 'MERCHANT_RIDERS.id')
      .select(
        'ORDERS.*',
        'MERCHANTS.store_name',
        'MERCHANTS.store_image_url',
        'DORMITORIES.name as dormitory_name',
        'SOIS.name as soi_name',
        'MERCHANT_RIDERS.full_name as rider_name',
        'MERCHANT_RIDERS.phone as rider_phone'
      )
      .where('ORDERS.customer_id', customerId)
      .orderBy('ORDERS.created_at', 'desc');

    return await this._attachItemsToOrders(orders);
  }

  // ดึงรายการคำสั่งซื้อของร้านค้า (Merchant Dashboard)
  async getOrdersByMerchantId(merchantId) {
    const orders = await db('ORDERS')
      .leftJoin('CUSTOMERS', 'ORDERS.customer_id', 'CUSTOMERS.id')
      .leftJoin('DORMITORIES', 'ORDERS.delivery_dormitory_id', 'DORMITORIES.id')
      .leftJoin('SOIS', 'DORMITORIES.soi_id', 'SOIS.id')
      .leftJoin('MERCHANT_RIDERS', 'ORDERS.rider_id', 'MERCHANT_RIDERS.id')
      .select(
        'ORDERS.*',
        'CUSTOMERS.username as customer_name',
        'CUSTOMERS.phone as customer_phone',
        'DORMITORIES.name as dormitory_name',
        'SOIS.name as soi_name',
        'MERCHANT_RIDERS.full_name as rider_name',
        'MERCHANT_RIDERS.phone as rider_phone'
      )
      .where('ORDERS.merchant_id', merchantId)
      .orderBy('ORDERS.created_at', 'desc');

    return await this._attachItemsToOrders(orders);
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
