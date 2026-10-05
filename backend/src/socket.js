const chatRepository = require('./repositories/chatRepository');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ Socket connected:', socket.id);

        // 1. รับคำสั่งเข้าห้อง
        socket.on('join_order_room', async (data) => {
            const id = typeof data === 'object' ? (data.orderId || data.order_id) : data;
            const roomName = 'order_' + id; 
            socket.join(roomName);
            console.log('🚪 User ' + socket.id + ' เข้าร่วมห้อง: ' + roomName);

            // [เพิ่มโค้ดส่วนนี้] ดึงประวัติข้อความเก่าจาก DB และส่งกลับไปให้หน้าเว็บ
            try {
                const history = await chatRepository.getMessagesByOrderId(id);
                // ใช้คำสั่ง emit (ส่งเฉพาะคนที่เพิ่งกดเข้าห้อง ไม่ต้อง broadcast)
                socket.emit('chat_history', history); 
            } catch (error) {
                console.error('❌ ดึงประวัติแชทล้มเหลว:', error);
            }
        });

        // 2. รับข้อความและบันทึก
        socket.on('send_message', async (data) => {
            console.log('📥 1. Backend ได้รับข้อมูลจากหน้าเว็บ:', data);
            
            try {
                const orderId = data.orderId || data.order_id;
                
                await chatRepository.saveMessage({
                    isMerchantSender: data.isMerchantSender,
                    senderSubRole: data.senderSubRole,
                    messageType: 'TEXT',
                    contentText: data.contentText,
                    callDurationSeconds: 0,
                    orderId: orderId
                });
                console.log('💾 2. บันทึกลง Database สำเร็จ');

                // ใช้เครื่องหมาย + ให้ชัวร์ว่าส่งไปถูกห้อง
                const roomName = 'order_' + orderId;
                io.to(roomName).emit('new_message', data);
                
                console.log('📤 3. บรอดแคสต์ข้อความกลับไปที่ห้อง [' + roomName + '] สำเร็จ!');

            } catch (error) {
                console.error('❌ 4. เกิด Error ขึ้นระหว่างทำงาน:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected:', socket.id);
        });
    });
};