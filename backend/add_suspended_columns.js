const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const knex = require('./src/db');

async function addSuspendedColumns() {
  console.log('🔄 Checking is_suspended columns...');
  
  const hasMerchantSuspended = await knex.schema.hasColumn('MERCHANTS', 'is_suspended');
  if (!hasMerchantSuspended) {
    await knex.schema.alterTable('MERCHANTS', function(table) {
      table.boolean('is_suspended').defaultTo(false);
    });
    console.log('✅ Added is_suspended column to MERCHANTS');
  } else {
    console.log('ℹ️ MERCHANTS already has is_suspended column');
  }

  const hasCustomerSuspended = await knex.schema.hasColumn('CUSTOMERS', 'is_suspended');
  if (!hasCustomerSuspended) {
    await knex.schema.alterTable('CUSTOMERS', function(table) {
      table.boolean('is_suspended').defaultTo(false);
    });
    console.log('✅ Added is_suspended column to CUSTOMERS');
  } else {
    console.log('ℹ️ CUSTOMERS already has is_suspended column');
  }

  process.exit(0);
}

addSuspendedColumns();
