const repo = require('../repositories/merchantManagementRepository');
const { comparePassword, hashPassword } = require('../utils/hash');

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

exports.changePassword = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const currentHash = await repo.getPasswordHash(merchantId);
    if (!currentHash || !(await comparePassword(req.body.current_password, currentHash))) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }
    await repo.updatePassword(merchantId, await hashPassword(req.body.new_password));
    return res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { is_open } = req.body;
    const updated = await repo.updateStoreStatus(merchantId, is_open);
    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 2. Menu Controllers ---
exports.getMenus = async (req, res) => {
  try {
    const menus = await repo.getMenuItems(req.user.id);
    res.status(200).json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    const group = await repo.createOptionGroup(req.user.id, menu_id, { name, is_required, allow_multiple });
    if (!group) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.status(201).json({ success: true, data: group[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createOptionChoice = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { name, extra_price } = req.body;
    const choice = await repo.createOptionChoice(req.user.id, group_id, { name, extra_price });
    if (!choice) return res.status(404).json({ success: false, message: 'Option group not found' });
    res.status(201).json({ success: true, data: choice[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOptionGroup = async (req, res) => {
  try {
    const deleted = await repo.deleteOptionGroup(req.user.id, req.params.group_id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Option group not found' });
    return res.status(200).json({ success: true, message: 'Option group deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOptionChoice = async (req, res) => {
  try {
    const deleted = await repo.deleteOptionChoice(req.user.id, req.params.choice_id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Option not found' });
    return res.status(200).json({ success: true, message: 'Option deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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
