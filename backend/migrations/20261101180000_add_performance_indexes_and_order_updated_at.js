/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. เพิ่มคอลัมน์ updated_at และ Indexes ให้กับตาราง ORDERS
  const hasUpdatedAt = await knex.schema.hasColumn('ORDERS', 'updated_at');
  if (!hasUpdatedAt) {
    await knex.schema.alterTable('ORDERS', function(table) {
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['status'], 'idx_orders_status');
      table.index(['customer_id'], 'idx_orders_customer_id');
      table.index(['merchant_id'], 'idx_orders_merchant_id');
      table.index(['rider_id'], 'idx_orders_rider_id');
      table.index(['created_at'], 'idx_orders_created_at');
    });
  }

  // 2. เพิ่ม Indexes สำหรับตาราง MESSAGES
  const hasMessagesTable = await knex.schema.hasTable('MESSAGES');
  if (hasMessagesTable) {
    await knex.schema.alterTable('MESSAGES', function(table) {
      table.index(['order_id', 'created_at'], 'idx_messages_order_created');
      table.index(['created_at'], 'idx_messages_created_at');
    });
  }

  // 3. เพิ่ม Indexes สำหรับตาราง PAYMENT_SLIPS
  const hasPaymentSlipsTable = await knex.schema.hasTable('PAYMENT_SLIPS');
  if (hasPaymentSlipsTable) {
    await knex.schema.alterTable('PAYMENT_SLIPS', function(table) {
      table.index(['order_id'], 'idx_payment_slips_order_id');
      table.index(['created_at'], 'idx_payment_slips_created_at');
    });
  }

  // 4. เพิ่ม Index ให้ ORDER_ITEMS
  const hasOrderItemsTable = await knex.schema.hasTable('ORDER_ITEMS');
  if (hasOrderItemsTable) {
    await knex.schema.alterTable('ORDER_ITEMS', function(table) {
      table.index(['order_id'], 'idx_order_items_order_id');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('ORDER_ITEMS', function(table) {
    table.dropIndex(['order_id'], 'idx_order_items_order_id');
  });

  await knex.schema.alterTable('PAYMENT_SLIPS', function(table) {
    table.dropIndex(['created_at'], 'idx_payment_slips_created_at');
    table.dropIndex(['order_id'], 'idx_payment_slips_order_id');
  });

  await knex.schema.alterTable('MESSAGES', function(table) {
    table.dropIndex(['created_at'], 'idx_messages_created_at');
    table.dropIndex(['order_id', 'created_at'], 'idx_messages_order_created');
  });

  await knex.schema.alterTable('ORDERS', function(table) {
    table.dropIndex(['created_at'], 'idx_orders_created_at');
    table.dropIndex(['rider_id'], 'idx_orders_rider_id');
    table.dropIndex(['merchant_id'], 'idx_orders_merchant_id');
    table.dropIndex(['customer_id'], 'idx_orders_customer_id');
    table.dropIndex(['status'], 'idx_orders_status');
    table.dropColumn('updated_at');
  });
};
