// backend/src/utils/slipVerification.js
const paymentRepository = require('../repositories/paymentRepository');

/**
 * จำลองการตรวจสอบสลิปแบบ Mock (ส่งรูปอะไรมาก็อนุมัติผ่าน 100%)
 * ตามความต้องการสำหรับ Phase 1 ในการทดสอบระบบ
 */
const verifySlip = async (imageUrl, expectedAmount, promptpayId, trx) => {
    try {
        if (!imageUrl) {
            return { isValid: false, message: 'กรุณาระบุ URL รูปภาพสลิป' };
        }

        // สร้าง Ref Number แบบจำลองที่ไม่ซ้ำกัน
        const mockRefNumber = 'MOCK-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

        // ตรวจสอบความซ้ำซ้อนในระบบเพื่อความสมบูรณ์ของฐานข้อมูล
        const isRefExists = await paymentRepository.checkRefNumberExists(mockRefNumber, trx);
        if (isRefExists) {
            const fallbackRef = 'MOCK-' + Date.now() + '-' + Math.floor(10000 + Math.random() * 90000);
            return { isValid: true, refNumber: fallbackRef };
        }

        // คืนค่าผ่านเสมอ พร้อมรหัสธุรกรรมจำลอง
        return { 
            isValid: true, 
            refNumber: mockRefNumber,
            message: 'Slip verified successfully (Mock Mode)'
        };

    } catch (error) {
        console.error('Slip Verification Mock Error:', error);
        return { isValid: false, message: 'ระบบตรวจสอบสลิปขัดข้อง' };
    }
};

module.exports = {
    verifySlip
};
