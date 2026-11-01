const db = require('../db');

class MerchantManagementRepository {
  // --- 1. Store Profile Management ---
  async getProfile(merchantId) {
    return await db('MERCHANTS')
      .select('id', 'username', 'store_name', 'promptpay_id', 'prefix', 'is_open', 'location', 'store_image_url')
      .where('id', merchantId)
      .first();
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
  async getMerchantMenus(merchantId) {
    const menus = await db('MENU_ITEMS')
      .where('merchant_id', merchantId)
      .orderBy('id', 'asc');

    const menuIds = menus.map(m => m.id);
    if (menuIds.length === 0) return [];

    const optionGroups = await db('MENU_OPTION_GROUPS')
      .whereIn('menu_item_id', menuIds);
    const groupIds = optionGroups.map(g => g.id);

    const choices = groupIds.length > 0
      ? await db('MENU_OPTION_CHOICES').whereIn('option_group_id', groupIds)
      : [];

    const groupsWithChoices = optionGroups.map(group => ({
      ...group,
      choices: choices.filter(c => c.option_group_id === group.id)
    }));

    return menus.map(menu => ({
      ...menu,
      option_groups: groupsWithChoices.filter(g => g.menu_item_id === menu.id)
    }));
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

  async deleteOptionGroup(groupId) {
    return await db('MENU_OPTION_GROUPS')
      .where('id', groupId)
      .del();
  }

  async createOptionChoice(groupId, choiceData) {
    return await db('MENU_OPTION_CHOICES')
      .insert({ ...choiceData, option_group_id: groupId })
      .returning('*');
  }

  async deleteOptionChoice(choiceId) {
    return await db('MENU_OPTION_CHOICES')
      .where('id', choiceId)
      .del();
  }

  // --- 4. Delivery Fees Management ---
  async getDeliveryFees(merchantId) {
    return await db('DELIVERY_FEES')
      .join('SOIS', 'DELIVERY_FEES.soi_id', 'SOIS.id')
      .select('DELIVERY_FEES.id', 'DELIVERY_FEES.fee', 'SOIS.id as soi_id', 'SOIS.name as soi_name')
      .where('DELIVERY_FEES.merchant_id', merchantId);
  }

  async upsertDeliveryFee(merchantId, soiId, fee) {
    return await db('DELIVERY_FEES')
      .insert({ merchant_id: merchantId, soi_id: soiId, fee: fee })
      .onConflict(['merchant_id', 'soi_id'])
      .merge(['fee'])
      .returning('*');
  }
}

module.exports = new MerchantManagementRepository();
