// backend/src/controllers/paymentController.js
const generatePayload = require('promptpay-qr'); 
const qrcode = require('qrcode');
const paymentRepository = require('../repositories/paymentRepository');
const slipVerification = require('../utils/slipVerification');
const db = require('../db');

// 1. สร้าง PromptPay QR Code
const generatePromptPayQR = async (req, res) => {
    const { order_id } = req.params;

    try {
        const orderInfo = await paymentRepository.getOrderPaymentInfo(order_id);

        if (!orderInfo) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // ต้องอยู่ในสถานะ PENDING_PAYMENT เท่านั้น ถึงจะสร้าง QR ได้
        if (orderInfo.status !== 'PENDING_PAYMENT') {
            return res.status(400).json({ error: 'Order is not in pending payment state' });
        }

        const amount = parseFloat(orderInfo.total_amount);
        const promptpayId = orderInfo.promptpay_id; // ดึงมาจาก MERCHANTS

        if (!promptpayId) {
             return res.status(400).json({ error: 'Merchant has no PromptPay ID' });
        }

        // สร้าง Payload
        const payload = generatePayload(promptpayId, { amount });
        
        // สร้าง QR Code เป็น Base64 Image (เพื่อให้ Frontend นำไปแสดงผลได้เลย)
        const qrSvg = await new Promise((resolve, reject) => {
            qrcode.toDataURL(payload, (err, url) => {
                if (err) reject(err);
                else resolve(url);
            });
        });

        res.status(200).json({
            message: 'QR Code generated',
            qr_image_base64: qrSvg,
            amount: amount
        });

    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 2. อัปโหลดและตรวจสอบสลิป
const uploadAndVerifySlip = async (req, res) => {
    const { order_id } = req.params;
    const { image_url } = req.body; // ในระบบจริงคุณอาจใช้ Multer รับไฟล์ แล้วอัปขึ้น S3 ก่อนนำ URL มาใส่ตรงนี้

    if (!image_url) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    // เปิด Transaction เพราะมีการ Insert (สลิป) และ Update (สถานะออเดอร์) พร้อมกัน
    const trx = await db.transaction();

    try {
        // 1. ดึงข้อมูลออเดอร์
        const orderInfo = await paymentRepository.getOrderPaymentInfo(order_id, trx);
        if (!orderInfo) {
            await trx.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        if (orderInfo.status !== 'PENDING_PAYMENT') {
            await trx.rollback();
            return res.status(400).json({ error: 'Payment already processed or order cancelled' });
        }

        // 2. ส่งรูปสลิปไปตรวจสอบ (ยอดเงิน และ promptpay)
        const verificationResult = await slipVerification.verifySlip(
            image_url, 
            orderInfo.total_amount, 
            orderInfo.promptpay_id,
            trx
        );

        if (!verificationResult.isValid) {
            await trx.rollback();
            return res.status(400).json({ error: verificationResult.message });
        }

        // 3. ถ้าสลิปถูกต้อง บันทึกข้อมูลลงตาราง PAYMENT_SLIPS
        await paymentRepository.saveSlip(order_id, image_url, verificationResult.refNumber, trx);

        // 4. เปลี่ยนสถานะออเดอร์เป็น PAID
        await paymentRepository.updateOrderStatus(order_id, 'PAID', trx);

        // ยืนยันการเปลี่ยนแปลงข้อมูล
        await trx.commit();

        // ตรงนี้สามารถยิง Socket.io ไปหาห้องครัวให้เริ่มทำอาหารได้เลย (สถานะ PREPARING ตาม Flow จริงๆ)
        
        res.status(200).json({ 
            message: 'Payment verified successfully',
            status: 'PAID'
        });

    } catch (error) {
        await trx.rollback();
        console.error('Error verifying slip:', error);
        res.status(500).json({ error: 'Internal server error during verification' });
    }
};

module.exports = {
    generatePromptPayQR,
    uploadAndVerifySlip
};