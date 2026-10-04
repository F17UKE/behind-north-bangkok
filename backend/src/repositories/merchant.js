const knex = require('../db');

const findMerchantByUsername = async (username) => {
    return await knex('MERCHANTS').where({ username }).first();
};

const findMerchantById = async (id) => {
    return await knex('MERCHANTS').where({ id }).first();
};

const findMerchantByPrefix = async (prefix) => {
    return await knex('MERCHANTS').where({ prefix }).first();
};

const createMerchant = async (merchantData) => {
    const [newMerchant] = await knex('MERCHANTS').insert(merchantData).returning('*');
    return newMerchant;
};

module.exports = {
    findMerchantByUsername,
    findMerchantById,
    findMerchantByPrefix,
    createMerchant
};

