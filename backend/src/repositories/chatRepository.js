const knex = require('../db');

class ChatRepository {
  // ดึงประวัติข้อความของออเดอร์นั้นๆ[cite: 6, 7]
  async getMessagesByOrderId(orderId) {
    return await knex('MESSAGES')
      .where('order_id', orderId)
      .orderBy('created_at', 'asc');
  }

  // บันทึกข้อความใหม่ หรือ บันทึกประวัติการโทร[cite: 6, 7]
  async saveMessage({ isMerchantSender, senderSubRole, messageType, contentText, callDurationSeconds, orderId }) {
    const [newMessage] = await knex('MESSAGES').insert({
      is_merchant_sender: isMerchantSender,
      sender_sub_role: senderSubRole, // 'STORE' หรือ 'RIDER'
      message_type: messageType,      // 'TEXT', 'CALL_STARTED', 'CALL_ENDED', 'CALL_MISSED'
      content_text: contentText,
      call_duration_seconds: callDurationSeconds || 0, //[cite: 6, 7]
      order_id: orderId,
      created_at: new Date()
    }).returning('*');
    return newMessage;
  }

  // อัปเดต Watermark (ข้อความล่าสุดที่อ่านแล้ว)[cite: 6, 7]
  async updateReadWatermark(orderId, role, messageId) {
    const updateField = role === 'CUSTOMER' 
      ? 'customer_last_read_message_id' 
      : 'merchant_last_read_message_id'; //[cite: 6, 7]
      
    await knex('ORDERS')
      .where('id', orderId)
      .update({ [updateField]: messageId });
  }

  // สำหรับลบข้อความที่อายุเกิน 24 ชั่วโมง (Data Purging Policy)[cite: 6]
  async purgeOldMessages() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await knex('MESSAGES')
      .where('created_at', '<', twentyFourHoursAgo)
      .del();
  }
}

module.exports = new ChatRepository();