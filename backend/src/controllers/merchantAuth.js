const merchantRepo = require('../repositories/merchant');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

// 1. ฟังก์ชัน สมัครร้านค้า (Register)
const register = async (req, res) => {
    try {
        const { username, password, store_name, promptpay_id, prefix, location, store_image_url } = req.body;

        // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
        const existingMerchant = await merchantRepo.findMerchantByUsername(username);
        if (existingMerchant) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newMerchant = await merchantRepo.createMerchant({
            username,
            password_hash: hashedPassword,
            store_name,
            promptpay_id,
            prefix,
            location,
            store_image_url,
            last_order_number: 0,
            is_open: false // กำหนดเป็น false ไปก่อน รอ Admin อนุมัติ
        });

        delete newMerchant.password_hash;
        res.status(201).json({ 
            message: 'Merchant registered successfully (waiting for admin approval)', 
            merchant: newMerchant 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 2. ฟังก์ชัน เข้าสู่ระบบร้านค้า (Login)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const merchant = await merchantRepo.findMerchantByUsername(username);
        if (!merchant) {
            return res.status(401).json({ error: 'Invalid merchant credentials' });
        }

        const isMatch = await comparePassword(password, merchant.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid merchant credentials' });
        }

        const token = generateToken(merchant, 'MERCHANT');

        res.status(200).json({ 
            message: 'Merchant login successful', 
            token,
            merchant: { id: merchant.id, store_name: merchant.store_name, prefix: merchant.prefix }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 3. ส่งออกทั้ง 2 ฟังก์ชัน
module.exports = { register, login };