const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 1. Security Headers (Helmet) & CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // อนุญาตให้โหลดรูปภาพข้าม Origin ได้
}));
const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const isPrivateNetworkOrigin = (origin) => {
    try {
        const url = new URL(origin);
        if (!['http:', 'https:'].includes(url.protocol)) return false;
        const hostname = url.hostname.replace(/^\[|\]$/g, '');
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' ||
            /^10(?:\.\d{1,3}){3}$/.test(hostname) ||
            /^192\.168(?:\.\d{1,3}){2}$/.test(hostname) ||
            /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(hostname);
    } catch {
        return false;
    }
};
const corsOptions = {
    origin(origin, callback) {
        if (!origin || configuredOrigins.includes(origin) ||
            (process.env.NODE_ENV !== 'production' && isPrivateNetworkOrigin(origin))) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    }
};
app.use(cors(corsOptions));
app.use(express.json());

// 2. Rate Limiting Middlewares (ป้องกัน Brute Force & DDoS)
const { authLimiter, apiLimiter } = require('./src/middlewares/rateLimiter');
app.use('/api', apiLimiter);

// 3. Import Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const merchantRoutes = require('./src/routes/merchant');
const orderRoutes = require('./src/routes/order');
const paymentRoutes = require('./src/routes/payment');
const kdsRoutes = require('./src/routes/kds');
const chatRoutes = require('./src/routes/chat');
const menuRoutes = require('./src/routes/menu');
const merchantManagementRoutes = require('./src/routes/merchantManagement');
const riderManagementRoutes = require('./src/routes/riderManagement');
const orderWorkflowRoute = require('./src/routes/orderWorkflow');
const riderBoardRoute = require('./src/routes/riderBoard');
const masterDataRoute = require('./src/routes/masterData');
const uploadRoutes = require('./src/routes/upload');
const adminRoutes = require('./src/routes/admin');

// 4. Mount Routes พร้อม Rate Limiting ในจุดสำคัญ
app.use('/api', masterDataRoute);
app.use('/api/auth', authLimiter, authRoutes); // จำกัดความถี่การล็อกอิน/สมัครสมาชิก
app.use('/api/users', userRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', paymentRoutes); // Payment routes apply their own limiter only to QR/slip requests
app.use('/api/merchants/kds', kdsRoutes);
app.use('/api/orders', chatRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/merchant-management', merchantManagementRoutes);
app.use('/api/merchant-management/riders', riderManagementRoutes);
app.use('/api/order-workflow', orderWorkflowRoute);
app.use('/api/riders', riderBoardRoute);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// API เริ่มต้นสำหรับทดสอบสุขภาพระบบ
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Behind North Bangkok API is running!' });
});

// 5. Centralized Error Handling Middlewares
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');
app.use(notFoundHandler); // จัดการ Route 404
app.use(errorHandler);    // จัดการ Validation Errors และ System Exceptions กลาง

// 6. ตั้งค่า Socket.io สำหรับระบบ Real-time Chat และ Notification
const io = new Server(server, {
    cors: corsOptions
});

// แชร์ instance io ให้ Controller อื่นๆ เรียกใช้งานผ่าน req.app.get('io')
app.set('io', io);

// เรียกใช้งาน Socket Logic จากไฟล์แยก (src/socket.js)
const socketHandler = require('./src/socket');
socketHandler(io); 

// 7. เตรียม Storage Bucket (Supabase Storage)
const storageService = require('./src/services/storageService');
storageService.ensureBucketExists().catch(err => console.error('Bucket check warning:', err.message));

// 8. Cron Jobs: Data Purging & Storage Cleanup
const chatRepository = require('./src/repositories/chatRepository');
const paymentRepository = require('./src/repositories/paymentRepository');
const orderTimeoutService = require('./src/services/orderTimeoutService');

// รันทุกๆ 1 ชั่วโมง เพื่อลบข้อความแชทเกิน 24 ชม.
cron.schedule('0 * * * *', async () => {
    try {
        const deletedMessagesCount = await chatRepository.purgeOldMessages();
        if (deletedMessagesCount > 0) {
            console.log(`[Cron Job] Purged ${deletedMessagesCount} messages older than 24h.`);
        }
    } catch (error) {
        console.error('[Cron Job] Failed to purge old messages:', error);
    }
});

// รันทุกวันเวลาเที่ยงคืน (00:00) เพื่อลบสลิปและไฟล์รูปใน Supabase ที่อายุเกิน 7 วัน (1 สัปดาห์) ตามข้อกำหนด
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('[Cron Job] Starting weekly cleanup (7-day retention)...');

        // 1. ลบไฟล์รูปสลิปใน Supabase Storage ที่เกิน 7 วัน
        const deletedStorageFiles = await storageService.cleanupOldImages(7, 'slips');
        if (deletedStorageFiles > 0) {
            console.log(`[Cron Job] Deleted ${deletedStorageFiles} old slip files from Supabase Storage.`);
        }

        // 2. ลบประวัติในตาราง PAYMENT_SLIPS ที่เกิน 7 วัน
        const deletedSlipsCount = await paymentRepository.purgeOldPaymentSlips(7);
        if (deletedSlipsCount > 0) {
            console.log(`[Cron Job] Purged ${deletedSlipsCount} payment slip records older than 7 days.`);
        }
    } catch (error) {
        console.error('[Cron Job] Failed during weekly storage cleanup:', error);
    }
});

// รันทุกๆ 1 นาที เพื่อตรวจสอบและยกเลิกออเดอร์ที่ค้างเกินเวลา (Auto-Cancel Timeout)
cron.schedule('* * * * *', async () => {
    try {
        await orderTimeoutService.checkAndCancelTimedOutOrders(io);
    } catch (error) {
        console.error('[Cron Job] Order timeout check error:', error);
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
});
