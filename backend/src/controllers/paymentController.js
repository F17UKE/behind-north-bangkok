// backend/src/controllers/paymentController.js
const generatePayload = require('promptpay-qr'); 
const qrcode = require('qrcode');
const paymentRepository = require('../repositories/paymentRepository');
const storageService = require('../services/storageService');
const db = require('../db');

// 1. สร้าง PromptPay QR Code
const generatePromptPayQR = async (req, res) => {
    const { order_id } = req.params;

    try {
        if (req.user.role !== 'CUSTOMER') return res.status(403).json({ error: 'Only the customer can access this payment' });
        const owner = await paymentRepository.getOrderOwner(order_id);
        if (!owner) return res.status(404).json({ error: 'Order not found' });
        if (Number(owner.customer_id) !== Number(req.user.id)) return res.status(403).json({ error: 'You do not own this order' });
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
            amount: amount,
            promptpay_id: promptpayId
        });

    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 2. อัปโหลดรูปสลิปและรับชำระเงินในโหมดทดลอง (ไม่ตรวจสอบความแท้/ยอดเงิน)
const uploadAndVerifySlip = async (req, res) => {
    const { order_id } = req.params;
    let finalImageUrl;

    try {
        if (req.user.role !== 'CUSTOMER') return res.status(403).json({ error: 'Only the customer can submit a payment slip' });
        const owner = await paymentRepository.getOrderOwner(order_id);
        if (!owner) return res.status(404).json({ error: 'Order not found' });
        if (Number(owner.customer_id) !== Number(req.user.id)) return res.status(403).json({ error: 'You do not own this order' });
        if (!req.file) {
            return res.status(400).json({ error: 'กรุณาแนบรูปสลิปก่อนส่ง' });
        }

        const uploadResult = await storageService.uploadImage(req.file, 'slips');
        finalImageUrl = uploadResult.publicUrl;

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

            // โหมดทดลอง: ถือว่าผ่านเมื่ออัปโหลดรูปสำเร็จ ไม่ตรวจความแท้หรือยอดเงิน
            await paymentRepository.saveSlip(order_id, finalImageUrl, null, trx);

            // 4. เปลี่ยนสถานะออเดอร์เป็น PAID
            await paymentRepository.updateOrderStatus(order_id, 'PAID', trx);

            // ยืนยันการเปลี่ยนแปลงข้อมูล
            await trx.commit();

            // 5. ส่งสัญญาณ Socket.io แจ้งเตือนร้านค้าและลูกค้าว่าชำระเงินเรียบร้อยแล้ว
            const io = req.app.get('io');
            if (io) {
                const statusUpdate = {
                    order_id: Number(order_id),
                    status: 'PAID',
                    updated_by: 'CUSTOMER',
                    updated_at: new Date()
                };
                io.to(`order_${order_id}`).emit('ORDER_STATUS_UPDATED', statusUpdate);
                io.to(`merchant_${owner.merchant_id}`).emit('ORDER_STATUS_UPDATED', statusUpdate);
            }
            
            return res.status(200).json({ 
                success: true,
                message: 'รับรูปสลิปแล้ว (โหมดทดลอง)',
                status: 'PAID',
                imageUrl: finalImageUrl,
                refNumber: null
            });

        } catch (innerError) {
            await trx.rollback();
            throw innerError;
        }

    } catch (error) {
        console.error('Error verifying slip:', error);
        return res.status(500).json({ error: 'Internal server error during verification' });
    }
};

module.exports = {
    generatePromptPayQR,
    uploadAndVerifySlip
};
