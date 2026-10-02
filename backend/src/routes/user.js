const express = require('express');
const router = express.Router();

// นำเข้า Middlewares
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// นำเข้า Repositories เพื่อมาดึงข้อมูล
const customerRepo = require('../repositories/customer');
const merchantRepo = require('../repositories/merchant');
const riderRepo = require('../repositories/rider');

// [GET] /api/users/me
// ดึงข้อมูลโปรไฟล์ของตัวเองตาม Token ที่ส่งมา
// อนุญาตให้ทั้ง 3 Roles เข้าถึงได้
router.get('/me', verifyToken, checkRole(['CUSTOMER', 'MERCHANT', 'RIDER']), async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let profile = null;

        // ค้นหาข้อมูลตาม Role
        if (role === 'CUSTOMER') {
            profile = await customerRepo.findCustomerById(userId); 
            // *หมายเหตุ: ต้องไปเพิ่มฟังก์ชัน findCustomerById ใน customer.repository.js ด้วยนะครับ
        } else if (role === 'MERCHANT') {
            profile = await merchantRepo.findMerchantById(userId);
        } else if (role === 'RIDER') {
            profile = await riderRepo.findRiderById(userId);
        }

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // ลบรหัสผ่านทิ้งก่อนส่งกลับไปหน้าบ้าน
        delete profile.password_hash;

        res.status(200).json({ profile });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;