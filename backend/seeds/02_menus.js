// npx knex seed:run --specific=02_menus.js

exports.seed = async function(knex) {
  await knex('menu_option_choices').del();
  await knex('menu_option_groups').del();
  await knex('menu_items').del();
  await knex('delivery_fees').del();
  
  // 1. ค่าจัดส่ง (Delivery Fees)
  await knex('delivery_fees').insert([
    { id: 1, fee: 10.00, merchant_id: 1, soi_id: 1 }, 
    { id: 2, fee: 15.00, merchant_id: 1, soi_id: 2 }, 
    { id: 3, fee: 10.00, merchant_id: 2, soi_id: 1 }  
  ]);

  // 2. เมนูอาหาร (Menu Items)
  await knex('menu_items').insert([
    { id: 1, name: 'กะเพราหมูกรอบ', description: 'หมูกรอบทำเอง', price: 55.00, is_available: true, merchant_id: 1 },
    { id: 2, name: 'ชานมเย็น', description: 'ชานมหอมหวานชื่นใจ', price: 45.00, is_available: true, merchant_id: 2 }
  ]);

  // 3. กลุ่มตัวเลือกเสริม (Menu Option Groups)
  await knex('menu_option_groups').insert([
    { id: 1, name: 'ระดับความเผ็ด', is_required: true, allow_multiple: false, menu_item_id: 1 },
    { id: 2, name: 'ท็อปปิ้งเพิ่มเติม', is_required: false, allow_multiple: true, menu_item_id: 1 },
    { id: 3, name: 'ระดับความหวาน', is_required: true, allow_multiple: false, menu_item_id: 2 }
  ]);

  // 4. ตัวเลือกย่อย (Menu Option Choices)
  await knex('menu_option_choices').insert([
    { id: 1, name: 'เผ็ดน้อย', extra_price: 0.00, option_group_id: 1 },
    { id: 2, name: 'เผ็ดปกติ', extra_price: 0.00, option_group_id: 1 },
    { id: 3, name: 'ไข่ดาว', extra_price: 10.00, option_group_id: 2 },
    { id: 4, name: 'ไข่เจียว', extra_price: 12.00, option_group_id: 2 },
    { id: 5, name: 'หวานปกติ (100%)', extra_price: 0.00, option_group_id: 3 },
    { id: 6, name: 'หวานน้อย (50%)', extra_price: 0.00, option_group_id: 3 }
  ]);
};