const merchantRepo = require('../repositories/merchant');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { verifyGoogleToken, verifyLineToken } = require('../utils/socialAuth');

// ฟังก์ชันสุ่มตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ 4 ตัว
const generateRandomPrefix = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let isUnique = false;
    let generatedPrefix = '';

    while (!isUnique) {
        generatedPrefix = '';
        for (let i = 0; i < 4; i++) {
            generatedPrefix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existingPrefix = await merchantRepo.findMerchantByPrefix(generatedPrefix);
        if (!existingPrefix) {
            isUnique = true;
        }
    }
    return generatedPrefix;
};

// [POST] /api/auth/merchant/register
const register = async (req, res) => {
    try {
        const { username, password, email, store_name, promptpay_id, location, store_image_url } = req.body;

        if (!username || !password || !store_name) {
            return res.status(400).json({ error: 'Username, password and store_name are required' });
        }

        const existingMerchant = await merchantRepo.findMerchantByUsername(username);
        if (existingMerchant) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        if (email) {
            const existingEmail = await merchantRepo.findMerchantByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        const generatedPrefix = await generateRandomPrefix();
        const hashedPassword = await hashPassword(password);

        const newMerchant = await merchantRepo.createMerchant({
            username,
            email: email || null,
            password_hash: hashedPassword,
            store_name,
            promptpay_id: promptpay_id || null,
            prefix: generatedPrefix,
            location: location || null,
            store_image_url: store_image_url || null,
            last_order_number: 0,
            is_open: false,
            is_approved: false
        });

        const token = generateToken(newMerchant, 'MERCHANT');

        delete newMerchant.password_hash;
        res.status(201).json({ 
            message: 'Merchant registered successfully (waiting for admin approval)', 
            token,
            merchant: newMerchant 
        });

    } catch (error) {
        console.error('Merchant register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// [POST] /api/auth/merchant/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        let merchant = await merchantRepo.findMerchantByUsername(username);
        if (!merchant && username.includes('@')) {
            merchant = await merchantRepo.findMerchantByEmail(username);
        }

        if (!merchant || !merchant.password_hash) {
            return res.status(401).json({ error: 'Invalid merchant credentials' });
        }

        const isMatch = await comparePassword(password, merchant.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid merchant credentials' });
        }

        const token = generateToken(merchant, 'MERCHANT');

        delete merchant.password_hash;
        res.status(200).json({ 
            message: 'Merchant login successful', 
            token,
            merchant: { 
                id: merchant.id, 
                store_name: merchant.store_name, 
                prefix: merchant.prefix,
                is_approved: merchant.is_approved,
                is_open: merchant.is_open
            }
        });

    } catch (error) {
        console.error('Merchant login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// [POST] /api/auth/merchant/google
const googleLogin = async (req, res) => {
    try {
        const { id_token } = req.body;

        if (!id_token) {
            return res.status(400).json({ error: 'Google id_token is required' });
        }

        const googleUser = await verifyGoogleToken(id_token);

        // 1. ค้นหาร้านค้าจาก google_id
        let merchant = await merchantRepo.findMerchantBySocialId('google', googleUser.googleId);

        // 2. ถ้าไม่พบ ตรวจสอบจาก email เพื่อเชื่อมโยงบัญชีเดิม
        if (!merchant && googleUser.email) {
            merchant = await merchantRepo.findMerchantByEmail(googleUser.email);
            if (merchant) {
                const [linked] = await merchantRepo.linkMerchantSocial(merchant.id, 'google', googleUser.googleId);
                merchant = linked || merchant;
            }
        }

        // 3. ถ้าเป็นร้านค้าเดิม ออก Token ให้เข้าแดชบอร์ด
        if (merchant) {
            const token = generateToken(merchant, 'MERCHANT');
            delete merchant.password_hash;
            return res.status(200).json({
                message: 'Merchant Google login successful',
                token,
                merchant: {
                    id: merchant.id,
                    store_name: merchant.store_name,
                    prefix: merchant.prefix,
                    is_approved: merchant.is_approved,
                    is_open: merchant.is_open
                }
            });
        }

        // 4. ถ้าร้านค้ายังไม่เคยมีบัญชี ให้ส่งข้อมูลกลับไปเพื่อให้หน้าบ้านแสดง Onboarding Form
        return res.status(200).json({
            is_new_merchant: true,
            google_id: googleUser.googleId,
            email: googleUser.email,
            suggested_store_name: googleUser.name,
            message: 'Please complete merchant onboarding with store details'
        });

    } catch (error) {
        console.error('Merchant Google Login error:', error);
        return res.status(401).json({ error: error.message || 'Google authentication failed' });
    }
};

// [POST] /api/auth/merchant/google/onboard
const googleOnboard = async (req, res) => {
    try {
        const { google_id, email, store_name, promptpay_id, location, store_image_url } = req.body;

        if (!google_id || !store_name) {
            return res.status(400).json({ error: 'google_id and store_name are required' });
        }

        const existing = await merchantRepo.findMerchantBySocialId('google', google_id);
        if (existing) {
            return res.status(400).json({ error: 'Store already registered with this Google account' });
        }

        const prefix = await generateRandomPrefix();
        const username = `merchant_${google_id.slice(-6)}_${Date.now().toString().slice(-4)}`;

        const newMerchant = await merchantRepo.createMerchant({
            username,
            email: email || null,
            google_id,
            password_hash: null,
            store_name,
            promptpay_id: promptpay_id || null,
            prefix,
            location: location || null,
            store_image_url: store_image_url || null,
            last_order_number: 0,
            is_open: false,
            is_approved: false
        });

        const token = generateToken(newMerchant, 'MERCHANT');
        delete newMerchant.password_hash;

        return res.status(201).json({
            message: 'Store created successfully (waiting for admin approval)',
            token,
            merchant: newMerchant
        });

    } catch (error) {
        console.error('Merchant Google Onboard error:', error);
        return res.status(500).json({ error: 'Internal server error during onboarding' });
    }
};

// [POST] /api/auth/merchant/line
const lineLogin = async (req, res) => {
    try {
        const { access_token, id_token } = req.body;

        if (!access_token && !id_token) {
            return res.status(400).json({ error: 'LINE access_token or id_token is required' });
        }

        const lineUser = await verifyLineToken(access_token, id_token);

        let merchant = await merchantRepo.findMerchantBySocialId('line', lineUser.lineId);

        if (!merchant && lineUser.email) {
            merchant = await merchantRepo.findMerchantByEmail(lineUser.email);
            if (merchant) {
                const [linked] = await merchantRepo.linkMerchantSocial(merchant.id, 'line', lineUser.lineId);
                merchant = linked || merchant;
            }
        }

        if (merchant) {
            const token = generateToken(merchant, 'MERCHANT');
            delete merchant.password_hash;
            return res.status(200).json({
                message: 'Merchant LINE login successful',
                token,
                merchant: {
                    id: merchant.id,
                    store_name: merchant.store_name,
                    prefix: merchant.prefix,
                    is_approved: merchant.is_approved,
                    is_open: merchant.is_open
                }
            });
        }

        return res.status(200).json({
            is_new_merchant: true,
            line_id: lineUser.lineId,
            email: lineUser.email,
            suggested_store_name: lineUser.name,
            message: 'Please complete merchant onboarding with store details'
        });

    } catch (error) {
        console.error('Merchant LINE Login error:', error);
        return res.status(401).json({ error: error.message || 'LINE authentication failed' });
    }
};

// [POST] /api/auth/merchant/line/onboard
const lineOnboard = async (req, res) => {
    try {
        const { line_id, email, store_name, promptpay_id, location, store_image_url } = req.body;

        if (!line_id || !store_name) {
            return res.status(400).json({ error: 'line_id and store_name are required' });
        }

        const existing = await merchantRepo.findMerchantBySocialId('line', line_id);
        if (existing) {
            return res.status(400).json({ error: 'Store already registered with this LINE account' });
        }

        const prefix = await generateRandomPrefix();
        const username = `merchant_${line_id.slice(-6)}_${Date.now().toString().slice(-4)}`;

        const newMerchant = await merchantRepo.createMerchant({
            username,
            email: email || null,
            line_id,
            password_hash: null,
            store_name,
            promptpay_id: promptpay_id || null,
            prefix,
            location: location || null,
            store_image_url: store_image_url || null,
            last_order_number: 0,
            is_open: false,
            is_approved: false
        });

        const token = generateToken(newMerchant, 'MERCHANT');
        delete newMerchant.password_hash;

        return res.status(201).json({
            message: 'Store created successfully (waiting for admin approval)',
            token,
            merchant: newMerchant
        });

    } catch (error) {
        console.error('Merchant LINE Onboard error:', error);
        return res.status(500).json({ error: 'Internal server error during onboarding' });
    }
};

module.exports = { 
    register, 
    login,
    googleLogin,
    googleOnboard,
    lineLogin,
    lineOnboard
};
