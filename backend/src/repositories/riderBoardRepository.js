const db = require('../db');

class RiderBoardRepository {
  // ดึงคิวงานของ Rider คนนั้นๆ (งานที่ต้องส่ง + ประวัติจัดส่งสำเร็จในวันนั้น)
  async getRiderOrders(riderId) {
    return await db('ORDERS')
      .join('MERCHANTS', 'ORDERS.merchant_id', 'MERCHANTS.id')
      .leftJoin('DORMITORIES', 'ORDERS.delivery_dormitory_id', 'DORMITORIES.id')
      .join('CUSTOMERS', 'ORDERS.customer_id', 'CUSTOMERS.id')
      .select(
        'ORDERS.id', 
        'ORDERS.order_code', 
        'ORDERS.status', 
        'ORDERS.delivery_fee', 
        'ORDERS.delivery_room_number', 
        'ORDERS.created_at',
        'ORDERS.updated_at',
        'MERCHANTS.store_name', 
        'MERCHANTS.location as merchant_location',
        'DORMITORIES.name as dormitory_name', 
        'DORMITORIES.location as dormitory_location',
        'CUSTOMERS.phone as customer_phone', 
        'CUSTOMERS.username as customer_name'
      )
      .where('ORDERS.rider_id', riderId)
      .where(function() {
        this.whereIn('ORDERS.status', ['READY_FOR_DELIVERY', 'IN_DELIVERY'])
          .orWhere(function() {
            // กรองเฉพาะออเดอร์ที่จัดส่งแล้วในวันนั้น (วันนี้)
            this.where('ORDERS.status', 'COMPLETED')
              .andWhereRaw('(DATE("ORDERS"."updated_at") = CURRENT_DATE OR ("ORDERS"."updated_at" IS NULL AND DATE("ORDERS"."created_at") = CURRENT_DATE))');
          });
      })
      .orderBy('ORDERS.created_at', 'asc'); // ดึงงานเก่าสุดขึ้นก่อน (FIFO)
  }

  // ดึงออเดอร์เดี่ยวเพื่อตรวจสอบสิทธิ์ก่อนเปลี่ยนสถานะ
  async getOrderByIdAndRider(orderId, riderId) {
    return await db('ORDERS')
      .where({ id: orderId, rider_id: riderId })
      .first();
  }

  // อัปเดตสถานะออเดอร์
  async updateOrderStatus(orderId, status) {
    return await db('ORDERS')
      .where('id', orderId)
      .update({ status, updated_at: db.fn.now() })
      .returning(['id', 'status']);
  }
}

module.exports = new RiderBoardRepository();