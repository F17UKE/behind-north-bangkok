const customerRepo = require('../repositories/customer');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

// [POST] /api/auth/customer/register
const register = async (req, res) => {
    try {
        const { username, email, password, phone, dormitory_id, room_number } = req.body;

        // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
        const existingUser = await customerRepo.findCustomerByUsername(username);
        const existingEmail = await customerRepo.findCustomerByEmail(email);
        
        if (existingUser || existingEmail) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        // เข้ารหัสผ่าน
        const hashedPassword = await hashPassword(password);

        // บันทึกลงฐานข้อมูล
        const newCustomer = await customerRepo.createCustomer({
            username,
            email,
            password_hash: hashedPassword, // เซฟเป็น Hash
            phone,
            dormitory_id,
            room_number
        });

        // คืนค่ากลับไปโดยไม่ส่ง password_hash
        delete newCustomer.password_hash;
        res.status(201).json({ message: 'Customer registered successfully', user: newCustomer });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// [POST] /api/auth/customer/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // หาลูกค้าจาก Username
        const customer = await customerRepo.findCustomerByUsername(username);
        if (!customer) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // ตรวจสอบรหัสผ่าน
        const isMatch = await comparePassword(password, customer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // สร้าง Token 
        const token = generateToken(customer, 'CUSTOMER');

        // ตอบกลับ
        res.status(200).json({ 
            message: 'Login successful', 
            token, 
            user: { id: customer.id, username: customer.username, email: customer.email } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login };