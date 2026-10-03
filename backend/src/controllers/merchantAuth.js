const merchantRepo = require('../repositories/merchant');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

// ฟังก์ชันสุ่มตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ 4 ตัว
const generateRandomPrefix = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let prefix = '';
    for (let i = 0; i < 4; i++) {
        prefix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix;
};

const register = async (req, res) => {
    try {
        // เอา prefix ออกจากการรับค่า req.body
        const { username, password, store_name, promptpay_id, location, store_image_url } = req.body;

        const existingMerchant = await merchantRepo.findMerchantByUsername(username);
        if (existingMerchant) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // 🟢 กระบวนการสุ่มและเช็ค Prefix ซ้ำ
        let isUnique = false;
        let generatedPrefix = '';

        while (!isUnique) {
            generatedPrefix = generateRandomPrefix();
            // เช็คในฐานข้อมูลว่ามีคนใช้ prefix นี้ไปหรือยัง
            const existingPrefix = await merchantRepo.findMerchantByPrefix(generatedPrefix);
            
            if (!existingPrefix) {
                isUnique = true; // ถ้าไม่มีซ้ำ ให้ออกจาก Loop
            }
        }

        const hashedPassword = await hashPassword(password);

        const newMerchant = await merchantRepo.createMerchant({
            username,
            password_hash: hashedPassword,
            store_name,
            promptpay_id,
            prefix: generatedPrefix, // ใช้ prefix ที่สุ่มและไม่ซ้ำ
            location,
            store_image_url,
            last_order_number: 0,
            is_open: false 
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

module.exports = { register, login };