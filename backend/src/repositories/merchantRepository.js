const db = require('../db');

class MerchantRepository {
  // 1. ดึงรายการร้านค้าทั้งหมดที่เปิดให้บริการ (is_open = true)
  async findAllOpenMerchants() {
    return await db('MERCHANTS')
      .select('id', 'store_name', 'prefix', 'is_open', 'location', 'store_image_url')
      .where('is_open', true);
  }

  // 2. ดึงข้อมูลรายละเอียดร้านค้าเดี่ยวตาม merchant_id
  async findMerchantById(merchantId) {
    return await db('MERCHANTS')
      .select('id', 'store_name', 'promptpay_id', 'prefix', 'is_open', 'location', 'store_image_url')
      .where('id', merchantId)
      .first();
  }

  // 3. ดึงรายการเมนูอาหารทั้งหมดของร้านค้าเฉพาะรายการที่พร้อมขาย (is_available = true)
  async findMenuItemsByMerchantId(merchantId) {
    return await db('MENU_ITEMS')
      .select('id', 'name', 'description', 'price', 'is_available', 'image_url', 'merchant_id')
      .where({
        merchant_id: merchantId,
        is_available: true,
      });
  }

  // 4. ดึงข้อมูลรายละเอียดเมนูเดี่ยว พร้อมกลุ่มตัวเลือกเสริม (Option Groups) และตัวเลือกย่อย (Option Choices)
  async findMenuItemDetailWithModifiers(menuItemId) {
    // ดึงข้อมูลเมนูหลัก
    const menuItem = await db('MENU_ITEMS')
      .select('id', 'name', 'description', 'price', 'is_available', 'image_url', 'merchant_id')
      .where('id', menuItemId)
      .first();

    if (!menuItem) return null;

    // ดึงกลุ่มตัวเลือกเสริม (Option Groups)
    const optionGroups = await db('MENU_OPTION_GROUPS')
      .select('id', 'name', 'is_required', 'allow_multiple')
      .where('menu_item_id', menuItemId);

    // ดึงตัวเลือกย่อย (Choices) สำหรับทุกกลุ่ม
    const groupIds = optionGroups.map((g) => g.id);
    let choices = [];
    if (groupIds.length > 0) {
      choices = await db('MENU_OPTION_CHOICES')
        .select('id', 'name', 'extra_price', 'option_group_id')
        .whereIn('option_group_id', groupIds);
    }

    // ประกอบโครงสร้าง Hierarchical Tree
    const formattedGroups = optionGroups.map((group) => {
      return {

        ...group,
        choices: choices.filter((choice) => choice.option_group_id === group.id),
      };
    });

    return {
      ...menuItem,
      option_groups: formattedGroups,
    };
  }
}

module.exports = new MerchantRepository();