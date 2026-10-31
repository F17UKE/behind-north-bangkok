const db = require('../db');

class RiderManagementRepository {
  // 1. สร้างบัญชีคนส่งอาหารประจำร้าน
  async createRider(riderData) {
    return await db('MERCHANT_RIDERS')
      .insert(riderData)
      .returning(['id', 'username', 'full_name', 'phone', 'is_active', 'merchant_id']);
  }

  // 2. ดึงรายชื่อคนส่งอาหารทั้งหมดของร้านค้านั้น
  async getRidersByMerchant(merchantId) {
    return await db('MERCHANT_RIDERS')
      .select('id', 'username', 'full_name', 'phone', 'is_active')
      .where('merchant_id', merchantId)
      .orderBy('id', 'desc');
  }

  // 3. เปิด/ระงับการทำงานของคนส่งอาหาร
  async updateRiderStatus(merchantId, riderId, isActive) {
    return await db('MERCHANT_RIDERS')
      .where({ id: riderId, merchant_id: merchantId }) // บังคับให้แก้ได้เฉพาะคนของร้านตัวเอง
      .update({ is_active: isActive })
      .returning(['id', 'username', 'is_active']);
  }

  // ฟังก์ชันช่วยเหลือสำหรับตรวจสอบว่า username ซ้ำหรือไม่
  async checkUsernameExists(username) {
    const user = await db('MERCHANT_RIDERS').where('username', username).first();
    return !!user;
  }
}

module.exports = new RiderManagementRepository();