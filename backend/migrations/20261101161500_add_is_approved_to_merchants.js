/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('MERCHANTS', 'is_approved');
  if (!hasColumn) {
    await knex.schema.alterTable('MERCHANTS', function(table) {
      table.boolean('is_approved').defaultTo(false).notNullable();
      table.timestamp('approved_at').nullable();
    });

    // อัปเดตร้านค้าเดิมที่มีอยู่แล้วในระบบให้ถือว่าผ่านการอนุมัติ เพื่อให้ระบบเดิมทำงานต่อได้ไม่สะดุด
    await knex('MERCHANTS').update({
      is_approved: true,
      approved_at: knex.fn.now()
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('MERCHANTS', 'is_approved');
  if (hasColumn) {
    await knex.schema.alterTable('MERCHANTS', function(table) {
      table.dropColumn('approved_at');
      table.dropColumn('is_approved');
    });
  }
};
