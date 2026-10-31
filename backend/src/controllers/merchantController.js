const merchantRepository = require('../repositories/merchantRepository');

// GET /api/merchants
exports.getMerchants = async (req, res) => {
  try {
    const merchants = await merchantRepository.findAllOpenMerchants();
    return res.status(200).json({
      success: true,
      data: merchants,
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch merchants',
      error: error.message,
    });
  }
};

// GET /api/merchants/:merchant_id
exports.getMerchantById = async (req, res) => {
  try {
    const { merchant_id } = req.params;
    const merchant = await merchantRepository.findMerchantById(merchant_id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    console.error('Error fetching merchant details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch merchant details',
      error: error.message,
    });
  }
};

// GET /api/merchants/:merchant_id/menu
exports.getMerchantMenu = async (req, res) => {
  try {
    const { merchant_id } = req.params;

    // ตรวจสอบก่อนว่ามีร้านค้านี้อยู่จริงหรือไม่
    const merchant = await merchantRepository.findMerchantById(merchant_id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    const menuItems = await merchantRepository.findMenuItemsByMerchantId(merchant_id);
    return res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error('Error fetching merchant menu:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch merchant menu',
      error: error.message,
    });
  }
};

// GET /api/menus/:menu_item_id
exports.getMenuItemDetail = async (req, res) => {
  try {
    const { menu_item_id } = req.params;
    const menuItemDetail = await merchantRepository.findMenuItemDetailWithModifiers(menu_item_id);

    if (!menuItemDetail) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: menuItemDetail,
    });
  } catch (error) {
    console.error('Error fetching menu item detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item detail',
      error: error.message,
    });
  }
};