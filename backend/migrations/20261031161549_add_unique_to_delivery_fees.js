exports.up = function(knex) {
  return knex.schema.alterTable('DELIVERY_FEES', function(table) {
    table.unique(['merchant_id', 'soi_id'], 'unique_merchant_soi');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('DELIVERY_FEES', function(table) {
    table.dropUnique(['merchant_id', 'soi_id'], 'unique_merchant_soi');
  });
};