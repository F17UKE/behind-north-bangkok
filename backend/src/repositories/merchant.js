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

const findMerchantByEmail = async (email) => {
    return await knex('MERCHANTS').where({ email }).first();
};

const findMerchantBySocialId = async (provider, id) => {
    if (provider === 'google') return await knex('MERCHANTS').where({ google_id: id }).first();
    if (provider === 'line') return await knex('MERCHANTS').where({ line_id: id }).first();
    return null;
};

const linkMerchantSocial = async (merchantId, provider, socialId) => {
    const updateData = {};
    if (provider === 'google') updateData.google_id = socialId;
    if (provider === 'line') updateData.line_id = socialId;
    return await knex('MERCHANTS').where('id', merchantId).update(updateData).returning('*');
};

const createMerchant = async (merchantData) => {
    const [newMerchant] = await knex('MERCHANTS').insert(merchantData).returning('*');
    return newMerchant;
};

module.exports = {
    findMerchantByUsername,
    findMerchantById,
    findMerchantByPrefix,
    findMerchantByEmail,
    findMerchantBySocialId,
    linkMerchantSocial,
    createMerchant
};
