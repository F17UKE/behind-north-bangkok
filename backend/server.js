const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron'); // [เพิ่ม] สำหรับจัดการ Cron Job
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ตั้งค่า CORS ให้ Frontend (Next.js) เรียกใช้งาน API ได้
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// 1. Import Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const merchantRoutes = require('./src/routes/merchant');
const orderRoutes = require('./src/routes/order');
const paymentRoutes = require('./src/routes/payment');
const kdsRoutes = require('./src/routes/kds');
const chatRoutes = require('./src/routes/chat'); // [เพิ่ม] Route สำหรับระบบแชท

// 2. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', paymentRoutes);
app.use('/api/merchants/kds', kdsRoutes);
app.use('/api/orders', chatRoutes); // [เพิ่ม] ใช้งาน Chat API (เช่น /api/orders/:order_id/messages)

// 3. ตั้งค่า Socket.io สำหรับระบบ Real-time Chat และ Notification
const io = new Server(server, {
    cors: { origin: 'http://localhost:3000' }
});

// [เพิ่ม] เรียกใช้งาน Socket Logic จากไฟล์แยก (src/socket.js)
const socketHandler = require('./src/socket');
socketHandler(io); 

// 4. [เพิ่ม] Cron Job: Data Purging Policy (ลบข้อมูลเกิน 24 ชม.)[cite: 6]
const chatRepository = require('./src/repositories/chatRepository');
// รันทุกๆ 1 ชั่วโมง ('0 * * * *') หรือเปลี่ยนเป็น ('0 0 * * *') ถ้ารันแค่วันละครั้งตอนเที่ยงคืน
cron.schedule('0 * * * *', async () => {
    try {
        const deletedCount = await chatRepository.purgeOldMessages();
        if (deletedCount > 0) {
            console.log(`[Cron Job] Purged ${deletedCount} messages older than 24h.`);
        }
    } catch (error) {
        console.error('[Cron Job] Failed to purge messages:', error);
    }
});

// API เริ่มต้นสำหรับทดสอบ
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Behind North Bangkok API is running!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});