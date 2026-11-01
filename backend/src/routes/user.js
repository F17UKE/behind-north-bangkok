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
// อนุญาตให้ทุก Role เข้าถึงได้
router.get('/me', verifyToken, checkRole(['CUSTOMER', 'MERCHANT', 'RIDER', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let profile = null;

        // ค้นหาข้อมูลตาม Role
        if (role === 'CUSTOMER') {
            profile = await customerRepo.findCustomerById(userId); 
        } else if (role === 'MERCHANT') {
            profile = await merchantRepo.findMerchantById(userId);
        } else if (role === 'RIDER') {
            profile = await riderRepo.findRiderById(userId);
        } else if (role === 'ADMIN') {
            profile = {
                id: 0,
                username: req.user.username || 'admin',
                role: 'ADMIN'
            };
        }

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // ลบรหัสผ่านทิ้งก่อนส่งกลับไปหน้าบ้าน
        delete profile.password_hash;

        res.status(200).json({ success: true, profile });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// [PUT] /api/users/profile (สำหรับลูกค้าบันทึกหอพัก เลขห้อง และเบอร์โทรลง Database จริง)
router.put('/profile', verifyToken, checkRole(['CUSTOMER']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { dormitory_id, room_number, phone } = req.body;

        const updateData = {};
        if (dormitory_id !== undefined) updateData.dormitory_id = dormitory_id ? Number(dormitory_id) : null;
        if (room_number !== undefined) updateData.room_number = room_number ? String(room_number).trim() : null;
        if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;

        await customerRepo.updateCustomer(userId, updateData);
        const profile = await customerRepo.findCustomerById(userId);
        if (profile) delete profile.password_hash;

        res.status(200).json({ success: true, message: 'Profile updated successfully', profile });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
