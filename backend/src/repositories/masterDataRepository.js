const db = require('../db');

class MasterDataRepository {
  // 1. ดึงรายชื่อซอยทั้งหมด
  async getAllSois() {
    return await db('SOIS').orderBy('id', 'asc');
  }

  // 2. ดึงรายชื่อหอพัก (รองรับการ Filter ตาม soi_id)
  async getDormitories(soiId) {
    let query = db('DORMITORIES').select('id', 'name', 'location', 'soi_id');
    
    if (soiId) {
      query = query.where('soi_id', soiId);
    }
    
    return await query.orderBy('name', 'asc');
  }

  // 3. คำนวณค่าส่งตามหอพักและร้านค้า
  async getDeliveryFeeByDormitory(merchantId, dormitoryId) {
    // หา soi_id ของหอพักปลายทาง
    const dorm = await db('DORMITORIES').where('id', dormitoryId).first();
    if (!dorm) return null; // ไม่พบหอพักนี้

    // ตรวจสอบเรทค่าส่งของร้านค้านี้ ในซอยที่หอพักตั้งอยู่
    const feeRecord = await db('DELIVERY_FEES')
      .where({ merchant_id: merchantId, soi_id: dorm.soi_id })
      .first();

    // หากร้านไม่ได้ตั้งค่าส่งซอยนี้ไว้ อาจจะตั้งค่า Default เป็นส่งฟรี (0) หรือราคามาตรฐาน
    return feeRecord ? feeRecord.fee : 0.00; 
  }
}

module.exports = new MasterDataRepository();