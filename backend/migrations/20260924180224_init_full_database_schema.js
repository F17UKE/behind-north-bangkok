/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// npx knex migrate:latest
// npx knex seed:run
// npx knex migrate:rollback --all
// npx knex seed:run --specific=01_locations.js
// สร้างร้านค้าขึ้นมา 2 ร้านก่อนค่อยรัน seed file 02
// npx knex seed:run --specific=02_menus.js

exports.up = async function(knex) {
  // 1. ตารางซอย (SOIS)
  await knex.schema.createTable('SOIS', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
  });

  // 2. ตารางหอพัก (DORMITORIES)
  await knex.schema.createTable('DORMITORIES', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('location');
    table.integer('soi_id').unsigned().references('id').inTable('SOIS').onDelete('CASCADE');
  });

  // 3. ตารางลูกค้า (CUSTOMERS)
  await knex.schema.createTable('CUSTOMERS', (table) => {
    table.increments('id').primary();
    table.string('username').unique();
    table.string('email').unique();
    table.string('password_hash');
    table.string('google_id').unique();
    table.string('line_id').unique();
    table.string('phone');
    table.string('room_number');
    table.string('profile_image_url');
    table.integer('dormitory_id').unsigned().references('id').inTable('DORMITORIES').onDelete('SET NULL');
  });

  // 4. ตารางร้านค้า (MERCHANTS)
  await knex.schema.createTable('MERCHANTS', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('store_name').notNullable();
    table.string('promptpay_id');
    table.string('prefix', 10).notNullable();
    table.integer('last_order_number').defaultTo(0);
    table.boolean('is_open').defaultTo(false);
    table.text('location');
    table.string('store_image_url');
  });

  // 5. ตารางพนักงานส่งอาหารประจำร้าน (MERCHANT_RIDERS)
  await knex.schema.createTable('MERCHANT_RIDERS', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('full_name').notNullable();
    table.string('phone');
    table.boolean('is_active').defaultTo(true);
    table.integer('merchant_id').unsigned().references('id').inTable('MERCHANTS').onDelete('CASCADE');
  });

  // 6. ตารางค่าจัดส่ง (DELIVERY_FEES)
  await knex.schema.createTable('DELIVERY_FEES', (table) => {
    table.increments('id').primary();
    table.decimal('fee', 8, 2).notNullable();
    table.integer('merchant_id').unsigned().references('id').inTable('MERCHANTS').onDelete('CASCADE');
    table.integer('soi_id').unsigned().references('id').inTable('SOIS').onDelete('CASCADE');
  });

  // 7. ตารางเมนูอาหาร (MENU_ITEMS)
  await knex.schema.createTable('MENU_ITEMS', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('price', 8, 2).notNullable();
    table.boolean('is_available').defaultTo(true);
    table.string('image_url');
    table.integer('merchant_id').unsigned().references('id').inTable('MERCHANTS').onDelete('CASCADE');
  });

  // 8. ตารางกลุ่มตัวเลือกเสริม (MENU_OPTION_GROUPS)
  await knex.schema.createTable('MENU_OPTION_GROUPS', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.boolean('is_required').defaultTo(false);
    table.boolean('allow_multiple').defaultTo(false);
    table.integer('menu_item_id').unsigned().references('id').inTable('MENU_ITEMS').onDelete('CASCADE');
  });

  // 9. ตารางตัวเลือกย่อย (MENU_OPTION_CHOICES)
  await knex.schema.createTable('MENU_OPTION_CHOICES', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.decimal('extra_price', 8, 2).notNullable().defaultTo(0.00);
    table.integer('option_group_id').unsigned().references('id').inTable('MENU_OPTION_GROUPS').onDelete('CASCADE');
  });

  // 10. ตารางคำสั่งซื้อ (ORDERS)
  await knex.schema.createTable('ORDERS', (table) => {
    table.increments('id').primary();
    table.string('order_code').unique().notNullable();
    table.integer('merchant_order_number').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.decimal('delivery_fee', 8, 2).notNullable();
    table.string('status').notNullable().defaultTo('PENDING_ACCEPT');
    table.integer('customer_last_read_message_id');
    table.integer('merchant_last_read_message_id');
    table.string('delivery_room_number');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign Keys
    table.integer('customer_id').unsigned().references('id').inTable('CUSTOMERS').onDelete('SET NULL');
    table.integer('merchant_id').unsigned().references('id').inTable('MERCHANTS').onDelete('CASCADE');
    table.integer('delivery_dormitory_id').unsigned().references('id').inTable('DORMITORIES').onDelete('SET NULL');
    table.integer('rider_id').unsigned().references('id').inTable('MERCHANT_RIDERS').onDelete('SET NULL');
  });

  // 11. ตารางรายการอาหารในคำสั่งซื้อ (ORDER_ITEMS)
  await knex.schema.createTable('ORDER_ITEMS', (table) => {
    table.increments('id').primary();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 8, 2).notNullable(); // Snapshot price
    table.string('note');
    table.boolean('is_completed').defaultTo(false);
    table.integer('order_id').unsigned().references('id').inTable('ORDERS').onDelete('CASCADE');
    table.integer('menu_item_id').unsigned().references('id').inTable('MENU_ITEMS').onDelete('SET NULL');
  });

  // 12. ตารางตัวเลือกเสริมในคำสั่งซื้อ (ORDER_ITEM_CHOICES)
  await knex.schema.createTable('ORDER_ITEM_CHOICES', (table) => {
    table.increments('id').primary();
    table.string('choice_name').notNullable(); // Snapshot choice name
    table.decimal('extra_price', 8, 2).notNullable(); // Snapshot extra price
    table.integer('order_item_id').unsigned().references('id').inTable('ORDER_ITEMS').onDelete('CASCADE');
    table.integer('menu_option_choice_id').unsigned().references('id').inTable('MENU_OPTION_CHOICES').onDelete('SET NULL');
  });

  // 13. ตารางสลิปการโอนเงิน (PAYMENT_SLIPS)
  await knex.schema.createTable('PAYMENT_SLIPS', (table) => {
    table.increments('id').primary();
    table.string('image_url').notNullable();
    table.string('ref_number').unique();
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('order_id').unsigned().references('id').inTable('ORDERS').onDelete('CASCADE');
  });

  // 14. ตารางข้อความแชท (MESSAGES)
  await knex.schema.createTable('MESSAGES', (table) => {
    table.increments('id').primary();
    table.boolean('is_merchant_sender').notNullable();
    table.string('sender_sub_role'); // 'STORE' หรือ 'RIDER'
    table.string('message_type').notNullable().defaultTo('TEXT');
    table.text('content_text');
    table.integer('call_duration_seconds');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('order_id').unsigned().references('id').inTable('ORDERS').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // ลบแบบย้อนกลับ (Reverse Order) เพื่อป้องกัน Foreign Key Constraints Error
  await knex.schema.dropTableIfExists('MESSAGES');
  await knex.schema.dropTableIfExists('PAYMENT_SLIPS');
  await knex.schema.dropTableIfExists('ORDER_ITEM_CHOICES');
  await knex.schema.dropTableIfExists('ORDER_ITEMS');
  await knex.schema.dropTableIfExists('ORDERS');
  await knex.schema.dropTableIfExists('MENU_OPTION_CHOICES');
  await knex.schema.dropTableIfExists('MENU_OPTION_GROUPS');
  await knex.schema.dropTableIfExists('MENU_ITEMS');
  await knex.schema.dropTableIfExists('DELIVERY_FEES');
  await knex.schema.dropTableIfExists('MERCHANT_RIDERS');
  await knex.schema.dropTableIfExists('MERCHANTS');
  await knex.schema.dropTableIfExists('CUSTOMERS');
  await knex.schema.dropTableIfExists('DORMITORIES');
  await knex.schema.dropTableIfExists('SOIS');
};