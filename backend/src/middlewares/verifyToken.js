const { verifyToken } = require('../utils/jwt');

const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token); // เรียกใช้ฟังก์ชันจาก utils/jwt.js

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // เก็บข้อมูล user ที่ถอดรหัสแล้วไว้ใน req เพื่อให้ middleware หรือ controller ต่อไปใช้งานได้
    req.user = decoded; 
    next();
};

module.exports = checkAuth;