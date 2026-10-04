const knex = require('../db');

const findCustomerByUsername = async (username) => {
    return await knex('CUSTOMERS').where({ username }).first();
};

const findCustomerByEmail = async (email) => {
    return await knex('CUSTOMERS').where({ email }).first();
};

const findCustomerBySocialId = async (provider, id) => {
    if (provider === 'google') return await knex('CUSTOMERS').where({ google_id: id }).first();
    if (provider === 'line') return await knex('CUSTOMERS').where({ line_id: id }).first();
    return null;
};

const createCustomer = async (customerData) => {
    const [newCustomer] = await knex('CUSTOMERS').insert(customerData).returning('*');
    return newCustomer;
};

// --- ฟังก์ชันที่เพิ่งเพิ่มใหม่ ---
const findCustomerById = async (id) => {
    return await knex('CUSTOMERS').where({ id }).first();
};

// --- ต้องแน่ใจว่าได้ export ฟังก์ชันทั้งหมดออกไปใช้งาน ---
module.exports = { 
    findCustomerByUsername, 
    findCustomerByEmail, 
    findCustomerBySocialId,
    createCustomer,
    findCustomerById 
};