const customerRepo = require('../repositories/customer');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { verifyGoogleToken, verifyLineToken } = require('../utils/socialAuth');

// Helper สร้าง Username ที่ไม่ซ้ำ
const generateUniqueUsername = async (baseName) => {
    let cleanBase = (baseName || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);
    if (!cleanBase) cleanBase = 'user';

    let username = cleanBase;
    let counter = 1;

    while (await customerRepo.findCustomerByUsername(username)) {
        username = `${cleanBase}_${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 10) {
            username = `user_${Date.now().toString().slice(-6)}`;
            break;
        }
    }
    return username;
};

// [POST] /api/auth/customer/register
const register = async (req, res) => {
    try {
        const { username, email, password, phone, dormitory_id, room_number } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }

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
            password_hash: hashedPassword,
            phone,
            dormitory_id: dormitory_id || null,
            room_number: room_number || null
        });

        delete newCustomer.password_hash;
        const token = generateToken(newCustomer, 'CUSTOMER');

        res.status(201).json({ 
            message: 'Customer registered successfully', 
            token,
            user: newCustomer 
        });

    } catch (error) {
        console.error('Customer register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// [POST] /api/auth/customer/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // หาลูกค้าจาก Username หรือ Email
        let customer = await customerRepo.findCustomerByUsername(username);
        if (!customer) {
            customer = await customerRepo.findCustomerByEmail(username);
        }

        if (!customer || !customer.password_hash) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // ตรวจสอบรหัสผ่าน
        const isMatch = await comparePassword(password, customer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // สร้าง Token 
        const token = generateToken(customer, 'CUSTOMER');

        delete customer.password_hash;
        res.status(200).json({ 
            message: 'Login successful', 
            token, 
            user: customer 
        });

    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// [POST] /api/auth/customer/google
const googleLogin = async (req, res) => {
    try {
        const { id_token } = req.body;

        if (!id_token) {
            return res.status(400).json({ error: 'Google id_token is required' });
        }

        const googleUser = await verifyGoogleToken(id_token);

        // 1. ค้นหาผู้ใช้จาก google_id
        let customer = await customerRepo.findCustomerBySocialId('google', googleUser.googleId);

        // 2. ถ้าไม่พบ ตรวจสอบว่ามีอีเมลตรงกันในระบบหรือไม่ (เพื่อเชื่อมโยงบัญชี)
        if (!customer && googleUser.email) {
            customer = await customerRepo.findCustomerByEmail(googleUser.email);
            if (customer) {
                customer = await customerRepo.updateCustomer(customer.id, {
                    google_id: googleUser.googleId,
                    profile_image_url: customer.profile_image_url || googleUser.picture
                });
            }
        }

        // 3. ถ้ายังไม่มีผู้ใช้ ให้สร้างบัญชีใหม่
        if (!customer) {
            const username = await generateUniqueUsername(googleUser.name);
            customer = await customerRepo.createCustomer({
                username,
                email: googleUser.email,
                google_id: googleUser.googleId,
                profile_image_url: googleUser.picture,
                password_hash: null
            });
        }

        const token = generateToken(customer, 'CUSTOMER');
        delete customer.password_hash;

        return res.status(200).json({
            message: 'Google login successful',
            token,
            user: customer
        });

    } catch (error) {
        console.error('Customer Google Login error:', error);
        return res.status(401).json({ error: error.message || 'Google authentication failed' });
    }
};

// [POST] /api/auth/customer/line
const lineLogin = async (req, res) => {
    try {
        const { access_token, id_token } = req.body;

        if (!access_token && !id_token) {
            return res.status(400).json({ error: 'LINE access_token or id_token is required' });
        }

        const lineUser = await verifyLineToken(access_token, id_token);

        // 1. ค้นหาจาก line_id
        let customer = await customerRepo.findCustomerBySocialId('line', lineUser.lineId);

        // 2. ถ้ามีอีเมล ตรวจสอบว่าตรงกับผู้ใช้เดิมหรือไม่
        if (!customer && lineUser.email) {
            customer = await customerRepo.findCustomerByEmail(lineUser.email);
            if (customer) {
                customer = await customerRepo.updateCustomer(customer.id, {
                    line_id: lineUser.lineId,
                    profile_image_url: customer.profile_image_url || lineUser.picture
                });
            }
        }

        // 3. ถ้ายังไม่มี ให้สร้างบัญชีใหม่
        if (!customer) {
            const username = await generateUniqueUsername(lineUser.name);
            customer = await customerRepo.createCustomer({
                username,
                email: lineUser.email || null,
                line_id: lineUser.lineId,
                profile_image_url: lineUser.picture,
                password_hash: null
            });
        }

        const token = generateToken(customer, 'CUSTOMER');
        delete customer.password_hash;

        return res.status(200).json({
            message: 'LINE login successful',
            token,
            user: customer
        });

    } catch (error) {
        console.error('Customer LINE Login error:', error);
        return res.status(401).json({ error: error.message || 'LINE authentication failed' });
    }
};

module.exports = { 
    register, 
    login,
    googleLogin,
    lineLogin
};
