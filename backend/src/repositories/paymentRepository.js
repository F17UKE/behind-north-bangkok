// backend/src/repositories/paymentRepository.js
const db = require('../db');

// ดึงข้อมูลออเดอร์และ promptpay_id ของร้านค้า เพื่อเตรียมสร้าง QR หรือตรวจยอด
const getOrderPaymentInfo = async (orderId, trx = db) => {
    return trx('ORDERS')
        .join('MERCHANTS', 'ORDERS.merchant_id', '=', 'MERCHANTS.id')
        .select(
            'ORDERS.id as order_id',
            'ORDERS.total_amount',
            'ORDERS.status',
            'MERCHANTS.promptpay_id'
        )
        .where('ORDERS.id', orderId)
        .first();
};

// ตรวจสอบว่ามี ref_number นี้ในระบบหรือยัง
const checkRefNumberExists = async (refNumber, trx = db) => {
    const result = await trx('PAYMENT_SLIPS')
        .where('ref_number', refNumber)
        .first();
    return !!result;
};

// บันทึกสลิปลงตาราง PAYMENT_SLIPS
const saveSlip = async (orderId, imageUrl, refNumber, trx = db) => {
    return trx('PAYMENT_SLIPS').insert({
        order_id: orderId,
        image_url: imageUrl,
        ref_number: refNumber,
        is_verified: true, // หากบันทึกแปลว่าผ่านการตรวจแล้ว
        created_at: new Date()
    });
};

// เปลี่ยนสถานะออเดอร์
const updateOrderStatus = async (orderId, status, trx = db) => {
    return trx('ORDERS')
        .where('id', orderId)
        .update({ status: status });
};

// ลบสลิปที่อายุเกินกำหนด (Data Purging Policy: ค่าเริ่มต้น 7 วัน เพื่อประหยัดพื้นที่จัดเก็บ)
const purgeOldPaymentSlips = async (days = 7) => {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return await db('PAYMENT_SLIPS')
        .where('created_at', '<', cutoffDate)
        .del();
};

module.exports = {
    getOrderPaymentInfo,
    checkRefNumberExists,
    saveSlip,
    updateOrderStatus,
    purgeOldPaymentSlips
};
