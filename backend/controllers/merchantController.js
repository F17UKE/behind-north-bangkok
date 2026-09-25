const db = require('../config/db');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

exports.registerMerchant = async (req, res) => {
  try {
    const { username, password, store_name, promptpay_id, prefix, location } = req.body;

    // 1. ตรวจสอบว่ามี username หรือ prefix นี้ซ้ำในระบบหรือไม่
    const existingMerchant = await db('merchants')
      .where({ username })
      .orWhere({ prefix })
      .first();

    if (existingMerchant) {
      return res.status(400).json({ message: 'Username หรือ Prefix นี้ถูกใช้งานแล้ว' });
    }

    // 2. เข้ารหัสผ่านด้วย bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // 3. บันทึกข้อมูลลงฐานข้อมูล
    const [newMerchant] = await db('merchants').insert({
      username,
      password_hash,
      store_name,
      promptpay_id,
      prefix,
      location,
      is_open: false // ค่าเริ่มต้นคือยังไม่เปิดร้าน
    }).returning(['id', 'username', 'store_name', 'prefix']);

    res.status(201).json({ 
      message: 'ลงทะเบียนร้านค้าสำเร็จ', 
      merchant: newMerchant 
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', error: error.message });
  }
};

exports.loginMerchant = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. ค้นหาร้านค้าจาก username
    const merchant = await db('merchants').where({ username }).first();
    
    if (!merchant) {
      return res.status(401).json({ message: 'Username หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 2. ตรวจสอบรหัสผ่านว่าตรงกับที่เข้ารหัสไว้หรือไม่
    const isMatch = await bcrypt.compare(password, merchant.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Username หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 3. สร้าง JWT Token (เพื่อใช้ยืนยันตัวตนใน API อื่นๆ ที่ต้องล็อกอินก่อน)
    // หมายเหตุ: ควรเพิ่ม JWT_SECRET='รหัสลับของคุณ' ไว้ในไฟล์ .env
    const token = jwt.sign(
      { 
        id: merchant.id, 
        role: 'merchant', 
        prefix: merchant.prefix 
      },
      process.env.JWT_SECRET || 'behind_north_bangkok_secret', 
      { expiresIn: '1d' } // Token มีอายุ 1 วัน
    );

    res.status(200).json({ 
      message: 'เข้าสู่ระบบสำเร็จ', 
      token,
      merchant: {
        id: merchant.id,
        username: merchant.username,
        store_name: merchant.store_name,
        prefix: merchant.prefix,
        image_url: merchant.store_image_url
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', error: error.message });
  }
};

exports.socialLoginMerchant = async (req, res) => {
  try {
    const { google_id, line_id, username, store_name, prefix } = req.body;

    // ตรวจสอบว่าส่ง ID ตัวใดตัวหนึ่งมาหรือไม่
    if (!google_id && !line_id) {
      return res.status(400).json({ message: 'ต้องระบุ Google ID หรือ LINE ID' });
    }

    // 1. ค้นหาว่ามีร้านค้านี้ในระบบแล้วหรือยัง
    let merchant = await db('merchants')
      .where(google_id ? { google_id } : { line_id })
      .first();

    // 2. ถ้ายังไม่มี ให้ทำการ "สมัครสมาชิกอัตโนมัติ" (ต้องส่งข้อมูลร้านพื้นฐานมาด้วย)
    if (!merchant) {
      if (!username || !store_name || !prefix) {
         return res.status(400).json({ 
           message: 'บัญชีนี้ยังไม่เคยลงทะเบียน กรุณาส่งข้อมูล username, store_name และ prefix เพื่อเปิดร้านใหม่' 
         });
      }

      // เช็คซ้ำว่า username หรือ prefix นี้มีคนอื่นใช้หรือยัง
      const existingUser = await db('merchants').where({ username }).orWhere({ prefix }).first();
      if (existingUser) {
        return res.status(400).json({ message: 'Username หรือ Prefix นี้ถูกใช้งานแล้ว' });
      }

      // สร้างร้านค้าใหม่
      const [newId] = await db('merchants').insert({
        username,
        google_id,
        line_id,
        store_name,
        prefix,
        is_open: false
      }).returning('id');

      merchant = await db('merchants').where('id', newId.id || newId).first();
    }

    // 3. สร้าง JWT Token ออกไปให้ใช้งาน
    const token = jwt.sign(
      { id: merchant.id, role: 'merchant', prefix: merchant.prefix },
      process.env.JWT_SECRET || 'behind_north_bangkok_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: 'เข้าสู่ระบบสำเร็จ', 
      token,
      merchant: {
        id: merchant.id,
        username: merchant.username,
        store_name: merchant.store_name,
        prefix: merchant.prefix
      }
    });

  } catch (error) {
    console.error('Social Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', error: error.message });
  }
};