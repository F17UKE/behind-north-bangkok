// backend/src/controllers/adminController.js
const knex = require('../db');

const getUsers = async (req, res) => {
    try {
        const [customers, merchants] = await Promise.all([
            knex('CUSTOMERS').select('id', 'username', 'email', 'phone'),
            knex('MERCHANTS').select('id', 'username', 'email', 'store_name', 'is_approved', 'is_open')
        ]);
        const users = [
            ...customers.map((user) => ({ ...user, role: 'CUSTOMER', name: user.username, status: 'active' })),
            ...merchants.map((user) => ({ ...user, role: 'MERCHANT', name: user.store_name, status: user.is_approved ? 'active' : 'pending' }))
        ];
        return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

/**
 * [GET] /api/admin/merchants/pending
 * ดึงรายการร้านค้าทั้งหมดที่รอการอนุมัติ (is_approved = false)
 */
const getPendingMerchants = async (req, res) => {
    try {
        const merchants = await knex('MERCHANTS')
            .where('is_approved', false)
            .select(
                'id',
                'username',
                'store_name',
                'promptpay_id',
                'prefix',
                'location',
                'store_image_url',
                'is_approved',
                'is_open'
            )
            .orderBy('id', 'desc');

        return res.status(200).json({
            success: true,
            count: merchants.length,
            data: merchants
        });
    } catch (error) {
        console.error('Error fetching pending merchants:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch pending merchants' });
    }
};

/**
 * [GET] /api/admin/merchants
 * ดึงรายการร้านค้าทั้งหมด พร้อมสถานะการอนุมัติ
 */
const getAllMerchants = async (req, res) => {
    try {
        const merchants = await knex('MERCHANTS')
            .select(
                'id',
                'username',
                'store_name',
                'category',
                'promptpay_id',
                'prefix',
                'location',
                'store_image_url',
                'is_approved',
                'is_open'
            )
            .orderBy('id', 'desc');

        return res.status(200).json({
            success: true,
            count: merchants.length,
            data: merchants
        });
    } catch (error) {
        console.error('Error fetching all merchants:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch merchants' });
    }
};

const getMerchantMenus = async (req, res) => {
    try {
        const merchantId = Number(req.params.merchant_id);
        const merchant = await knex('MERCHANTS')
            .select('id', 'store_name')
            .where('id', merchantId)
            .first();
        if (!merchant) {
            return res.status(404).json({ success: false, error: 'Merchant not found' });
        }

        const menus = await knex('MENU_ITEMS')
            .select('id', 'name', 'description', 'price', 'is_available', 'image_url', 'merchant_id')
            .where('merchant_id', merchantId)
            .orderBy('name');
        const menuIds = menus.map((menu) => menu.id);
        const groups = menuIds.length
            ? await knex('MENU_OPTION_GROUPS')
                .select('id', 'name', 'is_required', 'allow_multiple', 'menu_item_id')
                .whereIn('menu_item_id', menuIds)
                .orderBy('id')
            : [];
        const groupIds = groups.map((group) => group.id);
        const choices = groupIds.length
            ? await knex('MENU_OPTION_CHOICES')
                .select('id', 'name', 'extra_price', 'option_group_id')
                .whereIn('option_group_id', groupIds)
                .orderBy('id')
            : [];
        const data = menus.map((menu) => ({
            ...menu,
            option_groups: groups
                .filter((group) => group.menu_item_id === menu.id)
                .map((group) => ({
                    ...group,
                    choices: choices.filter((choice) => choice.option_group_id === group.id)
                }))
        }));

        return res.status(200).json({ success: true, merchant, count: data.length, data });
    } catch (error) {
        console.error('Error fetching merchant menus for admin:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch merchant menus' });
    }
};

/**
 * [PATCH] /api/admin/merchants/:merchant_id/approve
 * อนุมัติร้านค้าให้เปิดใช้งานในระบบได้
 */
const approveMerchant = async (req, res) => {
    try {
        const { merchant_id } = req.params;

        const merchant = await knex('MERCHANTS').where('id', merchant_id).first();
        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        const [updated] = await knex('MERCHANTS')
            .where('id', merchant_id)
            .update({
                is_approved: true,
                approved_at: knex.fn.now()
            })
            .returning(['id', 'username', 'store_name', 'is_approved', 'is_open']);

        // ส่งสัญญาณแจ้งเตือนร้านค้าผ่าน Socket.io ทันที
        const io = req.app.get('io');
        if (io) {
            io.to(`merchant_${merchant_id}`).emit('STORE_APPROVAL_STATUS', {
                merchant_id: Number(merchant_id),
                is_approved: true,
                message: 'Your store has been approved by admin!'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Store '${updated.store_name}' approved successfully`,
            data: updated
        });
    } catch (error) {
        console.error('Error approving merchant:', error);
        return res.status(500).json({ success: false, error: 'Failed to approve merchant' });
    }
};

/**
 * [PATCH] /api/admin/merchants/:merchant_id/reject
 * ปฏิเสธหรือระงับการอนุมัติร้านค้า
 */
const rejectMerchant = async (req, res) => {
    try {
        const { merchant_id } = req.params;

        const merchant = await knex('MERCHANTS').where('id', merchant_id).first();
        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant not found' });
        }

        const [updated] = await knex('MERCHANTS')
            .where('id', merchant_id)
            .update({
                is_approved: false,
                is_open: false // สั่งปิดร้านทันทีเมื่อไม่ผ่านการอนุมัติ
            })
            .returning(['id', 'username', 'store_name', 'is_approved', 'is_open']);

        // ส่งสัญญาณแจ้งเตือนร้านค้าผ่าน Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`merchant_${merchant_id}`).emit('STORE_APPROVAL_STATUS', {
                merchant_id: Number(merchant_id),
                is_approved: false,
                message: 'Your store approval was rejected or suspended.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Store '${updated.store_name}' has been rejected / suspended`,
            data: updated
        });
    } catch (error) {
        console.error('Error rejecting merchant:', error);
        return res.status(500).json({ success: false, error: 'Failed to reject merchant' });
    }
};

module.exports = {
    getUsers,
    getPendingMerchants,
    getAllMerchants,
    getMerchantMenus,
    approveMerchant,
    rejectMerchant
};
