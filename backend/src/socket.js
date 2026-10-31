const { verifyToken } = require('./utils/jwt');
const chatRepository = require('./repositories/chatRepository');
const knex = require('./db');

module.exports = (io) => {
    // 1. JWT Authentication Middleware สำหรับ Socket.io
    io.use((socket, next) => {
        const authHeader = socket.handshake.headers?.authorization;
        const token = socket.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                socket.user = decoded; // { id, role, merchant_id? }
                return next();
            }
        }
        
        // หากไม่มี token หรือ token ไม่ถูกต้อง (เปิดโอกาสให้ dev mode ทำงานได้ แต่ socket.user จะไม่มี)
        // เมื่อนำไปใช้จริงบน production สามารถเปิดบรรทัดล่างเพื่อบังคับล็อกอินได้:
        // return next(new Error('Authentication required for socket connection'));
        next();
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id} (User: ${socket.user ? socket.user.role + '_' + socket.user.id : 'Anonymous'})`);

        // 2. รับคำสั่งเข้าห้องออเดอร์ พร้อมตรวจสอบสิทธิ์ (Room Authorization)
        socket.on('join_order_room', async (data) => {
            const id = typeof data === 'object' ? (data.orderId || data.order_id) : data;
            const numericOrderId = Number(id);

            if (!numericOrderId) {
                return socket.emit('error', { message: 'Invalid order ID' });
            }

            try {
                // ตรวจสอบข้อมูลออเดอร์ใน Database
                const order = await knex('ORDERS').where('id', numericOrderId).first();
                if (!order) {
                    return socket.emit('error', { message: 'Order not found' });
                }

                // ตรวจสอบสิทธิ์การเข้าถึงห้องแชท (ถ้ามี socket.user)
                if (socket.user) {
                    const { id: userId, role } = socket.user;
                    const isCustomer = role === 'CUSTOMER' && order.customer_id === userId;
                    const isMerchant = role === 'MERCHANT' && order.merchant_id === userId;
                    const isAssignedRider = role === 'RIDER' && (order.rider_id === userId || socket.user.merchant_id === order.merchant_id);
                    const isAdmin = role === 'ADMIN';

                    if (!isCustomer && !isMerchant && !isAssignedRider && !isAdmin) {
                        console.warn(`⛔ User ${userId} (${role}) พยายามเข้าห้องออเดอร์ ${numericOrderId} โดยไม่มีสิทธิ์`);
                        return socket.emit('error', { message: 'Unauthorized to join this order room' });
                    }
                }

                const roomName = `order_${numericOrderId}`; 
                socket.join(roomName);
                console.log(`🚪 User ${socket.id} เข้าสู่ห้อง: ${roomName}`);

                // ส่งประวัติข้อความเก่าในห้องให้เฉพาะผู้ใช้ที่เพิ่งเข้าห้อง
                const history = await chatRepository.getMessagesByOrderId(numericOrderId);
                socket.emit('chat_history', history); 

            } catch (error) {
                console.error('❌ เข้าร่วมห้องหรือดึงประวัติแชทล้มเหลว:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // 3. เข้าห้องเฉพาะของ Rider หรือ Kitchen (สำหรับ Dispatch Board และ KDS)
        socket.on('join_dispatch_room', (data) => {
            const riderId = socket.user?.id || data?.riderId || data?.rider_id;
            if (riderId) {
                const room = `rider_${riderId}`;
                socket.join(room);
                console.log(`🛵 Rider ${riderId} เข้าสู่ห้อง: ${room}`);
            }
        });

        socket.on('join_kds_room', (data) => {
            const merchantId = socket.user?.id || data?.merchantId || data?.merchant_id;
            if (merchantId) {
                const room = `merchant_${merchantId}_kds`;
                socket.join(room);
                console.log(`🍳 Kitchen เข้าสู่ห้อง KDS: ${room}`);
            }
        });

        // 4. รับข้อความแชทและบันทึกลงฐานข้อมูล (ป้องกันการปลอมแปลง Role)
        socket.on('send_message', async (data) => {
            try {
                const orderId = Number(data.orderId || data.order_id);
                if (!orderId) {
                    return socket.emit('error', { message: 'Invalid order ID' });
                }

                // กำหนด Role ผู้ส่งจาก Token เพื่อความปลอดภัย หากไม่มี token ให้ใช้ fallback จาก request
                let isMerchantSender = data.isMerchantSender;
                let senderSubRole = data.senderSubRole;

                if (socket.user) {
                    if (socket.user.role === 'CUSTOMER') {
                        isMerchantSender = false;
                        senderSubRole = null;
                    } else if (socket.user.role === 'MERCHANT') {
                        isMerchantSender = true;
                        senderSubRole = 'STORE';
                    } else if (socket.user.role === 'RIDER') {
                        isMerchantSender = true;
                        senderSubRole = 'RIDER';
                    }
                }

                const savedMessage = await chatRepository.saveMessage({
                    isMerchantSender,
                    senderSubRole,
                    messageType: data.messageType || 'TEXT',
                    contentText: data.contentText || data.content_text,
                    callDurationSeconds: data.callDurationSeconds || 0,
                    orderId: orderId
                });

                // บรอดแคสต์ข้อความที่บันทึกแล้วกลับไปทุกคนในห้องออเดอร์
                const roomName = `order_${orderId}`;
                io.to(roomName).emit('new_message', {
                    ...savedMessage,
                    from: data.from || data.senderName,
                    role: senderSubRole || (isMerchantSender ? 'STORE' : 'CUSTOMER')
                });

            } catch (error) {
                console.error('❌ ส่งข้อความล้มเหลว:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // 5. อัปเดต Read Watermark แบบ Real-time
        socket.on('update_read_watermark', async (data) => {
            try {
                const orderId = Number(data.orderId || data.order_id);
                const messageId = Number(data.messageId || data.message_id);
                const role = socket.user?.role || data.role; // 'CUSTOMER' หรือ 'MERCHANT'/'RIDER'

                if (!orderId || !messageId || !role) return;

                await chatRepository.updateReadWatermark(orderId, role, messageId);

                // แจ้งเตือนคู่สนทนาในห้องว่ามีคนอ่านแล้ว
                io.to(`order_${orderId}`).emit('watermark_updated', {
                    orderId,
                    role,
                    messageId
                });
            } catch (error) {
                console.error('❌ อัปเดต Watermark ล้มเหลว:', error);
            }
        });

        // 6. WebRTC Voice Call Signaling Events
        socket.on('call:offer', (data) => {
            const { orderId, offer } = data;
            const roomName = `order_${orderId}`;
            // ส่งสัญญาณไปยังผู้ใช้อื่นในห้องเดียวกัน (ไม่ส่งกลับหาคนโทร)
            socket.to(roomName).emit('call:incoming', {
                orderId,
                offer,
                caller: socket.user ? { id: socket.user.id, role: socket.user.role } : null
            });
        });

        socket.on('call:answer', (data) => {
            const { orderId, answer } = data;
            const roomName = `order_${orderId}`;
            socket.to(roomName).emit('call:answered', { orderId, answer });
        });

        socket.on('call:ice-candidate', (data) => {
            const { orderId, candidate } = data;
            const roomName = `order_${orderId}`;
            socket.to(roomName).emit('call:ice-candidate', { candidate });
        });

        socket.on('call:reject', (data) => {
            const { orderId } = data;
            const roomName = `order_${orderId}`;
            socket.to(roomName).emit('call:rejected', { orderId });
        });

        socket.on('call:end', async (data) => {
            const { orderId, durationSeconds } = data;
            const roomName = `order_${orderId}`;
            socket.to(roomName).emit('call:ended', { orderId, durationSeconds });

            // บันทึกประวัติการโทรลงตาราง MESSAGES
            try {
                if (orderId) {
                    let isMerchantSender = socket.user?.role === 'MERCHANT' || socket.user?.role === 'RIDER';
                    let senderSubRole = socket.user?.role === 'RIDER' ? 'RIDER' : (socket.user?.role === 'MERCHANT' ? 'STORE' : null);

                    await chatRepository.saveMessage({
                        isMerchantSender,
                        senderSubRole,
                        messageType: 'CALL_ENDED',
                        contentText: `Call ended (${durationSeconds || 0}s)`,
                        callDurationSeconds: durationSeconds || 0,
                        orderId: Number(orderId)
                    });
                }
            } catch (err) {
                console.error('❌ บันทึกประวัติการโทรล้มเหลว:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });
};
