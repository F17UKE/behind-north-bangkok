const knex = require('../db');

const findCustomerByUsername = async (username) => {
    return await knex('customers').where({ username }).first();
};

const findCustomerByEmail = async (email) => {
    return await knex('customers').where({ email }).first();
};

const findCustomerBySocialId = async (provider, id) => {
    if (provider === 'google') return await knex('customers').where({ google_id: id }).first();
    if (provider === 'line') return await knex('customers').where({ line_id: id }).first();
    return null;
};

const createCustomer = async (customerData) => {
    const [newCustomer] = await knex('customers').insert(customerData).returning('*');
    return newCustomer;
};

// --- ฟังก์ชันที่เพิ่งเพิ่มใหม่ ---
const findCustomerById = async (id) => {
    return await knex('customers').where({ id }).first();
};

// --- ต้องแน่ใจว่าได้ export ฟังก์ชันทั้งหมดออกไปใช้งาน ---
module.exports = { 
    findCustomerByUsername, 
    findCustomerByEmail, 
    findCustomerBySocialId,
    createCustomer,
    findCustomerById 
};