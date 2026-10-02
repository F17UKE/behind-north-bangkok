const jwt = require('jsonwebtoken');

// ต้องแน่ใจว่าในไฟล์ backend/.env มีการตั้งค่า JWT_SECRET=ความลับของคุณ
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

const generateToken = (user, role) => {
    const payload = {
        id: user.id,
        role: role // 'CUSTOMER', 'MERCHANT', หรือ 'RIDER'
    };

    // เพิ่มข้อมูลเฉพาะกลุ่มลงใน Payload ถ้าจำเป็น
    if (role === 'RIDER') {
        payload.merchant_id = user.merchant_id;
    }
    
    // ตั้งค่า Token หมดอายุใน 24 ชั่วโมง (เพื่อให้สอดคล้องกับ Data Purging Policy)
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' }); 
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };