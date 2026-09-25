const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ตั้งค่า CORS ให้ Frontend (Next.js) เรียกใช้งาน API ได้
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const merchantRoutes = require('./routes/merchantRoutes');
app.use('/api/merchants', merchantRoutes);

// ตั้งค่า Socket.io สำหรับระบบ Real-time Chat และ Notification
const io = new Server(server, {
    cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// API เริ่มต้นสำหรับทดสอบ
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Behind North Bangkok API is running!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});