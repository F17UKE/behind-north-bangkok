/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('MERCHANTS', function(table) {
    table.string('email').unique().nullable();
    table.string('google_id').unique().nullable();
    table.string('line_id').unique().nullable();
    table.string('password_hash').nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('MERCHANTS', function(table) {
    table.dropColumn('line_id');
    table.dropColumn('google_id');
    table.dropColumn('email');
    table.string('password_hash').notNullable().alter();
  });
};
