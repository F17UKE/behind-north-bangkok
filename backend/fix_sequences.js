const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const knex = require('./src/db');

async function fixSequences() {
  const tables = [
    { table: 'MERCHANTS', seq: 'MERCHANTS_id_seq' },
    { table: 'CUSTOMERS', seq: 'CUSTOMERS_id_seq' },
    { table: 'MERCHANT_RIDERS', seq: 'MERCHANT_RIDERS_id_seq' },
    { table: 'ORDERS', seq: 'ORDERS_id_seq' },
    { table: 'MENU_ITEMS', seq: 'MENU_ITEMS_id_seq' },
    { table: 'DELIVERY_FEES', seq: 'DELIVERY_FEES_id_seq' },
    { table: 'DORMITORIES', seq: 'DORMITORIES_id_seq' },
    { table: 'SOIS', seq: 'SOIS_id_seq' },
    { table: 'MENU_OPTION_GROUPS', seq: 'MENU_OPTION_GROUPS_id_seq' },
    { table: 'MENU_OPTION_CHOICES', seq: 'MENU_OPTION_CHOICES_id_seq' },
    { table: 'PAYMENT_SLIPS', seq: 'PAYMENT_SLIPS_id_seq' },
    { table: 'MESSAGES', seq: 'MESSAGES_id_seq' }
  ];

  for (const { table, seq } of tables) {
    try {
      const maxRes = await knex(table).max('id as max_id').first();
      const maxId = Number(maxRes?.max_id || 0);
      const nextVal = Math.max(maxId, 1);
      await knex.raw(`SELECT setval('"${seq}"', ${nextVal}, true);`);
      console.log(`✅ Fixed sequence for ${table} -> nextval will start after ${nextVal}`);
    } catch (e) {
      console.warn(`Could not fix ${seq}:`, e.message);
    }
  }
  process.exit(0);
}

fixSequences();
