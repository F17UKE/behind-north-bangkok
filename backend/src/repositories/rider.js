const knex = require('../db');

const findRiderByUsername = async (username) => {
    // Rider ต้อง Active เท่านั้นถึงจะ Login ได้
    return await knex('merchant_riders')
        .where({ username, is_active: true })
        .first();
};

const findRiderById = async (id) => {
    return await knex('merchant_riders').where({ id }).first();
};

// ดึงรายชื่อ Rider ทั้งหมดของร้านค้านั้นๆ
const findRidersByMerchantId = async (merchantId) => {
    return await knex('merchant_riders').where({ merchant_id: merchantId });
};

const checkUsernameExists = async (username) => {
    // เช็คว่าชื่อซ้ำไหม โดยไม่สนสถานะ is_active
    return await knex('merchant_riders').where({ username }).first();
};

const createRider = async (riderData) => {
    const [newRider] = await knex('merchant_riders').insert(riderData).returning('*');
    return newRider;
};

module.exports = {
    findRiderByUsername,
    findRiderById,
    findRidersByMerchantId,
    checkUsernameExists,
    createRider
};

