// backend/src/utils/slipVerification.js
const paymentRepository = require('../repositories/paymentRepository');

/**
 * จำลองการตรวจสอบสลิปผ่าน 3rd Party API (เช่น SlipOK)
 * ในระบบจริง คุณจะต้องใช้ axios หรือ fetch เพื่อส่งรูปไปยัง API ของผู้ให้บริการ
 */
const verifySlip = async (imageUrl, expectedAmount, promptpayId, trx) => {
    try {
        // --- ส่วนนี้คือการ Mock API ฝั่ง 3rd Party (สมมติว่า API ตอบกลับมา) ---
        // ในความจริง คุณต้องดึงข้อมูลนี้มาจาก response ของ Slip API
        const mockApiResponse = {
            success: true,
            data: {
                ref_number: 'REF' + Date.now(), // รหัสอ้างอิงจากธนาคาร
                amount: expectedAmount, // จำลองว่ายอดเงินตรง
                receiver: {
                    promptpay: promptpayId // จำลองว่าบัญชีผู้รับตรง
                }
            }
        };

        if (!mockApiResponse.success) {
            return { isValid: false, message: 'อ่านสลิปไม่สำเร็จ กรุณาถ่ายให้ชัดเจน' };
        }

        const slipData = mockApiResponse.data;

        // 1. ตรวจสอบยอดเงิน
        if (parseFloat(slipData.amount) !== parseFloat(expectedAmount)) {
            return { isValid: false, message: 'ยอดเงินไม่ตรงกับคำสั่งซื้อ' };
        }

        // 2. ตรวจสอบบัญชีผู้รับ (ต้องตรงกับร้านค้า)
        if (slipData.receiver.promptpay !== promptpayId) {
            return { isValid: false, message: 'โอนเงินผิดบัญชี' };
        }

        // 3. ตรวจสอบว่าสลิปนี้เคยถูกใช้หรือยัง (ป้องกันการเวียนใช้สลิปซ้ำ)
        const isRefExists = await paymentRepository.checkRefNumberExists(slipData.ref_number, trx);
        if (isRefExists) {
            return { isValid: false, message: 'สลิปนี้ถูกใช้งานไปแล้ว' };
        }

        // หากผ่านทุกเงื่อนไข คืนค่า ref_number ไปให้ controller บันทึก
        return { isValid: true, refNumber: slipData.ref_number };

    } catch (error) {
        console.error('Slip Verification Error:', error);
        return { isValid: false, message: 'ระบบตรวจสอบสลิปมีปัญหา' };
    }
};

module.exports = {
    verifySlip
};