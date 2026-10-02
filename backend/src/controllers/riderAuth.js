const riderRepo = require('../repositories/rider');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

// 1. ฟังก์ชัน สร้างบัญชี Rider (สำหรับร้านค้า)
const createRider = async (req, res) => {
    try {
        const merchantId = req.user.id; 
        const { username, password, full_name, phone } = req.body;

        const existingRider = await riderRepo.checkUsernameExists(username);
        if (existingRider) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newRider = await riderRepo.createRider({
            username,
            password_hash: hashedPassword,
            full_name,
            phone,
            is_active: true,
            merchant_id: merchantId
        });

        delete newRider.password_hash;
        res.status(201).json({ message: 'Rider created successfully', rider: newRider });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 2. ฟังก์ชัน เข้าสู่ระบบ Rider (Login)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const rider = await riderRepo.findRiderByUsername(username);

        if (!rider) {
            return res.status(401).json({ error: 'Invalid rider credentials or inactive account' });
        }

        const isMatch = await comparePassword(password, rider.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid rider credentials' });
        }

        const token = generateToken(rider, 'RIDER');

        res.status(200).json({ 
            message: 'Rider login successful', 
            token,
            rider: { id: rider.id, full_name: rider.full_name, merchant_id: rider.merchant_id }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 3. 🟢 ต้องส่งออกทั้ง 2 ฟังก์ชัน (จุดที่มักจะทำให้เกิด Error Undefined)
module.exports = { login, createRider };