const db = require('../db');

class MerchantManagementRepository {
  // --- 1. Store Profile Management ---
  async getProfile(merchantId) {
    return await db('MERCHANTS')
      .select('id', 'username', 'store_name', 'promptpay_id', 'prefix', 'is_approved', 'is_open', 'location', 'store_image_url')
      .where('id', merchantId)
      .first();
  }

  async getPasswordHash(merchantId) {
    const merchant = await db('MERCHANTS').select('password_hash').where('id', merchantId).first();
    return merchant?.password_hash || null;
  }

  async updatePassword(merchantId, passwordHash) {
    return db('MERCHANTS').where('id', merchantId).update({ password_hash: passwordHash });
  }

  async updateProfile(merchantId, profileData) {
    return await db('MERCHANTS')
      .where('id', merchantId)
      .update(profileData)
      .returning(['id', 'store_name', 'promptpay_id', 'location']);
  }

  async updateStoreStatus(merchantId, isOpen) {
    return await db('MERCHANTS')
      .where('id', merchantId)
      .update({ is_open: isOpen })
      .returning(['id', 'is_open']);
  }

  // --- 2. Menu Management ---
  async getMenuItems(merchantId) {
    return await db('MENU_ITEMS').where('merchant_id', merchantId).orderBy('id', 'desc');
  }

  async createMenuItem(merchantId, menuData) {
    return await db('MENU_ITEMS')
      .insert({ ...menuData, merchant_id: merchantId })
      .returning('*');
  }

  async updateMenuItem(merchantId, menuId, menuData) {
    return await db('MENU_ITEMS')
      .where({ id: menuId, merchant_id: merchantId })
      .update(menuData)
      .returning('*');
  }

  async updateMenuAvailability(merchantId, menuId, isAvailable) {
    return await db('MENU_ITEMS')
      .where({ id: menuId, merchant_id: merchantId })
      .update({ is_available: isAvailable })
      .returning(['id', 'name', 'is_available']);
  }

  async deleteMenuItem(merchantId, menuId) {
    return await db('MENU_ITEMS')
      .where({ id: menuId, merchant_id: merchantId })
      .del();
  }

  // --- 3. Option Groups & Choices ---
  async createOptionGroup(menuId, groupData) {
    return await db('MENU_OPTION_GROUPS')
      .insert({ ...groupData, menu_item_id: menuId })
      .returning('*');
  }

  async createOptionChoice(groupId, choiceData) {
    return await db('MENU_OPTION_CHOICES')
      .insert({ ...choiceData, option_group_id: groupId })
      .returning('*');
  }

  // --- 4. Delivery Fees Management ---
  async getDeliveryFees(merchantId) {
    return await db('DELIVERY_FEES')
      .join('SOIS', 'DELIVERY_FEES.soi_id', 'SOIS.id')
      .select('DELIVERY_FEES.id', 'DELIVERY_FEES.fee', 'SOIS.id as soi_id', 'SOIS.name as soi_name')
      .where('DELIVERY_FEES.merchant_id', merchantId);
  }

  async upsertDeliveryFee(merchantId, soiId, fee) {
    // ใช้ onConflict สำหรับ Update หากมี soi_id นี้ของร้านค้านี้อยู่แล้ว
    return await db('DELIVERY_FEES')
      .insert({ merchant_id: merchantId, soi_id: soiId, fee: fee })
      .onConflict(['merchant_id', 'soi_id']) // ต้องมีการทำ Composite Unique constraint ใน DB
      .merge(['fee'])
      .returning('*');
  }
}

module.exports = new MerchantManagementRepository();
