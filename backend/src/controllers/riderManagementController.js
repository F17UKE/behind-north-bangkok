const repo = require('../repositories/riderManagementRepository');
// สมมติว่ามีฟังก์ชันแฮชรหัสผ่านเตรียมไว้ใน src/utils/hash.js
const { hashPassword } = require('../utils/hash'); 

exports.createRider = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { username, password, full_name, phone } = req.body;

    // ตรวจสอบ Username ซ้ำ (เนื่องจากตั้งเป็น Unique Key ไว้)
    const isExist = await repo.checkUsernameExists(username);
    if (isExist) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // แฮชรหัสผ่านเพื่อความปลอดภัย
    const password_hash = await hashPassword(password);

    const newRider = await repo.createRider({
      username,
      password_hash,
      full_name,
      phone,
      is_active: true, // ค่าเริ่มต้นเป็นพร้อมรับงาน
      merchant_id: merchantId
    });

    res.status(201).json({ success: true, data: newRider[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRiders = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const riders = await repo.getRidersByMerchant(merchantId);
    res.status(200).json({ success: true, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRiderStatus = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { rider_id } = req.params;
    const { is_active } = req.body;

    const updated = await repo.updateRiderStatus(merchantId, rider_id, is_active);

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Rider not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};