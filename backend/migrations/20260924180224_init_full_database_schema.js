/**
 * @param { import("knex").Knex } knex
 * @returns { Promise }
 */
exports.up = async function (knex) {
  // 1. SOIS
  await knex.schema.createTable('sois', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
  });

  // 2. DORMITORIES
  await knex.schema.createTable('dormitories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('location');
    table.integer('soi_id').unsigned().references('id').inTable('sois').onDelete('CASCADE');
  });

  // 3. CUSTOMERS
  await knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').nullable();
    table.string('google_id').unique().nullable();
    table.string('line_id').unique().nullable();
    table.string('phone');
    table.string('room_number');
    table.string('profile_image_url');
    table.integer('dormitory_id').unsigned().references('id').inTable('dormitories').onDelete('SET NULL');
  });

  // 4. MERCHANTS (อัปเดต Social Login และ Password Nullable)
  await knex.schema.createTable('merchants', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password_hash').nullable(); // ปลดล็อกให้เป็นค่าว่างได้
    table.string('google_id').unique().nullable(); // เพิ่ม Google ID
    table.string('line_id').unique().nullable(); // เพิ่ม LINE ID
    table.string('store_name').notNullable();
    table.string('promptpay_id');
    table.string('prefix').unique().notNullable();
    table.integer('last_order_number').defaultTo(0);
    table.boolean('is_open').defaultTo(false);
    table.text('location');
    table.string('store_image_url');
  });

  // 5. MERCHANT_RIDERS
  await knex.schema.createTable('merchant_riders', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('full_name').notNullable();
    table.string('phone');
    table.boolean('is_active').defaultTo(true);
    table.integer('merchant_id').unsigned().references('id').inTable('merchants').onDelete('CASCADE');
  });

  // 6. DELIVERY_FEES
  await knex.schema.createTable('delivery_fees', (table) => {
    table.increments('id').primary();
    table.decimal('fee', 10, 2).notNullable();
    table.integer('merchant_id').unsigned().references('id').inTable('merchants').onDelete('CASCADE');
    table.integer('soi_id').unsigned().references('id').inTable('sois').onDelete('CASCADE');
  });

  // 7. MENU_ITEMS
  await knex.schema.createTable('menu_items', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.boolean('is_available').defaultTo(true);
    table.string('image_url');
    table.integer('merchant_id').unsigned().references('id').inTable('merchants').onDelete('CASCADE');
  });

  // 8. MENU_OPTION_GROUPS
  await knex.schema.createTable('menu_option_groups', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.boolean('is_required').defaultTo(false);
    table.boolean('allow_multiple').defaultTo(false);
    table.integer('menu_item_id').unsigned().references('id').inTable('menu_items').onDelete('CASCADE');
  });

  // 9. MENU_OPTION_CHOICES
  await knex.schema.createTable('menu_option_choices', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.decimal('extra_price', 10, 2).defaultTo(0);
    table.integer('option_group_id').unsigned().references('id').inTable('menu_option_groups').onDelete('CASCADE');
  });

  // 10. ORDERS
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_code').unique().notNullable();
    table.integer('merchant_order_number').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.decimal('delivery_fee', 10, 2).notNullable();
    table.string('status').notNullable().defaultTo('PENDING');
    table.integer('customer_last_read_message_id').defaultTo(0);
    table.integer('merchant_last_read_message_id').defaultTo(0);
    table.string('delivery_room_number');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE');
    table.integer('merchant_id').unsigned().references('id').inTable('merchants').onDelete('CASCADE');
    table.integer('delivery_dormitory_id').unsigned().references('id').inTable('dormitories').onDelete('SET NULL');
    table.integer('rider_id').unsigned().references('id').inTable('merchant_riders').onDelete('SET NULL');
  });

  // 11. ORDER_ITEMS
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.string('note');
    table.boolean('is_completed').defaultTo(false);
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('menu_item_id').unsigned().references('id').inTable('menu_items').onDelete('SET NULL');
  });

  // 12. ORDER_ITEM_CHOICES
  await knex.schema.createTable('order_item_choices', (table) => {
    table.increments('id').primary();
    table.string('choice_name').notNullable();
    table.decimal('extra_price', 10, 2).defaultTo(0);
    table.integer('order_item_id').unsigned().references('id').inTable('order_items').onDelete('CASCADE');
    table.integer('menu_option_choice_id').unsigned().references('id').inTable('menu_option_choices').onDelete('SET NULL');
  });

  // 13. PAYMENT_SLIPS
  await knex.schema.createTable('payment_slips', (table) => {
    table.increments('id').primary();
    table.string('image_url').notNullable();
    table.string('ref_number').unique();
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
  });

  // 14. MESSAGES
  await knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.boolean('is_merchant_sender').notNullable();
    table.string('sender_sub_role').defaultTo('STORE');
    table.string('message_type').defaultTo('TEXT');
    table.text('content_text');
    table.integer('call_duration_seconds');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise }
 */
exports.down = async function (knex) {
  // ลบตารางย้อนกลับตามลำดับความสัมพันธ์ (ป้องกัน Foreign Key Constraint Error)
  const tables = [
    'messages',
    'payment_slips',
    'order_item_choices',
    'order_items',
    'orders',
    'menu_option_choices',
    'menu_option_groups',
    'menu_items',
    'delivery_fees',
    'merchant_riders',
    'merchants',
    'customers',
    'dormitories',
    'sois'
  ];

  for (const tableName of tables) {
    await knex.schema.dropTableIfExists(tableName);
  }
};