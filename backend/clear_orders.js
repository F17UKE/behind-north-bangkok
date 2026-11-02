const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const knex = require('./src/db');

async function clearOrders() {
    console.log('🔄 Clearing all orders from database...');
    const trx = await knex.transaction();
    try {
        const deletedChoices = await trx('ORDER_ITEM_CHOICES').del();
        console.log(`- Deleted ${deletedChoices} ORDER_ITEM_CHOICES`);

        const deletedItems = await trx('ORDER_ITEMS').del();
        console.log(`- Deleted ${deletedItems} ORDER_ITEMS`);

        const deletedSlips = await trx('PAYMENT_SLIPS').del();
        console.log(`- Deleted ${deletedSlips} PAYMENT_SLIPS`);

        const deletedMessages = await trx('MESSAGES').del();
        console.log(`- Deleted ${deletedMessages} MESSAGES`);

        const deletedOrders = await trx('ORDERS').del();
        console.log(`- Deleted ${deletedOrders} ORDERS`);

        const updatedMerchants = await trx('MERCHANTS').update({ last_order_number: 0 });
        console.log(`- Reset last_order_number for ${updatedMerchants} MERCHANTS`);

        await trx.commit();
        console.log('✅ All order data cleared successfully!');
    } catch (error) {
        await trx.rollback();
        console.error('❌ Failed to clear orders:', error);
    } finally {
        await knex.destroy();
    }
}

clearOrders();
