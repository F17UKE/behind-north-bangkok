// backend/src/controllers/paymentController.js
const generatePayload = require('promptpay-qr'); 
const qrcode = require('qrcode');
const paymentRepository = require('../repositories/paymentRepository');
const slipVerification = require('../utils/slipVerification');
const storageService = require('../services/storageService');
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
    let finalImageUrl = req.body?.image_url;

    try {
        // รองรับทั้งการอัปโหลดไฟล์ตรงๆ (req.file) หรือส่ง image_url ที่อัปโหลดไว้แล้วมา
        if (req.file) {
            const uploadResult = await storageService.uploadImage(req.file, 'slips');
            finalImageUrl = uploadResult.publicUrl;
        }

        if (!finalImageUrl) {
            if (req.body?.simulated || req.body?.amount) {
                finalImageUrl = `https://mock-storage.local/slips/simulated_slip_${order_id}_${Date.now()}.png`;
            } else {
                return res.status(400).json({ error: 'Image file or image_url is required' });
            }
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

            // 2. ส่งรูปสลิปไปตรวจสอบ (จำลองผ่าน Mock Verification)
            const verificationResult = await slipVerification.verifySlip(
                finalImageUrl, 
                orderInfo.total_amount, 
                orderInfo.promptpay_id,
                trx
            );

            if (!verificationResult.isValid) {
                await trx.rollback();
                return res.status(400).json({ error: verificationResult.message });
            }

            // 3. ถ้าสลิปถูกต้อง บันทึกข้อมูลลงตาราง PAYMENT_SLIPS
            await paymentRepository.saveSlip(order_id, finalImageUrl, verificationResult.refNumber, trx);

            // 4. เปลี่ยนสถานะออเดอร์เป็น PREPARING (ร้านค้ารับเงินแล้ว เริ่มทำอาหารทันทีโดยไม่ต้องกดยืนยันซ้ำ)
            await paymentRepository.updateOrderStatus(order_id, 'PREPARING', trx);

            // ยืนยันการเปลี่ยนแปลงข้อมูล
            await trx.commit();

            // 5. ส่งสัญญาณ Socket.io แจ้งเตือนร้านค้าและลูกค้าว่าสถานะออเดอร์เปลี่ยนเป็น PREPARING (กำลังเตรียมอาหาร)
            const io = req.app.get('io');
            if (io) {
                const payload = {
                    order_id: Number(orderInfo.order_id || order_id),
                    order_code: orderInfo.order_code,
                    status: 'PREPARING',
                    updated_by: 'CUSTOMER',
                    updated_at: new Date()
                };
                io.to(`order_${order_id}`).emit('ORDER_STATUS_UPDATED', payload);
                if (orderInfo.merchant_id) {
                    io.to(`merchant_${orderInfo.merchant_id}`).emit('ORDER_STATUS_UPDATED', payload);
                    io.to(`merchant_${orderInfo.merchant_id}_kds`).emit('ORDER_STATUS_UPDATED', payload);
                }
                if (orderInfo.customer_id) {
                    io.to(`customer_${orderInfo.customer_id}`).emit('ORDER_STATUS_UPDATED', payload);
                }
                // ยิง Broadcast ครอบคลุมทุกหน้าจอแบบ Real-time ทันที
                io.emit('ORDER_STATUS_UPDATED', payload);
            }
            
            return res.status(200).json({ 
                success: true,
                message: 'Payment verified and status updated to PREPARING',
                status: 'PREPARING',
                imageUrl: finalImageUrl,
                refNumber: verificationResult.refNumber
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
