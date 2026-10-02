const knex = require('../db');

const findMerchantByUsername = async (username) => {
    return await knex('merchants').where({ username }).first();
};

const findMerchantById = async (id) => {
    return await knex('merchants').where({ id }).first();
};

const createMerchant = async (merchantData) => {
    const [newMerchant] = await knex('merchants').insert(merchantData).returning('*');
    return newMerchant;
};

module.exports = {
    findMerchantByUsername,
    findMerchantById,
    createMerchant
};

