const repo = require('../repositories/merchantManagementRepository');

// --- 1. Profile Controllers ---
exports.getProfile = async (req, res) => {
  try {
    const merchantId = req.user.id; 
    const profile = await repo.getProfile(merchantId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { store_name, promptpay_id, location, store_image_url } = req.body;
    const updated = await repo.updateProfile(merchantId, { store_name, promptpay_id, location, store_image_url });
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { is_open } = req.body;

    // ตรวจสอบว่าร้านค้าได้รับการอนุมัติจาก Admin แล้วหรือยังก่อนเปิดรับออเดอร์
    const profile = await repo.getMerchantProfile(merchantId);
    if (is_open && profile && !profile.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'ร้านค้าของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ ยังไม่สามารถเปิดขายได้'
      });
    }

    const updated = await repo.updateStoreStatus(merchantId, is_open);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 2. Menu Controllers ---
exports.createMenu = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { name, description, price, is_available, image_url } = req.body;
    const newMenu = await repo.createMenuItem(merchantId, { name, description, price, is_available, image_url });
    res.status(201).json({ success: true, data: newMenu[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateMenuAvailability = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { menu_id } = req.params;
    const { is_available } = req.body;
    const updated = await repo.updateMenuAvailability(merchantId, menu_id, is_available);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { menu_id } = req.params;
    const { name, description, price, image_url } = req.body;
    
    // เรียกใช้ Repository เพื่ออัปเดตข้อมูลเมนู
    const updated = await repo.updateMenuItem(merchantId, menu_id, { 
      name, 
      description, 
      price, 
      image_url 
    });
    
    if (!updated || updated.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu not found or unauthorized to edit this menu' 
      });
    }

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { menu_id } = req.params;
    const deletedCount = await repo.deleteMenuItem(merchantId, menu_id);
    if (!deletedCount) {
      return res.status(404).json({ success: false, message: 'Menu not found or unauthorized to delete' });
    }
    res.status(200).json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 3. Option Controllers ---
exports.createOptionGroup = async (req, res) => {
  try {
    const { menu_id } = req.params;
    const { name, is_required, allow_multiple } = req.body;
    const group = await repo.createOptionGroup(menu_id, { name, is_required, allow_multiple });
    res.status(201).json({ success: true, data: group[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createOptionChoice = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { name, extra_price } = req.body;
    const choice = await repo.createOptionChoice(group_id, { name, extra_price });
    res.status(201).json({ success: true, data: choice[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 4. Delivery Fees Controllers ---
exports.getDeliveryFees = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const fees = await repo.getDeliveryFees(merchantId);
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDeliveryFee = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { soi_id, fee } = req.body;
    const updated = await repo.upsertDeliveryFee(merchantId, soi_id, fee);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
