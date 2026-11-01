// backend/src/controllers/adminAuth.js
const { generateToken } = require('../utils/jwt');
require('dotenv').config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

/**
 * [POST] /api/auth/admin/login
 * ล็อกอินสำหรับผู้ดูแลระบบ (Admin)
 * ไม่เปิดให้มีระบบ Register เพื่อความปลอดภัย โดยใช้รหัส Admin ผ่าน Environment Variables
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const adminPayload = {
            id: 0,
            username: ADMIN_USERNAME
        };

        const token = generateToken(adminPayload, 'ADMIN');

        return res.status(200).json({
            message: 'Admin login successful',
            token,
            user: {
                id: 0,
                username: ADMIN_USERNAME,
                role: 'ADMIN'
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    login
};
