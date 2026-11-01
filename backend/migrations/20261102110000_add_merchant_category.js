exports.up = async function (knex) {
  await knex.schema.alterTable('MERCHANTS', (table) => {
    table.string('category', 80).notNullable().defaultTo('ร้านอาหาร');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('MERCHANTS', (table) => {
    table.dropColumn('category');
  });
};
